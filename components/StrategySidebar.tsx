
import React from 'react';
import { NegotiationConfig } from '../types';
import { Translation } from '../translations';

interface StrategySidebarProps {
  config: NegotiationConfig;
  t: Translation;
}

export const StrategySidebar: React.FC<StrategySidebarProps> = ({ config, t }) => {
  const { negotiationScale } = config;

  return (
    <aside className="w-1/3 border-l border-gray-700 p-6 overflow-y-auto bg-gray-800/50 hidden lg:block">
      <h3 className="text-xl font-bold mb-6 text-center">{t.negotiationScaleTitle}</h3>
      <div className="space-y-4">
          <div className="space-y-3">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">{t.announcementPosition}</p>
                  <p className="font-medium text-white">{negotiationScale.announcementPosition}</p>
              </div>
               <div className="bg-gray-700/50 rounded-lg p-3 text-center border-2 border-indigo-500">
                  <p className="text-xs text-indigo-400 font-semibold">{t.goal}</p>
                  <p className="font-bold text-white">{negotiationScale.goal}</p>
              </div>
               <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">{t.worstCase}</p>
                  <p className="font-medium text-white">{negotiationScale.worstCase}</p>
              </div>
          </div>
          
           <div>
              <h4 className="font-semibold text-gray-300 mb-2 mt-6 text-center">{t.keyArguments}</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-300 pl-2">
                {negotiationScale.arguments.map((arg, index) => (
                    <li key={index}>{arg}</li>
                ))}
              </ul>
          </div>

          <div>
              <h4 className="font-semibold text-gray-300 mb-2 mt-6 text-center">{t.keyTradeOffs}</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-300 pl-2">
                {negotiationScale.tradeOffs.map((tradeOff, index) => (
                    <li key={index}>{tradeOff}</li>
                ))}
              </ul>
          </div>

      </div>
    </aside>
  );
};