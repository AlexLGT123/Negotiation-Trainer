
import React, { useState } from 'react';
import { NegotiationConfig } from '../types';
import { XCircleIcon } from './icons/Icons';
import { Translation } from '../translations';

interface SetupScreenProps {
    onStart: (config: NegotiationConfig) => void;
    t: Translation;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">
        {children}
    </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input
        {...props}
        className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className ?? ''}`}
    />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        rows={3}
    />
);

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, t }) => {
    const [config, setConfig] = useState<Omit<NegotiationConfig, 'userRole'>>({
        topic: 'Annual SaaS Platform License Renewal',
        userTarget: 'Secure a 15% discount and 24/7 premium support.',
        aiTarget: 'Maintain current pricing and upsell the new analytics module.',
        context: 'Our company has been a customer for 3 years. We are generally happy but are exploring competitors due to budget cuts.',
        negotiationScale: {
            announcementPosition: 'Request a 25% discount.',
            goal: 'Achieve a 15% discount.',
            worstCase: 'Accept a 5% discount, but with added features.',
            arguments: [
                'We have been a loyal customer for 3+ years.',
                'Market competitors are offering better pricing.',
                'Our budget has been reduced this fiscal year.'
            ],
            tradeOffs: [
                'Extended contract length (2 years).',
                'Provide a public case study/testimonial.'
            ],
        }
    });
    const [userRole, setUserRole] = useState<NegotiationConfig['userRole']>('Buyer');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStart({ ...config, userRole });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };
    
    const handleScaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, [name]: value }
        }));
    };

    const handleArgumentChange = (index: number, value: string) => {
        const newArguments = [...config.negotiationScale.arguments];
        newArguments[index] = value;
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, arguments: newArguments }
        }));
    };

    const addArgument = () => {
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, arguments: [...prev.negotiationScale.arguments, ''] }
        }));
    };

    const removeArgument = (index: number) => {
        const newArguments = config.negotiationScale.arguments.filter((_, i) => i !== index);
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, arguments: newArguments }
        }));
    };

    const handleTradeOffChange = (index: number, value: string) => {
        const newTradeOffs = [...config.negotiationScale.tradeOffs];
        newTradeOffs[index] = value;
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, tradeOffs: newTradeOffs }
        }));
    };

    const addTradeOff = () => {
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, tradeOffs: [...prev.negotiationScale.tradeOffs, ''] }
        }));
    };

    const removeTradeOff = (index: number) => {
        const newTradeOffs = config.negotiationScale.tradeOffs.filter((_, i) => i !== index);
        setConfig(prev => ({
            ...prev,
            negotiationScale: { ...prev.negotiationScale, tradeOffs: newTradeOffs }
        }));
    };


    return (
        <div className="w-full max-w-3xl mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2">{t.setupTitle}</h2>
            <p className="text-gray-400 text-center mb-8">{t.setupSubtitle}</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Label htmlFor="userRole">{t.selectYourRole}</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {(['Buyer', 'Seller'] as const).map(role => (
                            <button
                                type="button"
                                key={role}
                                onClick={() => setUserRole(role)}
                                className={`py-3 px-4 rounded-lg text-center font-semibold transition-colors ${userRole === role ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {t[role.toLowerCase() as keyof Translation]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <Label htmlFor="topic">{t.negotiationTopic}</Label>
                    <Input id="topic" name="topic" value={config.topic} onChange={handleInputChange} required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="userTarget">{t.yourObjective}</Label>
                        <Textarea id="userTarget" name="userTarget" value={config.userTarget} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="aiTarget">{t.counterpartObjective}</Label>
                        <Textarea id="aiTarget" name="aiTarget" value={config.aiTarget} onChange={handleInputChange} required />
                    </div>
                </div>

                <div>
                    <Label htmlFor="context">{t.additionalContext}</Label>
                    <Textarea id="context" name="context" value={config.context} onChange={handleInputChange} />
                </div>

                <div className="pt-6 mt-6 border-t border-gray-700">
                    <h3 className="text-xl font-bold text-center mb-2">{t.buildScaleTitle}</h3>
                    <p className="text-gray-400 text-center mb-6">{t.buildScaleSubtitle}</p>

                    {/* X-Axis */}
                    <div className="mb-6">
                        <Label>{t.positionsXAxis}</Label>
                        <div className="flex items-end space-x-2 bg-gray-900/50 p-4 rounded-lg">
                            <div className="flex-1 text-center">
                                <p className="text-xs text-gray-400 mb-1">{t.announcementPosition}</p>
                                <Input name="announcementPosition" value={config.negotiationScale.announcementPosition} onChange={handleScaleInputChange} placeholder={t.openingOffer} />
                            </div>
                            <div className="flex-grow pb-4 px-1"><div className="w-full border-t-2 border-dashed border-gray-600"></div></div>
                            <div className="flex-1 text-center">
                                <p className="text-xs text-indigo-400 mb-1 font-semibold">{t.goal}</p>
                                <Input name="goal" value={config.negotiationScale.goal} onChange={handleScaleInputChange} placeholder={t.targetOutcome} className="border-indigo-500" />
                            </div>
                            <div className="flex-grow pb-4 px-1"><div className="w-full border-t-2 border-dashed border-gray-600"></div></div>
                            <div className="flex-1 text-center">
                                <p className="text-xs text-gray-400 mb-1">{t.worstCase}</p>
                                <Input name="worstCase" value={config.negotiationScale.worstCase} onChange={handleScaleInputChange} placeholder={t.walkAwayPoint} />
                            </div>
                        </div>
                    </div>

                    {/* Y-Axis */}
                    <div className="space-y-6">
                        <div>
                            <Label>{t.keyArgumentsYAxis}</Label>
                            <div className="space-y-3">
                                {config.negotiationScale.arguments.map((arg, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input 
                                            value={arg}
                                            onChange={(e) => handleArgumentChange(index, e.target.value)}
                                            placeholder={`${t.argument} #${index + 1}`}
                                            className="flex-grow"
                                        />
                                        <button type="button" onClick={() => removeArgument(index)} className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded-full focus:outline-none">
                                            <XCircleIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addArgument}
                                className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {t.addArgument}
                            </button>
                        </div>
                        <div>
                            <Label>{t.keyTradeOffsYAxis}</Label>
                            <div className="space-y-3">
                                {config.negotiationScale.tradeOffs.map((tradeOff, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={tradeOff}
                                            onChange={(e) => handleTradeOffChange(index, e.target.value)}
                                            placeholder={`${t.tradeOff} #${index + 1}`}
                                            className="flex-grow"
                                        />
                                        <button type="button" onClick={() => removeTradeOff(index)} className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded-full focus:outline-none">
                                            <XCircleIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                             <button
                                type="button"
                                onClick={addTradeOff}
                                className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                {t.addTradeOff}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        {t.startSimulation}
                    </button>
                </div>
            </form>
        </div>
    );
};