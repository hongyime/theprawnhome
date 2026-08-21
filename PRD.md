# PRD: theprawnhome

## Overview
A personal portfolio / home page for Bryan Seah ("The Prawn"). Features a physics-based particle hero with a live clock, scroll-driven parallax fade, a marquee ticker bar, and a bento grid content layout. Dark/light theme with system preference detection.

## Goals
- Full-screen hero with large live clock and physics particle canvas
- Scroll-driven hero fade/blur as user scrolls down
- Sticky marquee bar that anchors the transition between hero and content
- Bento grid layout for portfolio content below the fold
- Dark/light theme toggle with system preference detection
- CSS-only custom cursor
- Discoverable easter eggs for seasonal and keyword triggers

## Non-Goals
- CMS-driven content
- Blog functionality (separate site)
- Contact form backend
- Analytics

## User Stories
- As a visitor, I want to see Bryan's portfolio with a distinctive animated intro.
- As a mobile user, I want a responsive layout that works on all screen sizes.

## Tech Stack
- **Language**: TypeScript / React
- **Build**: Vite
- **Animation**: Framer Motion (scroll transforms, motion.div)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Architecture
```
theprawnhome/
├── App.tsx                          # Root — theme context, scroll transforms
├── types.ts                         # Theme types
├── components/
│   ├── Hero/
│   │   ├── BigClock.tsx             # Live digital clock with minute-tick callback
│   │   └── TrinketCanvas.tsx        # Physics particle canvas (explode on minute tick)
│   ├── Marquee/
│   │   └── MarqueeBar.tsx           # Continuous scrolling text ticker
│   ├── Grid/
│   │   └── BentoGrid.tsx            # Portfolio bento grid
│   └── UI/
│       └── CustomCursor.tsx         # Custom CSS cursor
└── api/                             # Vercel serverless functions (if any)
```

**Theme Context:** `ThemeContext` provides `{ theme, toggleTheme }` to all children.

**Scroll transforms (Framer Motion):**
- `opacity`: `[0, 500]` scroll → `[1, 0]`
- `scale`: `[0, 500]` → `[1, 0.9]`
- `filter blur`: `[0, 500]` → `[0px, 10px]`
- `y`: `[0, 500]` → `[0, 100]` (parallax down)

Hero is `position: fixed`; content slides over it using `z-index`.

## Features (detailed)

### Hero Section
- Fixed full-screen (`100vh`) with `z-0`
- `TrinketCanvas`: physics particle simulation that "explodes" on each minute change
- `BigClock`: large live time display; fires `onMinuteTick` callback each minute
- Scroll transforms fade/blur/scale/translate the hero as user scrolls down

### Marquee Bar
- Hacker News-powered horizontal continuous scrolling text bar
- Sits at bottom of viewport initially, becomes sticky as content scrolls up
- Acts as visual separator between hero and content
- Falls back to Hacker News discussion links when stories have no external URL
- Respects reduced-motion preference by disabling marquee animation

### Bento Grid
- Asymmetric grid of content cards (projects, links, bio, etc.)
- `min-h-screen` background layer above hero

### Theme System
- Initialized from `window.matchMedia('(prefers-color-scheme: dark)')`
- Listens for OS theme changes in real-time
- Toggle button: fixed top-right, Moon/Sun emoji
- Applied via `.dark` class on `documentElement`

### Custom Cursor
- Replaces default browser cursor
- CSS-only cursor image; no JavaScript runs on pointer movement

### Easter Eggs
- Typing `prawn` outside editable fields reveals PRAWN MODE
- Local December 25 reveals HOLIDAY MODE with session dismissal

## Deployment / Run
```bash
npm install
npm run dev
```

## Constraints & Notes
- **Fixed hero + scroll**: hero is `position: fixed` and content slides over it — requires careful `z-index` management and spacer div to push content below viewport
- **Physics canvas**: particle simulation runs in a `<canvas>` element; performance depends on particle count and device GPU
- **Minute tick**: `TrinketCanvas` explosion is triggered by parent via `explodeTrigger` prop (timestamp) — decoupled from canvas internals
