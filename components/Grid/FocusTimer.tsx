import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';

interface FocusTimerProps {
  onActiveChange?: (isActive: boolean) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ onActiveChange }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Sync internal state with parent via callback
  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(isActive);
    }
  }, [isActive, onActiveChange]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((seconds) => seconds - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
        colSpan="md:col-span-1" 
        className={`flex flex-col justify-center items-center transition-colors duration-300 ${isActive ? 'border-prawn' : ''}`}
    >
      <div role="timer" aria-label="Focus time remaining" className={`text-5xl font-bold font-mono mb-6 tracking-wider transition-colors duration-300 ${isActive ? 'text-prawn' : 'dark:text-white'}`}>
        {formatTime(timeLeft)}
      </div>
      
      <p role="status" className="sr-only">{timeLeft === 0 ? "Focus timer finished" : isActive ? "Focus timer running" : "Focus timer paused"}</p>
      <div className="flex gap-4 w-full">
        <motion.button
          onClick={toggleTimer}
          whileTap={{ scale: 0.9, skewX: -5 }}
          className={`
            flex-1 py-3 px-4 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
            bg-prawn text-black
          `}
        >
          {isActive ? 'PAUSE' : 'START'}
        </motion.button>
        
        <motion.button
          onClick={resetTimer}
          whileTap={{ scale: 0.9, skewX: 5 }}
          className="flex-1 py-3 px-4 font-bold bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
        >
          RESET
        </motion.button>
      </div>
    </Card>
  );
};