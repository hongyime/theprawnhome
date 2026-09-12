import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { usePausedMotion } from '../UI/MotionPreferences';

interface EyeWidgetProps {
  isActive?: boolean;
}

export const EyeWidget: React.FC<EyeWidgetProps> = ({ isActive = false }) => {
  const pauseMotion = usePausedMotion();
  const eyeRef = useRef<HTMLDivElement>(null);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Mouse tracking logic
  useEffect(() => {
    if (pauseMotion) { setPupilPos({ x: 0, y: 0 }); return; }
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      
      const rect = eyeRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      // Calculate angle
      const angle = Math.atan2(dy, dx);
      
      // Limit movement radius (eye radius - pupil radius)
      // Eye is e.g. w-24 (96px), pupil is w-8 (32px). Max radius approx 20px
      const distance = Math.min(Math.hypot(dx, dy), 20);
      
      setPupilPos({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [pauseMotion]);

  // Random Blink Logic
  useEffect(() => {
    if (pauseMotion) { setIsBlinking(false); return; }
    let reopenId: ReturnType<typeof setTimeout>;
    let timeoutId: ReturnType<typeof setTimeout>;

    const triggerBlink = () => {
      setIsBlinking(true);
      
      // Open eye after short delay (blink duration)
      reopenId = setTimeout(() => {
        setIsBlinking(false);
      }, 150);

      // Schedule next blink randomly between 2s and 6s
      const nextBlinkTime = Math.random() * 4000 + 2000;
      timeoutId = setTimeout(triggerBlink, nextBlinkTime);
    };

    // Initial random delay
    timeoutId = setTimeout(triggerBlink, Math.random() * 3000 + 1000);

    return () => { clearTimeout(timeoutId); clearTimeout(reopenId); };
  }, [pauseMotion]);

  return (
    <Card className={`flex items-center justify-center min-h-[150px] transition-colors duration-500 ${isActive ? 'bg-black' : 'bg-prawn'}`}>
        <div ref={eyeRef} className="relative w-24 h-24 bg-white border-4 border-black rounded-full flex items-center justify-center overflow-hidden">
            
            {/* Eyelid - Matches card background to look like skin */}
            <motion.div 
                className="absolute top-0 left-0 w-full z-20 pointer-events-none"
                initial={{ height: "0%" }}
                animate={{ height: isBlinking ? "100%" : "0%" }}
                transition={{ duration: 0.1 }}
                style={{ backgroundColor: isActive ? '#000000' : '#a3a3a3' }}
            />

            {/* Pupil */}
            <motion.div 
                className="w-8 h-8 rounded-full z-10"
                style={{
                    x: pupilPos.x,
                    y: pupilPos.y
                }}
                animate={{
                    backgroundColor: isActive && !pauseMotion ? ["#000000", "#a3a3a3", "#000000"] : "#000000"
                }}
                transition={{
                    backgroundColor: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }}
            />
        </div>
    </Card>
  );
};