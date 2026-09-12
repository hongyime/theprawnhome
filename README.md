# The Prawn Home
> Bryan Seah's personal portfolio — animated clock hero, physics canvas, bento grid

## What it does
A personal portfolio home page featuring a full-screen animated clock hero with physics particle explosions (triggered on each minute change), scroll-driven parallax fade, a sticky marquee ticker bar, and a bento grid content layout below the fold. Dark/light theme with system preference detection.

## Features
- Full-screen hero with live digital clock + physics particle canvas (explodes on minute tick)
- Scroll-driven hero fade/blur/scale/parallax (Framer Motion `useScroll` + `useTransform`)
- Sticky marquee ticker bar as visual separator between hero and content
- Bento grid portfolio layout
- Dark/light/system theme with OS preference sync + manual toggle
- CSS-only custom cursor with no pointer-movement script
- Hacker News ticker with reduced-motion fallback
- Easter eggs for `prawn` and local December 25

## Weather
Singapore is shown on opening the page. **Use my location** requests browser permission only after you choose it and sends the coordinates to Open-Meteo for weather. **Use Singapore** restores the default. The selection remains in page memory and resets on reload.

The card shows the location, weather condition and the reading time in SGT. Refresh is manual; there is no weather polling loop. Hidden/offline pages pause unfinished requests. Headers and response bodies share a ten-second deadline; failed or malformed responses show a retry action. A failed refresh retains the previous reading with its original location and timestamp.

Weather comes directly from [Open-Meteo](https://open-meteo.com/en/docs), with a separate link to Singapore's NEA rain radar. It adds no Vercel function or database writes. The API and weather data checks run before every build. For synthetic desktop/mobile weather scenarios, install Playwright for Python, build, then run `python tests/weather.py`; these fixtures do not call live providers.

## Tech Stack
React + TypeScript + Vite + Tailwind CSS + Framer Motion

## Run locally
```bash
npm install
npm run dev
```

## Deployment
Deployed on Vercel. Auto-deploys from main branch.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
