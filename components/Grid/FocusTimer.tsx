import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';

interface FocusTimerProps {
  onActiveChange?: (isActive: boolean) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ onActiveChange }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const remainingMs = useRef(25 * 60 * 1000);
  const deadline = useRef<number | null>(null);

  // Sync internal state with parent via callback
  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(isActive);
    }
  }, [isActive, onActiveChange]);

  useEffect(() => {
    if (!isActive) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const stopUpdates = () => {
      if (interval !== null) clearInterval(interval);
      interval = null;
    };
    const update = () => {
      if (deadline.current === null) return;
      // Browser sleep and throttling can skip callbacks; the deadline still holds.
      remainingMs.current = Math.max(0, deadline.current - Date.now());
      setTimeLeft(Math.ceil(remainingMs.current / 1000));
      if (remainingMs.current === 0) {
        deadline.current = null;
        stopUpdates();
        setIsActive(false);
      }
    };
    const resumeUpdates = () => {
      stopUpdates();
      update();
      if (!document.hidden && deadline.current !== null) interval = setInterval(update, 1000);
    };
    document.addEventListener('visibilitychange', resumeUpdates);
    window.addEventListener('pageshow', resumeUpdates);
    window.addEventListener('focus', resumeUpdates);
    resumeUpdates();
    return () => {
      stopUpdates();
      document.removeEventListener('visibilitychange', resumeUpdates);
      window.removeEventListener('pageshow', resumeUpdates);
      window.removeEventListener('focus', resumeUpdates);
    };
  }, [isActive]);

  const toggleTimer = () => {
    if (isActive) {
      remainingMs.current = Math.max(0, (deadline.current ?? Date.now()) - Date.now());
      deadline.current = null;
      setTimeLeft(Math.ceil(remainingMs.current / 1000));
      setIsActive(false);
    } else {
      if (remainingMs.current === 0) remainingMs.current = 25 * 60 * 1000;
      deadline.current = Date.now() + remainingMs.current;
      setTimeLeft(Math.ceil(remainingMs.current / 1000));
      setIsActive(true);
    }
  };
  const resetTimer = () => {
    deadline.current = null;
    remainingMs.current = 25 * 60 * 1000;
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
