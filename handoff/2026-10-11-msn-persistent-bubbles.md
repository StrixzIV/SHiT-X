# Persistent, time-grouped MSN notifications

Date: 2026-10-11. Complete and verified. Uncommitted.

**Later L7 follow-up:** the title-bar stowaway/current-shout behavior is superseded by [her own floating Messenger window and MSN bubble pile](2026-10-11-l7-companion-debris.md). The desktop grouping/dismissal behavior below is retained.

## Request and inherited state

The other agent stopped immediately after proposing this behavior, before leaving a handoff for the change. The user supplied the plan: notifications must never fade on a timer; messages less than 10 s apart share a bubble; wider gaps create separate bubbles; clicking dismisses a bubble and also stops speech if it is active; at most three bubbles remain, with internally scrolling message bodies; the L7 stowaway shows only her current shout.

The existing companion implementation and its earlier note (`2026-10-11-companion.md`) were present. They used a single `{msgs, typing}` toast and cleared it 2.2 s after each line. Preserve the other agent's unrelated uncommitted companion, tier-card, server, CSS and app work. This task neither commits nor pushes it.

## Changes

- `src/quality/high/companion/brain.js`: separate persistent `bubbles` from the current line's `msgs`; add `activeBubble`, stable numeric bubble IDs, `BUBBLE_GAP = 10000` and `MAX_BUBBLES = 3`. Messages group by actual send time, rechecked after slow composition/TTS. An empty provisional bubble can show typing before the first message. A fourth displaces the oldest. Remove the `LINGER` timer; completion clears only current speech/typing, retaining notifications.
- `hush(id)` now dismisses the specified bubble. Dismissing the active bubble invalidates asynchronous work, stops the current voice and discards pending speech. Dismissing an older bubble does not affect speech or its queue. Interrupting/poking her retains completed notifications and removes empty typing placeholders. A post-compose cancellation guard prevents a late reply from starting TTS after she has been stopped. Ended voice sources disconnect their audio nodes.
- `Companion.jsx`: render keyed bubbles in `.cp-toasts`; clicking the body/header or close button dismisses its bubble. The real close button also supports keyboard activation. Message bodies expose a polite live log and scroll to newly appended messages. Minimise preserves the same bubble list.
- `companion.css`: bound the stack to the space below the header and above her dock/taskbar, preserve the portrait/orb and toast headers, and allow message bodies to shrink/scroll with a 160 px body cap. A compact portrait on screens under 500 px high leaves space for all three bubbles. Existing taskbar/hardware-balloon offsets and reduced-motion behavior are retained.
- L7 keeps the dock history hidden and intact. Shouts update only current-line `msgs`, never notification history; the stowaway balloon shows the current phrase and clears when that line finishes.
- `ARCHITECTURE.md` and `REVIEW.md` describe the resulting behavior and checks.

## Verification

- `pnpm -s lint`, `pnpm -s build` and `git diff --check` passed.
- `/tmp/ileak-msn-bubbles-check.mjs` passed all checks in the actual app at `http://127.0.0.1:5201`, with intercepted companion APIs and valid generated WAV clips (no real API keys/calls): persistent completed bubbles; nearby sends grouped and wider gaps separated; oldest evicted by a fourth; old bubble dismissal preserves current voice and queued speech; active body click stops voice and drops later phrases/queued speech; keyboard close stops even the last playing phrase; late compose after cancellation cannot start TTS; grouping is rechecked at actual send time after a delayed compose.
- Layout and scrolling passed at 1280×900, 390×844, 320×480 and 844×390: the stack stays below the header and inside the viewport, long bodies scroll, new messages follow the bottom and minimise retains history. Mobile screenshot visually checked: `/tmp/ileak-msn-bubbles-mobile.png`.
- The actual `Stowaway` component was mounted for the L7 check: old dock history is hidden, only one current phrase appears, it clears when speech finishes and the original dock history returns unchanged. No-backend/no-TTS prewritten fallback also keeps bubbles until dismissed. No uncaught browser errors.
- The harness blocks Vite's HMR websocket to keep concurrent edits elsewhere from reloading the test page mid-scenario. Concurrent branding/logo edits appeared in the working tree during this task; they were left intact.

## Limits

History is in memory for the current page session, not persisted across reloads. A fourth bubble evicts the oldest as requested. Real DeepSeek/Paxa service access is unrelated to this change and is not required for these checks.
