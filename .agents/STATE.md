# Prawn Home focus timer candidate — 2026-09-14

- Prepared in an isolated review branch; production is unchanged.
- The original timer counted callbacks: after ten minutes of browser sleep it
  showed 24:59 instead of 15:00. Four focused scenarios failed; reset passed.
- The candidate uses an elapsed-time deadline, retains paused milliseconds,
  catches up on visibility/focus/pageshow, and stops display ticks while hidden.
  Starting a finished timer begins a fresh 25-minute session.
- All five focused browser scenarios pass with synthetic time/provider fixtures.
  Source type checking, production bundling and whitespace checks pass.
- Hosted checks and release verification remain for parent review. Existing
  weather, Spotify and broader UI releases are already recorded below; their
  full suites were not repeated for this isolated timer correction.

# Prawn Home CodeQL maintenance — 2026-09-13

- [x] Verify the live CodeQL settings and previous failed analysis.
- [ ] Restore one active setup for Actions, JavaScript/TypeScript and Python; validate the PR.
- [ ] Release and verify new main-branch analyses and the production deployment.
- [ ] Preserve local notes and publish the updated portfolio report.

The custom workflow was manually disabled while default setup is now unconfigured. The last failure was a duplicate-setup rejection. This change uses the existing advanced workflow as the sole setup, includes workflow-only PR changes and manual dispatch, and uses build-mode none for these interpreted languages. The fixed three-language matrix removes the detector runner. Weekly scheduling and stale-run cancellation remain. No paid security feature or live provider is required. Prawn Home weather PR #212 is already verified in production at c6dc5a8; its earlier pending notes below are historical.

# Prawn Home weather maintenance — 2026-09-13

- [x] Reproduce the deployed location fallback and non-terminating error states with synthetic weather.
- [x] Fix location selection, response validation, request deadlines and accessible recovery while preserving Prawn layout.
- [x] Verify weather lifecycle and the existing API/UI behavior without calling live providers.
- [ ] Pass hosted checks, release to existing Vercel production and verify both aliases.
- [ ] Verify original-file preservation and update Markdown plus hosted PostPlan.

Previous portfolio turn completed the SMU Seats loading release and PostPlan v63. Previous Prawn Home token and UI releases are already verified in production. This branch starts from main `d1c8fd8`; original local state/journal edits remain preserved. No live Spotify, news or weather requests are needed for fixtures.

The existing weather widget requests geolocation despite a production Permissions-Policy that blocks it; fallback coordinates are San Francisco while the card links to Singapore radar. HTTP failures, bad JSON and stalled responses never exit Scanning. Browser reproduction precedes implementation. An optional owner preference is pending: Singapore default with an explicit location button (recommended), or Singapore only.

The baseline fails five targeted browser checks. All 21 weather data tests, 28 existing Spotify API checks, TypeScript and Vite build pass. The first 38 weather browser scenarios and six existing Prawn keyboard/theme/motion scenarios pass. An expanded final suite adds actual browser geolocation with synthetic coordinates, location cancellation and failed-location reading preservation. Singapore default with explicit opt-in location is the stated assumption after the optional preference question received no answer. No persistent store or background weather poll is added.

Final local validation: all 44 weather browser scenarios pass at desktop/mobile widths, including native browser geolocation with synthetic coordinates. All 21 data checks and 28 existing API checks pass in the final type-checked build. Six Prawn keyboard/theme/motion scenarios pass at 1440/390/320 pixels. All 82 original tracked files and one environment file are preserved; dependency lock, assets, quote constants and Spotify implementation are unchanged. Hosted checks and production release are next.
