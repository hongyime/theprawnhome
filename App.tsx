import React, { useState, useEffect, useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { BigClock } from './components/Hero/BigClock';
import { TrinketCanvas } from './components/Hero/TrinketCanvas';
import { MarqueeBar } from './components/Marquee/MarqueeBar';
import { BentoGrid } from './components/Grid/BentoGrid';
import { ThemeContextType, Theme } from './types';

// Theme Context
export const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

const isChristmasDate = (date: Date) => date.getMonth() === 11 && date.getDate() === 25;

const App: React.FC = () => {
  // Initialize theme based on system preference
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // State to trigger physics explosion on time change
  const [timePulse, setTimePulse] = useState(0);
  const [isSecretEggVisible, setIsSecretEggVisible] = useState(false);
  const [isChristmas, setIsChristmas] = useState(() => isChristmasDate(new Date()));
  const [isChristmasDismissed, setIsChristmasDismissed] = useState(false);
  const secretBufferRef = useRef('');
  const secretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { scrollY } = useScroll();

  // Scroll Transformations for Hero
  // Increased range to 500 to account for larger scroll distance
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.9]);
  const blur = useTransform(scrollY, [0, 500], ["blur(0px)", "blur(10px)"]);
  const y = useTransform(scrollY, [0, 500], [0, 100]); 

  // Listen for system theme changes (e.g. OS switches to dark mode automatically)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Apply theme to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleMinuteTick = () => {
    // Update the pulse trigger with a new timestamp
    setTimePulse(Date.now());
  };

  const showSecretEgg = () => {
    setIsSecretEggVisible(true);

    if (secretTimerRef.current) {
      clearTimeout(secretTimerRef.current);
    }

    secretTimerRef.current = setTimeout(() => {
      setIsSecretEggVisible(false);
      secretTimerRef.current = null;
    }, 3600);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditableTarget =
        target?.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT';

      if (isEditableTarget || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
        return;
      }

      secretBufferRef.current = `${secretBufferRef.current}${event.key.toLowerCase()}`.slice(-5);

      if (secretBufferRef.current === 'prawn') {
        showSecretEgg();
        secretBufferRef.current = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      if (secretTimerRef.current) {
        clearTimeout(secretTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsChristmas(isChristmasDate(new Date()));
    }, 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen font-mono transition-colors duration-300 ${theme === 'dark' ? 'bg-[#111] text-[#E0E0E0]' : 'bg-gray-50 text-black'}`}>
        {isChristmas && !isChristmasDismissed && (
          <div className="fixed left-4 top-4 z-[10000] max-w-[calc(100vw-2rem)] border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] p-4">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsChristmasDismissed(true)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-black bg-prawn text-black font-bold leading-none"
            >
              x
            </button>
            <div className="flex items-center gap-3">
              <span className="text-5xl leading-none motion-safe:animate-pulse" aria-hidden="true">🎄</span>
              <div>
                <div className="font-black text-xl leading-tight">HOLIDAY MODE</div>
                <div className="text-sm font-bold text-prawn">December 25 signal active.</div>
              </div>
            </div>
          </div>
        )}

        {isSecretEggVisible && (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-4 bottom-4 z-[10000] max-w-[calc(100vw-2rem)] border-2 border-black dark:border-white bg-prawn text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] p-4 motion-safe:animate-bounce"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsSecretEggVisible(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-black bg-white text-black font-bold leading-none"
            >
              x
            </button>
            <div className="flex items-center gap-3">
              <span className="text-5xl leading-none" aria-hidden="true">🦐</span>
              <div>
                <div className="font-black text-xl leading-tight">PRAWN MODE</div>
                <div className="text-sm font-bold">Shell signal received.</div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button - Fixed Top Right */}
        <button 
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-50 p-2 border-2 border-black dark:border-white bg-white dark:bg-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-y-1 hover:shadow-none transition-all"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Hero Section - Fixed Full Screen */}
        <motion.div 
            style={{ opacity, scale, filter: blur, y }}
            className="fixed top-0 left-0 w-full h-[100vh] flex flex-col items-center justify-center z-0 pb-[60px]"
        >
             <TrinketCanvas explodeTrigger={timePulse} />
             <BigClock onMinuteTick={handleMinuteTick} />
        </motion.div>

        {/* Spacer - Pushes content down so Marquee sits at bottom initially */}
        {/* 60px is approx height of MarqueeBar */}
        <div className="w-full h-[calc(100vh-60px)] pointer-events-none" />

        {/* Content Layer - Slides over Hero */}
        <div className="relative z-10 bg-inherit">
             <MarqueeBar />
             <div className="bg-white dark:bg-[#111] border-t-0">
                <BentoGrid />
                
                {/* Footer */}
                <div className="pt-3 pb-2 text-center border-t-2 border-black dark:border-gray-800">
                    <p className="text-sm opacity-50">BUILT WITH 🦐 POWER</p>
                </div>
             </div>
        </div>

      </div>
    </ThemeContext.Provider>
  );
};

export default App;
