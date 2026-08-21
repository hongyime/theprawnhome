import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HackerNewsStory } from '../../types';

export const MarqueeBar: React.FC = () => {
  const [stories, setStories] = useState<HackerNewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();

    const fetchStories = async () => {
      try {
        const topIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
          signal: controller.signal,
        });
        
        if (!topIdsRes.ok) {
          throw new Error(`HN top stories failed: ${topIdsRes.status}`);
        }

        const topIds = await topIdsRes.json();
        
        // Take top 30
        const topIdsSlice = Array.isArray(topIds) ? topIds.slice(0, 30) : [];
        
        const storyPromises = topIdsSlice.map((id: number) => 
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            signal: controller.signal,
          }).then(res => {
            if (!res.ok) {
              throw new Error(`HN item ${id} failed: ${res.status}`);
            }

            return res.json();
          })
        );
        
        const fetchedStories = await Promise.all(storyPromises);
        setStories(
          fetchedStories.filter((story): story is HackerNewsStory =>
            typeof story?.id === 'number' && typeof story?.title === 'string'
          )
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch HN stories", error);
          setStories([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStories();

    return () => controller.abort();
  }, []);

  if (loading) return <div className="h-12 bg-black w-full" />;

  const visibleStories = stories.length > 0
    ? stories
    : [{
      id: 0,
      title: 'Hacker News unavailable',
      url: 'https://news.ycombinator.com/',
      score: 0,
      by: 'system',
    }];
  const marqueeStories = shouldReduceMotion ? visibleStories : [...visibleStories, ...visibleStories, ...visibleStories];

  return (
    <div className="w-full bg-black border-y-2 border-black py-3 overflow-hidden flex relative z-20">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10" />
      
      <motion.div 
        className={`flex whitespace-nowrap ${shouldReduceMotion ? 'overflow-x-auto px-12' : ''}`}
        animate={shouldReduceMotion ? undefined : { x: [0, -4000] }}
        transition={shouldReduceMotion ? undefined : { 
          repeat: Infinity, 
          ease: "linear", 
          duration: 120, // Slower for more content
        }}
      >
        {marqueeStories.map((story, i) => (
          <a 
            key={`${story.id}-${i}`}
            href={story.url ?? `https://news.ycombinator.com/item?id=${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mx-8 text-prawn font-bold hover:underline hover:text-white transition-colors"
          >
            <span className="text-white mr-2">★</span>
            {story.title}
          </a>
        ))}
      </motion.div>
    </div>
  );
};
