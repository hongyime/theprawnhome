export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface HackerNewsStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
}

export interface SpotifyData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  albumArt?: string;
  url?: string;
  progress?: number;
  duration?: number;
}
