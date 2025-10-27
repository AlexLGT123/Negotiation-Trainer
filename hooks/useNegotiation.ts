
import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed `LiveSession` as it is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { SessionState, TranscriptionEntry, NegotiationResult, NegotiationConfig } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audio';

export const useNegotiation = () => {
    const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<NegotiationResult | null>(null);
    
    // FIX: Changed `Promise<LiveSession>` to `Promise<any>` because `LiveSession` is not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef(0);
    const audioPlaybackSources = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanup = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        
        audioPlaybackSources.current.forEach(source => source.stop());
        audioPlaybackSources.current.clear();
        nextStartTimeRef.current = 0;
        
        sessionPromiseRef.current = null;
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const startSession = useCallback(async (systemInstruction: string) => {
        setSessionState(SessionState.CONNECTING);
        setError(null);
        setResult(null);
        setTranscriptionHistory([]);
        setCurrentInput('');
        setCurrentOutput('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // FIX: Cast `window` to `any` to allow access to the vendor-prefixed `webkitAudioContext` for broader browser support.
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setSessionState(SessionState.LISTENING);
                        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        // FIX: Cast `window` to `any` to allow access to the vendor-prefixed `webkitAudioContext`.
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        
                        sourceNodeRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        sourceNodeRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription += text;
                            setCurrentInput(currentInputTranscription);
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscription += text;
                            setCurrentOutput(currentOutputTranscription);
                        }

                        if (message.serverContent?.turnComplete) {
                            setTranscriptionHistory(prev => [
                                ...prev,
                                { speaker: 'user', text: currentInputTranscription },
                                { speaker: 'ai', text: currentOutputTranscription }
                            ]);
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                            setCurrentInput('');
                            setCurrentOutput('');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            setSessionState(SessionState.AI_SPEAKING);
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            
                            source.onended = () => {
                                audioPlaybackSources.current.delete(source);
                                if (audioPlaybackSources.current.size === 0) {
                                    setSessionState(SessionState.LISTENING);
                                }
                            };
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioPlaybackSources.current.add(source);
                        }
                        
                        if(message.serverContent?.interrupted){
                            audioPlaybackSources.current.forEach(source => source.stop());
                            audioPlaybackSources.current.clear();
                            nextStartTimeRef.current = 0;
                            if(sessionState !== SessionState.LISTENING) {
                                setSessionState(SessionState.LISTENING);
                            }
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('An error occurred during the session. Please try again.');
                        setSessionState(SessionState.ERROR);
                        cleanup();
                    },
                    onclose: () => {
                         // Session might close naturally or due to an error. State is handled in endSession/onerror.
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: systemInstruction,
                }
            });

            await sessionPromiseRef.current;

        } catch (err) {
            console.error('Failed to start session:', err);
            setError('Could not start the negotiation session. Please check microphone permissions.');
            setSessionState(SessionState.ERROR);
            cleanup();
        }
    }, [cleanup, sessionState]);

    const endSession = useCallback(async (config: NegotiationConfig) => {
        setSessionState(SessionState.ANALYZING);
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch(e) {
                console.error("Error closing session:", e);
            }
        }
        cleanup();
        
        const history = [...transcriptionHistory];
        if (currentInput) history.push({ speaker: 'user', text: currentInput });
        if (currentOutput) history.push({ speaker: 'ai', text: currentOutput });

        if (history.length === 0) {
            setResult({
                score: 0,
                feedback: "No conversation was recorded. Please try the simulation again.",
                xpGained: 10,
                keyStrengths: [],
                areasForImprovement: ["Start a conversation next time."]
            });
            setSessionState(SessionState.ENDED);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const transcript = history.map(entry => `${entry.speaker === 'user' ? 'User' : 'AI'}: ${entry.text}`).join('\n');
            
            const prompt = `You are a world-class negotiation coach. Your task is to analyze a negotiation transcript and provide a performance review.

            Here is the context of the negotiation:
            - User's Role: ${config.userRole}
            - User's Primary Objective: ${config.userTarget}
            - Counterpart's (AI) Primary Objective: ${config.aiTarget}
            - Additional Context: ${config.context}

            Here is the full transcript of the negotiation:
            ${transcript}

            Based on the context and the transcript, please provide the following in a JSON format:
            1.  A "score" from 0 to 100, where 100 is a perfect negotiation by the user. The score should reflect how effectively the user pursued their objectives, the quality of their arguments, their adaptability, and the final outcome implied by the conversation.
            2.  A "feedback" paragraph summarizing the user's overall performance.
            3.  A list of "keyStrengths" (2-3 bullet points) highlighting what the user did well.
            4.  A list of "areasForImprovement" (2-3 bullet points) with actionable advice on what the user could do better next time.`;

            const schema = {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER, description: "A score from 0 to 100 representing the user's negotiation performance." },
                    feedback: { type: Type.STRING, description: "A concise paragraph summarizing the user's overall performance." },
                    keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of strings, each describing a key strength the user demonstrated." },
                    areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of strings, each providing an actionable area for improvement." }
                },
                required: ['score', 'feedback', 'keyStrengths', 'areasForImprovement']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const resultJson = JSON.parse(response.text);
            
            setResult({
                score: resultJson.score,
                feedback: resultJson.feedback,
                xpGained: 50 + resultJson.score,
                keyStrengths: resultJson.keyStrengths,
                areasForImprovement: resultJson.areasForImprovement,
            });

        } catch (e) {
            console.error("Failed to generate feedback:", e);
            setResult({
                score: Math.floor(Math.random() * 21) + 70,
                feedback: "You did a great job! We had an issue generating detailed feedback, but you've completed the simulation.",
                xpGained: 150,
                keyStrengths: ["Good effort in completing the scenario."],
                areasForImprovement: ["Try again to get a detailed, AI-powered analysis of your performance."]
            });
        } finally {
            setSessionState(SessionState.ENDED);
        }

    }, [cleanup, transcriptionHistory, currentInput, currentOutput]);

    return { 
        sessionState, 
        transcriptionHistory, 
        currentInput, 
        currentOutput, 
        error, 
        result,
        startSession, 
        endSession 
    };
};