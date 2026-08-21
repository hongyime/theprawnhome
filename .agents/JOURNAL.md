# Agent Journal

- 2026-08-21: Orientation found the marquee already uses Hacker News via direct client Firebase API fetches, with no existing HN endpoint under `api/`; cursor replacement currently executes JavaScript on every `mousemove` through `CustomCursor`.
- 2026-08-21: Owner confirmed seasonal trigger date is Christmas, marquee should remain Hacker News, and the secret word is `prawn`; no HN API endpoint is required unless later implementation needs one.
- 2026-08-21: Cursor fix committed in `e9de12c`; cursor movement is now CSS-only and no longer uses JavaScript on pointer movement.
- 2026-08-21: Bug fix committed in `f1173af`; Spotify real playback progress now advances locally between API polls.
- 2026-08-21: Easter egg list started: typing `prawn` outside editable fields reveals PRAWN MODE.
- 2026-08-21: Easter egg list updated: on local December 25, HOLIDAY MODE appears and can be dismissed for the session.
- 2026-08-21: Marquee kept as direct client Hacker News fetch, with reduced-motion static mode and HN discussion URL fallback for stories without external URLs.
- 2026-08-21: Full easter egg list: `prawn` keyword reveal; local December 25 HOLIDAY MODE seasonal reveal.
