## Prawn UI maintenance — 2026-09-12

Compiled CSS and the Prawn reference typography/grey surfaces replace browser Tailwind compilation. Native weather navigation, labelled theme controls, skip-to-widgets navigation, keyboard news links and a motion pause/reduced-motion mode are implemented. Build-time type checking now includes Vite CSS declarations. Existing API checks/build and dependency audit pass; six desktop/mobile browser scenarios pass at 1440/390/320 pixels under both motion preferences. Production release remains pending. No API, polling cadence, provider, stored data or collector changed.

# Token maintenance validation — 2026-09-12

All 28 synthetic API checks, source type checking and the production build pass. The same 28 checks finish with 23 assertion failures against the isolated baseline. A real browser confirms HTTP-200 provider errors activate the existing 60/120-second client backoff, success restores 30-second polling, and ten hidden minutes produce no requests. Built frontend files are byte-for-byte unchanged. Hosted checks and exact production release verification are pending.

The API reuses expiring tokens and coalesces refresh work in bounded temporary memory per warm function instance. One ten-second request deadline covers waiting, retry and bodies. Transient failures back off; allowlisted credential failures stop retries in that instance until configuration changes. HEAD is provider-free. This is not a global rate limit, and real Spotify credential validity/playback and monthly savings remain unverified. No persistent storage or provider configuration changed.

# Resumed token maintenance — 2026-09-12

The previous turn made progress: 26 API checks and the production build/type check passed, token reuse/backoff was implemented, and eight Supabase Storage metadata queries completed. The session stopped during an expanded baseline comparison. Its handle and processes are now gone; the reviewed API has been restored byte-for-byte to the successful build hash. Two concurrency fixture cleanup issues are being corrected before final validation. Production is unchanged.

# Active token maintenance — 2026-09-11

- [x] Reproduce repeated token refreshes, rejected/malformed provider responses and concurrent/timeout behavior with synthetic providers only.
- [x] Reuse valid tokens with expiry margins, coalesce concurrent work and back off on provider failure without exposing credentials or changing the 30-second display cadence.
- [x] Verify timeout/cancellation, recovery, response compatibility and bounded memory locally and in hosted checks.
- [ ] Release the reviewed source, verify the exact Vercel production deployment, preserve original edits and update both portfolio plan formats.

The previous portfolio turn made verified progress: BBCS PR #2 is merged, all 26 deployed Vercel projects were READY at closeout, and PostPlan v38 is published. This task uses synthetic providers; no Spotify OAuth/account flow or credential rotation is requested. Existing frontend cadence and prior ten-second request bound remain requirements.

## Runtime review — 2026-09-11

The token-refresh error group reports two occurrences and was last seen on the current production deployment at 05:36 UTC, coinciding with the earlier bounded API verification. Group counts/first-seen dates can include historical occurrences. The API returns an HTTP 200 quiet fallback, so response-shape checks did not verify playback or refresh-token validity. The grouped message does not establish the provider rejection reason. No additional Spotify account/provider request was made in this review. Token reuse, failure backoff and credential-safe provider diagnostics remain open. Production deployment and public homepage checks pass. The original checkout and its two existing state edits remain untouched.

# Active maintenance — 2026-09-11

The owner accepts production maintenance and the existing 30-second display
refresh. Server token/playback fetches currently have no deadline, including
response-body reads. Work in this isolated branch preserves the original
checkout's two preexisting state/journal edits and all frontend behavior.

- [x] Reproduce stalled headers and stalled bodies with synthetic providers.
- [x] Add one 10-second server deadline covering both upstream requests and bodies.
- [x] Verify fallback, success, cancellation and timer cleanup; build/type-check.
- [x] Commit, pass hosted checks, release and verify production identity/response.

Validation: ten API checks pass, including real local HTTP stalls at token and
playback headers/body, shared deadline and cleanup. The same final tests fail
five assertions against the original API source and the reviewed source was
restored byte-for-byte. The first accelerated fixture raced local HTTP startup;
the final fixture fires the captured ten-second callback only after the intended
network phase is reached. Production build and source type-check pass. Frontend
assets retain their previous hashes. Initial hosted checks passed. The build audit then identified Nano ID 3.3.16
through Vite/PostCSS. Only its lockfile entry changed to patched 3.3.19; the
final local build and all ten API checks pass, and npm audit reports zero
advisories. Frontend asset hashes are unchanged. Final hosted checks pass in PR #209. Production merge c0a4c4d57e30c9927900b00f355c0a0f77fe65f8 is READY and all eight HTTP/asset checks pass across both public domains.
These final handoff notes are intentionally local until the next source release.

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
