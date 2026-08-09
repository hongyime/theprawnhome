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
- Custom cursor

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
