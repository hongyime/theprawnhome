import React from 'react';
import { motion } from 'framer-motion';
import { usePausedMotion } from './MotionPreferences';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: string; // Tailwind grid col span class
}

export const Card: React.FC<CardProps> = ({ children, className = '', colSpan = 'col-span-1' }) => {
  const pauseMotion = usePausedMotion();
  return (
    <motion.div
      className={`
        bg-white dark:bg-[#1a1a1a]
        border-3 border-black dark:border-[#E0E0E0]
        shadow-brutal
        p-4 relative
        ${className.includes('overflow') ? '' : 'overflow-hidden'}
        ${colSpan}
        ${className}
      `}
      whileHover={pauseMotion ? undefined : {
        scale: 1.02,
        boxShadow: "0px 0px 0px 0px #000000",
        zIndex: 10
      }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
};
