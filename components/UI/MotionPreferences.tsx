import { createContext, useContext } from 'react';

// Includes the system preference and the page's explicit pause control.
export const MotionPreferences = createContext(false);
export const usePausedMotion = () => useContext(MotionPreferences);
