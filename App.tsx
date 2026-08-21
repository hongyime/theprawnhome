import React, { useState, useEffect } from 'react';
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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen font-mono transition-colors duration-300 ${theme === 'dark' ? 'bg-[#111] text-[#E0E0E0]' : 'bg-gray-50 text-black'}`}>
        
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
             <div className="bg-white dark:bg-[#111] min-h-screen border-t-0">
                <BentoGrid />
                
                {/* Footer */}
                <div className="py-12 text-center border-t-2 border-black dark:border-gray-800">
                    <p className="text-sm opacity-50">BUILT WITH 🦐 POWER</p>
                </div>
             </div>
        </div>

      </div>
    </ThemeContext.Provider>
  );
};

export default App;
