import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../UI/Card';
import { PRAWN_QUOTES } from '../../constants';
import { WeatherData } from '../../types';
import { fetchWeather, SINGAPORE, WEATHER_DEADLINE_MS, weatherCondition, type WeatherLocation } from '../../lib/weather';

export const WeatherQuote: React.FC = () => {
  const [reading, setReading] = useState<{ weather: WeatherData; location: WeatherLocation } | null>(null);
  const [location, setLocation] = useState(SINGAPORE);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'paused'>('loading');
  const [quote] = useState(() => PRAWN_QUOTES[Math.floor(Math.random() * PRAWN_QUOTES.length)]);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const locationRequest = useRef<{ timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    let disposed = false;
    let needsRead = true;
    let active: { controller: AbortController; timer: ReturnType<typeof setTimeout> } | null = null;
    const cancel = () => {
      if (!active) return;
      const request = active;
      active = null;
      clearTimeout(request.timer);
      request.controller.abort();
    };
    const update = () => {
      if (disposed) return;
      if (document.visibilityState === 'hidden' || navigator.onLine === false) {
        if (needsRead) { cancel(); setStatus('paused'); }
        return;
      }
      if (!needsRead || active) return;
      const controller = new AbortController();
      const request = { controller, timer: setTimeout(() => {
        if (active !== request) return;
        needsRead = false;
        cancel();
        setStatus('error');
      }, WEATHER_DEADLINE_MS) };
      active = request;
      setStatus('loading');
      fetchWeather(location, controller.signal).then(weather => {
        if (disposed || active !== request) return;
        needsRead = false;
        setReading({ weather, location });
        setStatus('ready');
      }).catch(() => {
        if (disposed || active !== request) return;
        needsRead = false;
        setStatus('error');
      }).finally(() => {
        clearTimeout(request.timer);
        if (active === request) active = null;
      });
    };
    document.addEventListener('visibilitychange', update);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    return () => {
      disposed = true;
      cancel();
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [location, attempt]);

  useEffect(() => {
    const cancelLocation = () => {
      if (!locationRequest.current) return;
      clearTimeout(locationRequest.current.timer);
      locationRequest.current = null;
      setLocating(false);
      setLocationMessage('Location unavailable. Your weather selection has not changed.');
    };
    const visibility = () => { if (document.visibilityState === 'hidden') cancelLocation(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('offline', cancelLocation);
    return () => {
      if (locationRequest.current) clearTimeout(locationRequest.current.timer);
      locationRequest.current = null;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('offline', cancelLocation);
    };
  }, []);

  const useLocation = () => {
    if (locationRequest.current || status === 'loading') return;
    if (document.visibilityState === 'hidden' || navigator.onLine === false) {
      setLocationMessage('Location unavailable while this page is hidden or offline.');
      return;
    }
    setLocationMessage('');
    setLocating(true);
    const fail = () => {
      if (locationRequest.current !== request) return;
      clearTimeout(request.timer);
      locationRequest.current = null;
      setLocating(false);
      setLocationMessage('Location unavailable. Your weather selection has not changed.');
    };
    const request = { timer: setTimeout(fail, WEATHER_DEADLINE_MS) };
    locationRequest.current = request;
    try {
      if (!navigator.geolocation) { fail(); return; }
      navigator.geolocation.getCurrentPosition(position => {
        if (locationRequest.current !== request) return;
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) { fail(); return; }
        clearTimeout(request.timer);
        locationRequest.current = null;
        setLocating(false);
        setLocation({ label: 'Your location', latitude, longitude });
      }, fail, { timeout: WEATHER_DEADLINE_MS, maximumAge: 300_000, enableHighAccuracy: false });
    } catch { fail(); }
  };

  const busy = status === 'loading' || locating;
  const condition = reading ? weatherCondition(reading.weather) : null;
  const buttonStyle = 'min-h-11 px-3 py-2 border-2 border-black dark:border-gray-400 font-mono text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-wait';

  return (
    <Card 
        colSpan="md:col-span-1" 
        className="flex flex-col justify-center items-center text-center min-h-[200px]"
    >
       <section aria-label="Weather" className="w-full flex flex-col items-center gap-3 mb-4">
         <h2 className="font-mono text-sm font-bold">{reading?.location.label ?? location.label}</h2>
         {reading && condition && <>
           <span className="text-5xl" aria-hidden="true">{condition[1]}</span>
           <p className="text-4xl font-bold tabular-nums">{reading.weather.temperature}°C</p>
           <p className="font-mono text-sm">{condition[0]}</p>
           <p className="font-mono text-xs text-gray-600 dark:text-gray-400">Reading from <time dateTime={new Date(reading.weather.observedAt).toISOString()}>
             {new Intl.DateTimeFormat('en-SG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' }).format(reading.weather.observedAt)} SGT
           </time></p>
         </>}
         <p role="status" className="font-mono text-sm">
           {status === 'loading' ? `Loading weather for ${location.label}…`
             : status === 'error' ? (reading ? `Could not refresh weather for ${location.label}. Showing the previous reading for ${reading.location.label}.` : 'Weather unavailable. Please try again.')
             : status === 'paused' ? 'Weather paused while this page is hidden or offline.' : ''}
         </p>
         <div className="flex flex-wrap justify-center gap-2">
           <button type="button" className={buttonStyle} disabled={busy || status === 'paused'} onClick={() => setAttempt(value => value + 1)}>
             {status === 'loading' ? 'Refreshing weather' : status === 'error' ? 'Retry weather' : 'Refresh weather'}
           </button>
           <button type="button" className={buttonStyle} disabled={busy || status === 'paused'} onClick={useLocation}>{locating ? 'Finding location…' : 'Use my location'}</button>
           {location !== SINGAPORE && <button type="button" className={buttonStyle} disabled={busy} onClick={() => { setLocationMessage(''); setLocation(SINGAPORE); }}>Use Singapore</button>}
         </div>
         <p className="text-xs text-gray-600 dark:text-gray-400">Optional: share your location with <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>.</p>
         <p role="status" className="font-mono text-xs">{locationMessage}</p>
         <a href="https://www.nea.gov.sg/weather/rain-areas" target="_blank" rel="noopener noreferrer" aria-label="View Singapore rain radar" className="font-mono text-sm underline min-h-11 flex items-center">Singapore rain radar ↗</a>
       </section>
       <div className="mt-auto pt-4 border-t-2 border-black dark:border-gray-700 w-full">
           <p className="font-mono text-sm leading-relaxed">
               <span className="text-prawn font-bold">PRAWN_SAYS:</span><br/>"{quote}"
           </p>
       </div>
    </Card>
  );
};
