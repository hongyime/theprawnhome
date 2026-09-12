import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { usePausedMotion } from '../UI/MotionPreferences';

interface BigClockProps {
  onMinuteTick?: () => void;
}

export const BigClock: React.FC<BigClockProps> = ({ onMinuteTick }) => {
  const pauseMotion = usePausedMotion();
  const [time, setTime] = useState(new Date());
  const lastMinuteRef = useRef(new Date().getMinutes());

  // Mouse parallax effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();

      if (currentMinute !== lastMinuteRef.current) {
        lastMinuteRef.current = currentMinute;
        if (onMinuteTick) onMinuteTick();
      }

      setTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [onMinuteTick]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized position (-0.5 to 0.5)
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className="flex items-center justify-center w-full h-full perspective-1000"
      onMouseMove={pauseMotion ? undefined : handleMouseMove}
    >
      <motion.div role="timer" aria-label="Current time"
        className="text-[12vw] md:text-[15vw] font-bold leading-none tracking-tighter text-black dark:text-white select-none"
        style={pauseMotion ? undefined : { rotateX, rotateY, z: 50 }}
      >
        {formatTime(time)}
      </motion.div>
    </div>
  );
};
