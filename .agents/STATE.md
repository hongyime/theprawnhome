# Prawn Home focus timer release — 2026-09-14

- [x] Reproduce four failing browser scenarios and prepare the isolated fix.
- [x] Pass all five focused browser cases, source type check and production build.
- [x] Pass hosted checks and release PR #214 without bypass.
- [x] Verify exact production assets and all ten timer fixture checks across both aliases.
- [x] Synchronize the original checkout while retaining its local notes and stash.

2026-09-14 Focus timer production checkpoint: PR #214 merged normally at eae1325fc8c7e026e23053ec3d61da19ef54ae3e after all 16 PR checks passed; the merged tree equals reviewed source 0f7cd834cd979b697741cf864881c0c4e09aca8f. Vercel dpl_AMrkxJ2SHCbth7VPXH1kWDYRARW5 is READY for that commit. Both production aliases serve the exact reviewed build and pass five timer browser cases each with synthetic provider responses. All six main workflows pass. Original notes, their raw copies and retained stash are preserved; all other preflight files outside the released change and the environment file remain unchanged. This corrects browser sleep/throttling drift and permits restart after completion. Manual wall-clock changes can still alter a running session; full reload resets the local timer as before. No provider/account request or monthly quota saving is claimed. Evidence: home-focus-production-verified-20260914.json and home-focus-release-20260914.json in the portfolio audit.

# Prawn Home CodeQL maintenance — 2026-09-13

- [x] Verify the live CodeQL settings and previous failed analysis.
- [x] Restore one active setup for Actions, JavaScript/TypeScript and Python; validate the PR.
- [x] Release and verify new main-branch analyses and the production deployment.
- [x] Preserve local notes and publish the updated portfolio report.

The custom workflow was manually disabled while default setup is now unconfigured. The last failure was a duplicate-setup rejection. This change uses the existing advanced workflow as the sole setup, includes workflow-only PR changes and manual dispatch, and uses build-mode none for these interpreted languages. The fixed three-language matrix removes the detector runner. Weekly scheduling and stale-run cancellation remain. No paid security feature or live provider is required. Prawn Home weather PR #212 is already verified in production at c6dc5a8; its earlier pending notes below are historical.

# Prawn Home weather maintenance — 2026-09-13

- [x] Reproduce the deployed location fallback and non-terminating error states with synthetic weather.
- [x] Fix location selection, response validation, request deadlines and accessible recovery while preserving Prawn layout.
- [x] Verify weather lifecycle and the existing API/UI behavior without calling live providers.
- [x] Pass hosted checks, release to existing Vercel production and verify both aliases.
- [x] Verify original-file preservation and update Markdown plus hosted PostPlan.

Previous portfolio turn completed the SMU Seats loading release and PostPlan v63. Previous Prawn Home token and UI releases are already verified in production. This branch starts from main `d1c8fd8`; original local state/journal edits remain preserved. No live Spotify, news or weather requests are needed for fixtures.

The existing weather widget requests geolocation despite a production Permissions-Policy that blocks it; fallback coordinates are San Francisco while the card links to Singapore radar. HTTP failures, bad JSON and stalled responses never exit Scanning. Browser reproduction precedes implementation. An optional owner preference is pending: Singapore default with an explicit location button (recommended), or Singapore only.

The baseline fails five targeted browser checks. All 21 weather data tests, 28 existing Spotify API checks, TypeScript and Vite build pass. The first 38 weather browser scenarios and six existing Prawn keyboard/theme/motion scenarios pass. An expanded final suite adds actual browser geolocation with synthetic coordinates, location cancellation and failed-location reading preservation. Singapore default with explicit opt-in location is the stated assumption after the optional preference question received no answer. No persistent store or background weather poll is added.

Final local validation: all 44 weather browser scenarios pass at desktop/mobile widths, including native browser geolocation with synthetic coordinates. All 21 data checks and 28 existing API checks pass in the final type-checked build. Six Prawn keyboard/theme/motion scenarios pass at 1440/390/320 pixels. All 82 original tracked files and one environment file are preserved; dependency lock, assets, quote constants and Spotify implementation are unchanged. Hosted checks and production release are next.


## Earlier local release notes — preserved during synchronization

- The local one-second playback animation remains separate from network polling. The production build, source type check and synthetic browser regression pass: 30-second cadence, ten hidden minutes without polls, resume, no overlap and failure recovery. Build output is excluded from source type checking.
- Commit `88997a85dd2a106beb841964d8584b03020148dd` is verified in production. Both public domains serve the exact reviewed JavaScript bundle. The live API returned HTTP 200 without a configuration error; the quiet fallback and its feeds link rendered correctly. Desktop/mobile browser checks found no page overflow or JavaScript errors. Monthly usage savings remain unmeasured.

Production verification: PR #212 merged at `c6dc5a8e93b7218c08314a3a265d0ea4c5c35da5`; Vercel deployment `dpl_46W5PaAcjrda1PS1kTErLP96RtCH` is READY. All 44 weather browser cases pass on main; both production aliases pass sixteen fixture scenarios each, and six Prawn UI scenarios plus ten HTTP/asset checks pass. Original main is synchronized, preserving its three local note additions, original note files and stash. CodeQL was already manually disabled and default setup unconfigured; this remains a scanning gap, with no CodeQL pass claimed. PostPlan v64 is published and its hosted bytes match the checked local HTML. The portfolio goal remains active.

2026-09-13 CodeQL production checkpoint: PR #213 merged at 8211215e1155c6adec73af8e082d866c9eb510e9; Vercel dpl_6DRPNaRa2wo3ZyJLUWxGBQCuxjGu is READY. The advanced workflow is active and default setup is unconfigured. All 14 PR checks and four main workflows pass; GitHub accepted Actions, JavaScript/TypeScript and Python analyses for this exact main commit with zero errors, warnings and CodeQL findings. The 28 API tests, 21 weather data tests and 44 weather browser cases pass on main. Both live domains pass ten static/provider-free checks and serve identical app assets. Original main is synchronized, preserving 92 preflight tracked files, the environment file, raw notes and retained stash. PostPlan v66 is published and byte-verified at https://aoo181uudk96.postplan.dev#home-codeql-release. Evidence: home-codeql-release.json and home-codeql-closeout.json in the portfolio audit. Older Semgrep/Scorecard findings remain under review; this does not establish a vulnerability-free app or monthly quota headroom. No database, collector, provider setting, paid feature, shared Docker or SG SHIOK change was made. The portfolio goal remains active; rotate to TicketRemaster E2E validation.
