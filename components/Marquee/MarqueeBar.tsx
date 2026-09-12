import React, { useEffect, useState } from 'react';
import { HackerNewsStory } from '../../types';

export const MarqueeBar: React.FC = () => {
  const [stories, setStories] = useState<HackerNewsStory[]>([]);
  const [loading, setLoading] = useState(true);

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
  const renderStories = (duplicate: boolean) => (
    <div className={`hn-news-list${duplicate ? ' hn-marquee-copy' : ''}`} aria-hidden={duplicate || undefined} inert={duplicate || undefined}>
      {visibleStories.map(story => (
        <a key={story.id} href={story.url ?? `https://news.ycombinator.com/item?id=${story.id}`}
          target="_blank" rel="noopener noreferrer" tabIndex={duplicate ? -1 : undefined}
          className="hover:underline underline-offset-4">
          <span className="mr-2" aria-hidden="true">★</span>{story.title}
        </a>
      ))}
    </div>
  );

  return (
    <nav aria-label="Hacker News" className="hn-news w-full bg-black text-white border-y-3 border-black py-3 overflow-hidden relative z-20">
      <div className="hn-marquee-track">{renderStories(false)}{renderStories(true)}</div>
    </nav>
  );
};
