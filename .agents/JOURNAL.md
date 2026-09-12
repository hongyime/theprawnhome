# Agent Journal

- 2026-08-21: Orientation found the marquee already uses Hacker News via direct client Firebase API fetches, with no existing HN endpoint under `api/`; cursor replacement currently executes JavaScript on every `mousemove` through `CustomCursor`.
- 2026-08-21: Owner confirmed seasonal trigger date is Christmas, marquee should remain Hacker News, and the secret word is `prawn`; no HN API endpoint is required unless later implementation needs one.
- 2026-08-21: Cursor fix committed in `e9de12c`; cursor movement is now CSS-only and no longer uses JavaScript on pointer movement.
- 2026-08-21: Bug fix committed in `f1173af`; Spotify real playback progress now advances locally between API polls.
- 2026-08-21: Easter egg list started: typing `prawn` outside editable fields reveals PRAWN MODE.
- 2026-08-21: Easter egg list updated: on local December 25, HOLIDAY MODE appears and can be dismissed for the session.
- 2026-08-21: Marquee kept as direct client Hacker News fetch, with reduced-motion static mode and HN discussion URL fallback for stories without external URLs.
- 2026-08-21: Full easter egg list: `prawn` keyword reveal; local December 25 HOLIDAY MODE seasonal reveal.
- 2026-08-21: Owner reported marquee was not visibly auto-scrolling, Top Secret did nothing, Spotify fallback was not useful, and footer had too much whitespace; follow-up fix keeps marquee moving, makes Top Secret reveal hints, replaces fake Spotify controls with an honest fallback link, and tightens footer spacing.

2026-09-10: Accepted portfolio upkeep resumes maintenance. Reproduced 10-second Spotify polling; implementing 30-second visible-tab refresh with request guards while preserving local playback animation. Production verification pending.

- 2026-09-11: Bound the existing Spotify API token/playback sequence and body reads to one ten-second deadline, with quiet timeout fallback and timer cleanup. Ten synthetic provider checks pass; five fail against the original source. Production release verification follows.

- 2026-09-11: Addressed GHSA-2v37-7h3g-55p8 in the Vite/PostCSS build chain by updating only Nano ID 3.3.16 to 3.3.19. Final local build and ten API checks pass; npm audit reports zero advisories.

- 2026-09-11: PR #209 merged as c0a4c4d57e30c9927900b00f355c0a0f77fe65f8; deployment dpl_DkLYC9QGPYqeicbBhicrDnwfos1n is READY. Ten final hosted API tests and eight production HTTP/asset checks pass. Final handoff notes are local for batching with the next source change.

- 2026-09-11: Current Vercel runtime aggregation shows a Spotify token-refresh failure behind the HTTP 200 quiet fallback. Earlier checks establish response shape, not provider credential validity/playback. No new provider request; token reuse/backoff and safe failure classification remain follow-ups.

- 2026-09-11: Start token reuse/failure-backoff follow-up from verified production c0a4c4d, carrying forward isolated handoff notes and preserving the original checkout. Validate using synthetic providers before release.

- 2026-09-12: Recovered the reviewed token-maintenance source after the interrupted baseline comparison; exact hash matches the prior successful build. Expanded synthetic concurrency validation and release remain pending.

- 2026-09-12: Validated bounded Spotify token reuse, shared refresh, expiry/401 handling, provider backoff and safe diagnostics: 28 API checks, build/type check and synthetic browser backoff/recovery pass. The isolated old-source comparison fails 23 assertions. Frontend hashes and original checkout edits are preserved; release follows existing hosted checks.

- 2026-09-12: Prawn UI maintenance preserves data/provider contracts and adds keyboard/motion controls. Validate built desktop/mobile behavior and exact production release before closing.


## 2026-09-13 — Weather maintenance

Reproduce the location-policy/fallback mismatch and weather error lifecycle using synthetic providers. Preserve original edits and existing data; verify the accepted Prawn styling and existing Spotify API checks before production.

2026-09-13: CodeQL gap traced to a disabled advanced workflow with default setup unconfigured; the prior August failure was duplicate setup. Restore a single advanced setup covering Actions, JavaScript/TypeScript and Python, including workflow-only triggers. Use three standard-runner jobs, build-mode none and no dependency install for scans. Existing production runtime and all original local edits remain preserved. Hosted verification is next.
