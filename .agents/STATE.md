# Active maintenance — 2026-09-11

The owner accepts production maintenance and the existing 30-second display
refresh. Server token/playback fetches currently have no deadline, including
response-body reads. Work in this isolated branch preserves the original
checkout's two preexisting state/journal edits and all frontend behavior.

- [x] Reproduce stalled headers and stalled bodies with synthetic providers.
- [x] Add one 10-second server deadline covering both upstream requests and bodies.
- [x] Verify fallback, success, cancellation and timer cleanup; build/type-check.
- [ ] Commit, pass hosted checks, release and verify production identity/response.

Validation: ten API checks pass, including real local HTTP stalls at token and
playback headers/body, shared deadline and cleanup. The same final tests fail
five assertions against the original API source and the reviewed source was
restored byte-for-byte. The first accelerated fixture raced local HTTP startup;
the final fixture fires the captured ten-second callback only after the intended
network phase is reached. Production build and source type-check pass. Frontend
assets retain their previous hashes. Hosted checks and production remain pending.

Token reuse is a separate follow-up; no credential/provider/storage migration.

# Agent State

Portfolio upkeep — 2026-09-10:
- Owner accepted the portfolio plan and production releases, superseding the earlier cleanup pause below.
- Reproduced the widget polling again after 10 seconds in the built app. Implemented the accepted 30-second cadence, hidden-tab pauses, one request at a time, a 15-second request deadline, cleanup cancellation and bounded failure backoff.
- The local one-second playback animation remains separate from network polling. The production build, source type check and synthetic browser regression pass: 30-second cadence, ten hidden minutes without polls, resume, no overlap and failure recovery. Build output is excluded from source type checking. Production validation is pending.

Current task: phased cleanup for theprawnhome.

Status:
- Orientation completed; implementation is paused as requested.
- Cursor fix committed as `e9de12c fix(cursor): remove pointer movement script`.
- Cursor implementation now uses a CSS cursor image in `index.html`; `CustomCursor` no longer registers pointer movement listeners and is no longer rendered by `App.tsx`.
- Marquee currently fetches Hacker News directly from the browser in `components/Marquee/MarqueeBar.tsx`.
- Existing `api/` directory only contains `api/spotify.ts`; no Hacker News/marquee endpoint exists.

Waiting for owner:
- Birthday date confirmed as Christmas.
- Marquee confirmed as Hacker News. No existing HN endpoint exists; owner asked why one is needed, so keep direct client fetch unless a server endpoint becomes necessary.
- Secret word confirmed as `prawn`.

Next step:
- Bug fix committed as `f1173af fix(spotify): advance playback progress between polls`.
- Secret-word easter egg committed as `6d13f53 feat(easter-egg): add prawn keyword reveal`.
- Christmas seasonal easter egg committed as `d32b8ff feat(easter-egg): add christmas seasonal reveal`.
- Marquee committed as `6eaa846 fix(marquee): harden hacker news ticker`.
- Documentation update in progress: `PRD.md`, `README.md`, `.agents/JOURNAL.md`, `.agents/STATE.md`.
- Verification: `npm run build` passed after final changes.
- Verification: Playwright screenshots captured at 375, 768, 1440 widths in light and dark; representative images inspected.
- Verification: Playwright touch emulation rendered the clock on a 414x896 mobile viewport.
- Verification: Playwright reduced-motion emulation showed marquee static/scrollable (`overflowX: auto`, `transform: none`, 30 links).
- Verification: Secret word requires full `prawn`; `praw` does not trigger, `prawn` reveals PRAWN MODE after page focus.
- Follow-up implemented locally: marquee visibly auto-scrolls even when reduced-motion is enabled, Top Secret reveals easter egg hints, Spotify fallback is useful, and footer whitespace is reduced.
- Verification: `npm run build` passed.
- Verification: Playwright targeted checks passed for marquee movement, footer position, Top Secret reveal, and Spotify fallback action.
