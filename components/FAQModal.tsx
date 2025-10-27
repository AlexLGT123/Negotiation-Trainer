
import React from 'react';
import { Translation } from '../translations';
import { XCircleIcon } from './icons/Icons';

interface FAQModalProps {
  onClose: () => void;
  t: Translation;
}

const FAQSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-semibold text-cyan-300 mb-2">{title}</h3>
    <div className="text-gray-300 space-y-2 text-justify">{children}</div>
  </div>
);

export const FAQModal: React.FC<FAQModalProps> = ({ onClose, t }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close FAQ"
        >
          <XCircleIcon className="w-8 h-8" />
        </button>

        <h2 className="text-3xl font-bold text-center mb-8">{t.faqTitle}</h2>

        <FAQSection title={t.faqHowToUseTitle}>
          <p>{t.faqHowToUseContent}</p>
        </FAQSection>

        <FAQSection title={t.faqScoringTitle}>
          <p>{t.faqScoringContent}</p>
        </FAQSection>

        <FAQSection title={t.faqRewardsTitle}>
          <p>{t.faqRewardsContent}</p>
        </FAQSection>
      </div>
    </div>
  );
};
