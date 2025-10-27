
import React, { useEffect } from 'react';
import { useNegotiation } from '../hooks/useNegotiation';
import { SessionState, TranscriptionEntry, NegotiationConfig, NegotiationResult } from '../types';
import { MicIcon, StopIcon, BotIcon, UserIcon } from './icons/Icons';
import { Translation } from '../translations';
import { StrategySidebar } from './StrategySidebar';

const TranscriptionBubble: React.FC<{ entry: TranscriptionEntry }> = ({ entry }) => {
    const isUser = entry.speaker === 'user';
    return (
        <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500">
                    <BotIcon className="w-6 h-6 text-cyan-400" />
                </div>
            )}
            <div className={`max-w-md p-4 rounded-2xl shadow-md ${isUser ? 'bg-indigo-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="text-white">{entry.text}</p>
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center border border-gray-500">
                    <UserIcon className="w-6 h-6 text-gray-300" />
                </div>
            )}
        </div>
    );
};

const StatusIndicator: React.FC<{ state: SessionState; t: Translation }> = ({ state, t }) => {
    let text = t.statusReady;
    let color = "text-gray-400";
    let pulse = false;

    const statusMap = {
        [SessionState.CONNECTING]: { text: t.statusConnecting, color: "text-yellow-400", pulse: true },
        [SessionState.LISTENING]: { text: t.statusListening, color: "text-green-400", pulse: true },
        [SessionState.AI_SPEAKING]: { text: t.statusAiSpeaking, color: "text-cyan-400", pulse: false },
        [SessionState.ANALYZING]: { text: t.statusAnalyzing, color: "text-purple-400", pulse: true },
        [SessionState.ENDED]: { text: t.statusComplete, color: "text-gray-400", pulse: false },
        [SessionState.ERROR]: { text: t.statusError, color: "text-red-500", pulse: false },
        [SessionState.IDLE]: { text: t.statusReady, color: "text-gray-400", pulse: false },
    };

    if (statusMap[state]) {
        text = statusMap[state].text;
        color = statusMap[state].color;
        pulse = statusMap[state].pulse;
    }

    return (
        <div className="flex items-center justify-center space-x-2">
            {pulse && <div className={`w-2 h-2 rounded-full ${color.replace('text-','bg-')} animate-pulse`}></div>}
            <span className={`font-medium ${color}`}>{text}</span>
        </div>
    );
};

interface NegotiationSimProps {
    config: NegotiationConfig;
    onEnd: (result: NegotiationResult) => void;
    t: Translation;
    language: 'en' | 'fr';
}

const generateSystemInstruction = (config: NegotiationConfig, language: 'en' | 'fr'): string => {
    const counterpartRole = config.userRole === 'Buyer' ? 'Seller' : (config.userRole === 'Seller' ? 'Buyer' : 'Client');
    const responseLanguage = language === 'fr' ? 'French' : 'English';
    
    return `You are an expert negotiation counterpart in a B2B commercial simulation. Your responses MUST be in ${responseLanguage}.
    Your role: A professional ${counterpartRole}.
    The user's role: A professional ${config.userRole}.
    Negotiation Topic: ${config.topic}.
    Your primary objective is: ${config.aiTarget}.
    The user's primary objective is: ${config.userTarget}.
    Additional Context: ${config.context}.

    Your goal is to secure the most favorable deal for your side based on your objective. Be professional, firm but fair, and respond realistically to the user's arguments and offers. Do not break character. Keep your responses concise and conversational. Begin the conversation by greeting the user and stating your purpose for the meeting.`;
};


export const NegotiationSim: React.FC<NegotiationSimProps> = ({ config, onEnd, t, language }) => {
    const { sessionState, transcriptionHistory, currentInput, currentOutput, error, result, startSession, endSession } = useNegotiation();

    useEffect(() => {
        if (result) {
            onEnd(result);
        }
    }, [result, onEnd]);

    const isSessionActive = sessionState === SessionState.CONNECTING || sessionState === SessionState.LISTENING || sessionState === SessionState.AI_SPEAKING;

    const handleStart = () => {
        const instruction = generateSystemInstruction(config, language);
        startSession(instruction);
    };
    
    const handleEnd = () => {
        endSession(config);
    };

    return (
        <div className="bg-gray-800 rounded-2xl shadow-2xl flex w-full max-w-7xl mx-auto h-[calc(100vh-12rem)] animate-fade-in">
            <div className="flex-grow flex flex-col w-full lg:w-2/3">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold">{t.scenario}: {config.topic}</h2>
                    <p className="text-sm text-gray-400">{t.youAreThe} {t[config.userRole.toLowerCase() as keyof Translation]}. {t.aiWillPlay}</p>
                </div>
                
                <div className="flex-grow p-6 overflow-hidden flex flex-col">
                     <div className="flex-grow flex flex-col justify-end h-full">
                        {transcriptionHistory.length === 0 && currentInput === '' && currentOutput === '' && (
                             <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                                 <BotIcon className="w-16 h-16 mb-4" />
                                <p className="text-lg">{t.simulationReady}</p>
                                <p>{t.pressMicToStart}</p>
                             </div>
                        )}
                        <div className="flex-grow overflow-y-auto pr-2">
                            {transcriptionHistory.map((entry, index) => (
                                <TranscriptionBubble key={index} entry={entry} />
                            ))}
                             {currentInput && <p className="text-gray-400 text-right italic p-4">{currentInput}</p>}
                             {currentOutput && <p className="text-cyan-300 italic p-4">{currentOutput}</p>}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 bg-gray-800/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-4">
                        <StatusIndicator state={sessionState} t={t} />
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        <button
                            onClick={isSessionActive ? handleEnd : handleStart}
                            disabled={sessionState === SessionState.CONNECTING || sessionState === SessionState.ENDED || sessionState === SessionState.ANALYZING}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4
                                ${isSessionActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/50' 
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/50'}
                                ${sessionState === SessionState.CONNECTING || sessionState === SessionState.ENDED || sessionState === SessionState.ANALYZING ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {isSessionActive ? <StopIcon className="w-8 h-8 text-white" /> : <MicIcon className="w-8 h-8 text-white" />}
                        </button>
                    </div>
                </div>
            </div>
            <StrategySidebar config={config} t={t} />
        </div>
    );
};