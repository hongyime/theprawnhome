
import React, { useState } from 'react';
import { SpotifyWidget } from './SpotifyWidget';
import { FocusTimer } from './FocusTimer';
import { QuickLinks } from './QuickLinks';
import { WeatherQuote } from './WeatherQuote';
import { EyeWidget } from './EyeWidget';
import { Card } from '../UI/Card';

export const BentoGrid: React.FC = () => {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isSecretOpen, setIsSecretOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
        {/* Row 1 */}
        <SpotifyWidget />
        <Card className="flex items-center justify-center bg-white dark:bg-[#1a1a1a]">
             <div className="text-center">
                 <div className="text-6xl mb-2">👾</div>
                 <div className="font-bold tracking-widest dark:text-white">LEVEL {dayOfYear}</div>
             </div>
        </Card>

        {/* Row 2 */}
        <FocusTimer onActiveChange={setIsTimerActive} />
        <QuickLinks />
        <WeatherQuote />

        {/* Row 3 - Filler / Decor */}
        {/* Top Secret Folder Card */}
        <Card className="flex items-center justify-center min-h-[150px] !overflow-visible relative mt-8">
            {/* Folder Tab - Changed to Black as requested */}
            <div className="absolute -top-[2.5rem] left-[-2px] w-1/3 h-10 bg-black border-2 border-black dark:border-[#E0E0E0] rounded-t-lg z-0" />
            
            {/* Folder Body Content */}
            <button
              type="button"
              aria-expanded={isSecretOpen}
              onClick={() => setIsSecretOpen((open) => !open)}
              className="relative z-10 flex flex-col items-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-opacity-50 w-full h-full justify-center text-center"
            >
              <span className="text-3xl font-black uppercase tracking-widest text-black dark:text-white transform -rotate-6 bg-prawn px-4 py-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  TOP SECRET
              </span>
              {isSecretOpen && (
                <div className="mt-6 w-full text-left space-y-2 text-sm font-bold text-black dark:text-white">
                  <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-2">
                    KEYWORD: type <span className="text-prawn">prawn</span>
                  </div>
                  <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-2">
                    SEASONAL: check back on <span className="text-prawn">Dec 25</span>
                  </div>
                </div>
              )}
            </button>
        </Card>
        
        <EyeWidget isActive={isTimerActive} />
      </div>
    </div>
  );
};
