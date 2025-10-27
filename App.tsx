
import React, { useState, useEffect } from 'react';
import { NegotiationSim } from './components/NegotiationSim';
import { SetupScreen } from './components/SetupScreen';
import { GlobeIcon, AwardIcon, ZapIcon, QuestionMarkCircleIcon, ArrowUpCircleIcon, CheckCircleIcon, LogoIcon, SparklesIcon, LightBulbIcon } from './components/icons/Icons';
import { NegotiationConfig, NegotiationResult, UserProfile, GameState } from './types';
import { translations, Translation } from './translations';
import { FAQModal } from './components/FAQModal';
import { getLevelFromXp, getTitle, LEVEL_THRESHOLDS } from './utils/gamification';

const App: React.FC = () => {
    const [config, setConfig] = useState<NegotiationConfig | null>(null);
    const [language, setLanguage] = useState<'en' | 'fr'>('en');
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [gameState, setGameState] = useState<GameState>('setup');
    const [userProfile, setUserProfile] = useState<UserProfile>({ xp: 0, streak: 0 });
    const [lastResult, setLastResult] = useState<NegotiationResult | null>(null);

    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(prevLang => prevLang === 'en' ? 'fr' : 'en');
    };

    const handleStart = (newConfig: NegotiationConfig) => {
        setConfig(newConfig);
        setGameState('sim');
    };
    
    const handleSimulationEnd = (result: NegotiationResult) => {
        setLastResult(result);
        setUserProfile(prev => ({
            ...prev,
            xp: prev.xp + result.xpGained,
            streak: prev.streak + 1, // Placeholder for more complex logic
        }));
        setGameState('result');
    };

    const handleReset = () => {
        setConfig(null);
        setLastResult(null);
        setGameState('setup');
    };
    
    const levelInfo = getLevelFromXp(userProfile.xp);
    const title = getTitle(levelInfo.level, language);
    const xpForNextLevel = LEVEL_THRESHOLDS[levelInfo.level] ? LEVEL_THRESHOLDS[levelInfo.level] - LEVEL_THRESHOLDS[levelInfo.level - 1] : 0;
    const currentLevelProgressXp = userProfile.xp - LEVEL_THRESHOLDS[levelInfo.level - 1];

    const ResultsScreen = () => {
        const [displayedXp, setDisplayedXp] = useState(0);
        const oldLevelInfo = getLevelFromXp(userProfile.xp - (lastResult?.xpGained || 0));
        const newLevelInfo = getLevelFromXp(userProfile.xp);
        const didLevelUp = newLevelInfo.level > oldLevelInfo.level;
    
        useEffect(() => {
            if (!lastResult) return;
            const targetXp = lastResult.xpGained;
            if (targetXp === 0) return;
    
            const animationDuration = 1000; // 1 second
            const frameDuration = 1000 / 60; // 60 fps
            const totalFrames = animationDuration / frameDuration;
            const xpIncrement = targetXp / totalFrames;
    
            let currentFrame = 0;
            const counter = setInterval(() => {
                currentFrame++;
                const newXp = Math.min(targetXp, Math.floor(displayedXp + xpIncrement));
                setDisplayedXp(newXp);
    
                if (currentFrame >= totalFrames || newXp === targetXp) {
                    setDisplayedXp(targetXp); // Ensure it ends on the exact number
                    clearInterval(counter);
                }
            }, frameDuration);
    
            return () => clearInterval(counter);
        }, [lastResult]);
    
        if (!lastResult) return null;

        return (
             <div className="text-center bg-gray-800 p-8 rounded-lg animate-fade-in flex-grow flex flex-col justify-center w-full max-w-4xl">
                {didLevelUp && (
                    <div className="animate-fade-in mb-6 p-4 bg-green-500/10 border border-green-400 rounded-lg">
                        <ArrowUpCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-2" />
                        <h2 className="text-4xl font-bold text-green-300">{t.levelUp}</h2>
                        <p className="text-gray-300">{t.yourNewTitleIs} <span className="font-semibold text-white">{getTitle(newLevelInfo.level, language)}</span></p>
                    </div>
                )}
                {!didLevelUp && <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />}

                <h2 className="text-3xl font-bold mb-2">{t.negotiationComplete}</h2>
                <p className="text-gray-400 mb-6">{t.performanceSummary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="bg-gray-700/50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-cyan-300 mb-2">{t.performanceScore}</h3>
                        <p className="text-5xl font-bold text-white">{lastResult.score}<span className="text-2xl text-gray-400">/100</span></p>
                    </div>
                    <div className="bg-gray-700/50 p-6 rounded-lg flex items-center">
                         <div className="mr-4 p-3 bg-yellow-400/10 rounded-full">
                            <AwardIcon className="w-8 h-8 text-yellow-400" />
                         </div>
                         <div>
                            <h3 className="text-lg font-semibold text-yellow-300">{t.xpGained}</h3>
                            <p className="text-2xl font-bold text-white">+{displayedXp} XP</p>
                         </div>
                    </div>
                </div>
                <div className="bg-gray-700/50 p-6 rounded-lg mt-6 text-left">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4">{t.aiCoachFeedback}</h3>
                    <p className="text-gray-300 italic mb-6">"{lastResult.feedback}"</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="flex items-center text-md font-semibold text-green-300 mb-3">
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                {t.keyStrengths}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                                {lastResult.keyStrengths.map((strength, index) => <li key={index}>{strength}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="flex items-center text-md font-semibold text-yellow-300 mb-3">
                                <LightBulbIcon className="w-5 h-5 mr-2" />
                                {t.areasForImprovement}
                            </h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                                {lastResult.areasForImprovement.map((area, index) => <li key={index}>{area}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                 <div className="mt-8">
                    <button
                        onClick={handleReset}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors transform hover:scale-105"
                    >
                        {t.startNewNegotiation}
                    </button>
                </div>
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-4">
                             <LogoIcon className="w-10 h-10" />
                             <div onClick={handleReset} className="cursor-pointer" title={t.goBackToSetup}>
                                <h1 className="text-xl font-bold text-white">{t.headerTitle}</h1>
                                {config && gameState === 'sim' && <p className="text-xs text-gray-400">{t.headerRole}: {t[config.userRole.toLowerCase() as keyof Translation]}</p>}
                            </div>
                        </div>

                        <div className="flex-grow max-w-sm hidden md:block">
                             <div className="flex justify-between items-center mb-1 px-1">
                                <span className="text-xs font-bold text-green-300">{`${t.level} ${levelInfo.level} - ${title}`}</span>
                                <span className="text-xs font-semibold text-gray-400">{currentLevelProgressXp} / {xpForNextLevel} XP</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-green-400 to-cyan-400 h-2 rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${levelInfo.progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                             <div className="hidden sm:flex items-center space-x-4 bg-gray-700/50 px-4 py-2 rounded-full" title={`${userProfile.streak} ${t.days} ${t.streak}`}>
                                <ZapIcon className="w-5 h-5 text-orange-400" />
                                <span className="font-semibold text-sm">{userProfile.streak}</span>
                            </div>
                            <button onClick={() => setIsFaqOpen(true)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title={t.faqTitle}>
                                <QuestionMarkCircleIcon className="w-6 h-6" />
                            </button>
                            <button onClick={toggleLanguage} className="flex items-center p-2 rounded-full hover:bg-gray-700 transition-colors">
                                <GlobeIcon className="w-6 h-6" />
                                <span className="ml-2 font-semibold text-sm uppercase">{language}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                {gameState === 'setup' && <SetupScreen onStart={handleStart} t={t} />}
                {gameState === 'sim' && config && <NegotiationSim config={config} onEnd={handleSimulationEnd} t={t} language={language} />}
                {gameState === 'result' && <ResultsScreen />}
            </main>

            {isFaqOpen && <FAQModal t={t} onClose={() => setIsFaqOpen(false)} />}
        </div>
    );
};

export default App;