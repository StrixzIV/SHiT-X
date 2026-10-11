# L7: her own Messenger window and a pile of floating MSN bubbles

Date: 2026-10-11. Complete and verified. Uncommitted.

## Request

"on L7 make her own ui just float in there, when she finished the text, the msn bubble also got suck in. so it funny absurd when a lot of msn bubble just float around there"

This supersedes the preceding L7 title-bar stowaway/current-shout behavior, including that portion of `2026-10-11-msn-persistent-bubbles.md`. The regular desktop's persistent, time-grouped three-bubble behavior remains.

## Implementation

- `companion/brain.js`: retain normal `bubbles` separately; introduce `spaceBubble` for the currently spoken L7 line and `debris` for completed floating notifications. Entering L7 interrupts current speech and puts existing desktop notifications in the pile. Each new L7 line gets a fresh bubble. Completion waits for all phrases' voice/reading time and pauses, then transfers the full immutable bubble into debris. A long session keeps up to 32 floating bubbles, evicting the oldest; ordinary desktop history remains capped at three. Active dismissal removes the live bubble without collecting it; a portrait poke can collect the interrupted partial line. Exiting cancels L7 speech and clears its pile; normal history is restored (dismissing a floating copy of a desktop bubble also dismisses that original).
- `companion/Companion.jsx`: reuse the real buddy window/orb via `Buddy`, render the live notification at the corner and portal `SpaceCompanion` into the committed `.calc` overlay. Stable keyed `Drifter` wrappers keep motion independent of React message/face updates. Remove the `Stowaway` title-bar miniature and its balloon.
- New `companion/debris.js`: one animation loop for the full window and all floating notifications. Shared `shot()` aligns their trajectories with the actual hole. Each object pulls in for 1.3 s, disappears for .35 s, emerges over .9 s, then follows a distinct elliptical path with its own speed, phase, scale and spin. Behind-hole masks cut the shadow from the UI. Title-bar dragging/flinging works without hover/focus/click docking. Responsive measurements, pointer cleanup and reduced-motion preference changes are handled.
- `companion.css`: scene layer below the result card, floating object styles and drag handles; a compact static scrollable collection above the result under reduced motion, leaving the result footer reachable; hide everything in print. Remove old static-dock yank/stowaway styles.
- `CalcOverlay.jsx`: detach the miniature, update the L7 context to describe her independent window, end space mode on close. `orbit.js` remarks now identify the result card separately from her. Two fallback lines in `lines.js` no longer claim she is holding its title bar.
- `ARCHITECTURE.md`, `REVIEW.md` and the handoff index document the new behavior.

## Concurrent work

Another agent added current-scene awareness (`surroundings.js`, `syncSurroundings`, overlay metadata and reaction guards) while this task was in progress, including a buddy-specific spit reaction. Those edits are retained. The same working tree includes unrelated branding, quality-route and earlier companion work; this task does not commit/push or revert it. Browser harnesses block Vite HMR so concurrent edits do not reset the page mid-scenario, and use valid `l7:` events for the awareness guards.

## Checks

- `/tmp/ileak-l7-companion-debris-check.mjs` passed in the actual app at port 5201 with mocked companion APIs and valid WAV voice clips: independent full window, post-voice transfer of complete text, pull/gone/spit/orbit stages, more than three independent bubbles, frozen completed content, individual old/live dismissal, voice/queue cancellation without ghost debris, continued movement on focus, real mouse title-bar drag/release, 32-bubble cap eviction, responsive measurements, print hiding, exit cleanup/dock restoration/release remark, fresh reentry, reduced motion and preference changes. No uncaught browser errors.
- `/tmp/ileak-l7-companion-debris-visual.mjs` passed with the actual WebGL black-hole shader on desktop and phone, including live minimise/orb controls. Screenshots visually checked: `/tmp/ileak-l7-companion-debris-desktop.png`, `/tmp/ileak-l7-companion-debris-mobile.png`.
- `/tmp/ileak-l7-companion-debris-reduced.mjs` passed actual pointer activation of the static window's portrait, minimise/orb controls and the result Close action at 844×390, 320×480 and 390×844.
- `/tmp/ileak-msn-desktop-regression.mjs` passed again against the current live store: persistence, time grouping/separation, three-bubble cap, old/active/keyboard dismissal, voice and queue cancellation, late compose/send-time grouping, internal scrolling across desktop/phone/short screens, minimise, and no-backend/no-TTS fallback. Its obsolete stowaway case was removed; L7 is tested separately above.
- `pnpm -s lint`, `pnpm -s build` and `git diff --check` passed after the latest runtime edits.

In a running Vite server, imported modules may have HMR timestamps even when the test websocket is blocked. The harness tracks the exact `/companion/brain.js?...` URL loaded by the app and uses that for `nudge()`, preventing an accidental second store instance during concurrent edits. Do not replace it with a plain dynamic-import path.

## Limits

The extra floating windows are live HTML with affine stretch and shadow masks; the existing result-card displacement and UI-light shader are retained. History lasts for the page session. L7 debris is deliberately scene-local and cleared on exit. No new dependency or real API call is required.
