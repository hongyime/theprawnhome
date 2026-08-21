import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { SpotifyData } from '../../types';

export const SpotifyWidget: React.FC = () => {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState<number | null>(null);
  
  // Mock fallback state for animation
  const [mockProgress, setMockProgress] = useState(30);

  useEffect(() => {
    // Poll for real data
    const fetchSpotify = async () => {
      try {
        const res = await fetch('/api/spotify');
        if (res.ok) {
          const json = await res.json();
          // If we have an error (e.g. missing secrets), we treat it as null/mock
          if (json.error) {
            setData(null);
            setPlaybackProgress(null);
          } else {
            setData(json);
            setPlaybackProgress(typeof json.progress === 'number' ? json.progress : null);
          }
        }
      } catch (e) {
        // Fallback to mock on error
        setData(null);
        setPlaybackProgress(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSpotify();
    const interval = setInterval(fetchSpotify, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Internal timer for smooth progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (data && data.isPlaying && data.duration) {
         setPlaybackProgress((progress) => {
           if (progress === null || !data.duration) return progress;
           return Math.min(progress + 1000, data.duration);
         });
      } else {
         setMockProgress((p) => (p >= 100 ? 0 : p + 0.5));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  // Determine what to display
  const useRealData = data && data.isPlaying;
  const isOffline = !loading && !useRealData;
  
  const display = {
      image: useRealData ? data.albumArt : null,
      title: loading ? "Checking Spotify" : useRealData ? data.title : "Spotify is quiet",
      artist: loading ? "Looking for a live track" : useRealData ? data.artist : "No live listening data right now",
      isPlaying: Boolean(useRealData),
      progressPercent: useRealData && playbackProgress !== null && data.duration 
          ? (playbackProgress / data.duration) * 100 
          : mockProgress,
      url: useRealData ? data.url : "https://theprawnfeeds.hong-yi.me"
  };

  return (
    <Card colSpan="md:col-span-2" className="flex flex-col sm:flex-row gap-4 items-center group">
      {/* Album Art */}
      <motion.div 
        className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0"
        animate={{ rotate: display.isPlaying ? 360 : 0 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <a href={display.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer" aria-label={useRealData ? "Open track on Spotify" : "Open feeds"}>
            <div className="w-full h-full rounded-full bg-black border-4 border-prawn overflow-hidden relative">
                {display.image ? (
                  <img 
                      src={display.image} 
                      alt="Album Art" 
                      className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-black">
                    🎧
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-full" />
                </div>
            </div>
        </a>
      </motion.div>

      {/* Info & Controls */}
      <div className="flex-grow w-full space-y-3">
        <div className="flex justify-between items-start">
            <div className="overflow-hidden">
                <h3 className="text-xl font-bold leading-tight dark:text-white truncate pr-2">
                    {display.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {display.artist}
                </p>
            </div>
            <div className="flex space-x-1 shrink-0">
                 {display.isPlaying && <div className="w-3 h-3 bg-prawn rounded-full animate-pulse" />}
            </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 border-2 border-black dark:border-white rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${isOffline ? 'bg-gray-400 dark:bg-gray-500' : 'bg-prawn'}`}
            initial={{ width: 0 }}
            animate={{ width: `${isOffline ? 100 : display.progressPercent}%` }}
            transition={{ ease: "linear", duration: 0.5 }}
          />
        </div>

        <div className="flex justify-center sm:justify-start gap-3">
          <a
            href={display.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center border-2 border-black dark:border-white bg-prawn text-black px-3 py-2 text-sm font-bold hover:bg-white dark:hover:bg-black dark:hover:text-white transition-colors"
          >
            {useRealData ? 'OPEN TRACK' : 'OPEN FEEDS'}
          </a>
        </div>
      </div>
    </Card>
  );
};
