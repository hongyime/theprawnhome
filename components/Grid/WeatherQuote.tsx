import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { PRAWN_QUOTES } from '../../constants';
import { WeatherData } from '../../types';

export const WeatherQuote: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(PRAWN_QUOTES[Math.floor(Math.random() * PRAWN_QUOTES.length)]);

    // Default to San Francisco if geo fails or denied
    const fetchWeather = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
            const data = await res.json();
            setWeather({
                temperature: data.current.temperature_2m,
                weatherCode: data.current.weather_code
            });
        } catch (e) {
            console.error("Weather fetch failed", e);
        }
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
            () => fetchWeather(37.7749, -122.4194) // Fallback SF
        );
    } else {
        fetchWeather(37.7749, -122.4194);
    }
  }, []);

  const getWeatherIcon = (code: number) => {
      if (code === 0) return "☀️";
      if (code < 3) return "⛅";
      if (code < 50) return "☁️";
      return "🌧️";
  };

  return (
    <Card 
        colSpan="md:col-span-1" 
        className="flex flex-col justify-center items-center text-center min-h-[200px] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
    >
       <a href="https://www.nea.gov.sg/weather/rain-areas" target="_blank" rel="noopener noreferrer" aria-label="View Singapore rain radar" className="flex h-full w-full flex-col items-center rounded-sm">
       <div className="mb-4 flex flex-col items-center justify-center h-full">
           {weather ? (
               <div className="text-5xl font-bold flex flex-col gap-2 items-center">
                   <span className="text-6xl">{getWeatherIcon(weather.weatherCode)}</span>
                   <span>{weather.temperature}°C</span>
               </div>
           ) : (
               <div className="text-xl mt-2 animate-pulse">Scanning...</div>
           )}
       </div>

       <div className="mt-auto pt-4 border-t-2 border-black dark:border-gray-700 w-full">
           <p className="font-mono text-sm leading-relaxed">
               <span className="text-prawn font-bold">PRAWN_SAYS:</span><br/>"{quote}"
           </p>
       </div>
       </a>
    </Card>
  );
};