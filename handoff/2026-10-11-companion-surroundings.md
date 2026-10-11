# Companion awareness of result scenes

Date: 2026-10-11. Implemented and verified; uncommitted.

The user reported that her result-page lines ignored her surroundings and asked for better DeepSeek context or line conditions. They then clarified that she should still shout from inside and around the black hole. Preserve that clarification: a hidden L7 window remains audible; do not silence her just because she disappears.

## Changes

- `companion/surroundings.js` reads the actual overlay phase, level, scene, verdict, voltage, result-card motion/certificate, tab visibility, and her own independent window's flight/visibility. Her window and the result card are different objects.
- `CalcOverlay.jsx` exposes scene metadata on the overlay. Release/evaluate-again remarks run after the overlay closes, so they describe the desktop rather than the old result screen.
- `brain.js` enriches every accepted event with current surroundings. Result screens suppress ordinary setup, tier/power/peripheral, help, generic click and idle chatter. Returning to the tab, poking, certificate requests and L7 events use context-specific banks. The loading/scene/result phases permit their own reactions.
- Scene changes, result-card disappearance/reappearance and leaving/hiding the browser tab interrupt outdated speech and queued work. Late LLM/TTS replies cannot start old-screen speech. Entering/exiting the hole does not interrupt an already delivered shout. If visibility changes before a delayed reply is delivered, reselect a current fallback or recompose before starting its first phrase. Model history contains only delivered phrases, never cancelled drafts.
- `Companion.jsx` watches scene/flight DOM transitions and tab visibility, without observing animation styles.
- `debris.js` identifies window fling/swallow/emergence as `subject: 'buddy'`; `orbit.js` identifies result-card events as `subject: 'result-card'`. Own-window transitions can trigger cries from inside the hole and reactions when emerging. Existing independent window/debris work remains intact.
- `lines.js` offers scene-specific banks consistently, separate card/window reactions, inside-hole cries, and result/space-specific tab-return, poke and certificate lines. Candidate filtering and offline fallback use the same policy.
- `server/companion.js` places authoritative surroundings before action details, separately from their truncation. Its system prompt prioritizes actual surroundings over recent lines, notes, builtins and suggested modes; forbids confusing the two orbiting objects; and explicitly encourages short panicked or indignant Thai shouts inside/around the hole.

## Verification

- `/tmp/ileak-surroundings-unit.mjs`: policies and fallback candidates across L0–L7, inside-hole shouting with unrelated chatter suppressed, hidden-tab silence, card/window identity, and the actual middleware's DeepSeek request with mocked upstream.
- `/tmp/ileak-surroundings-browser.mjs`: actual loading/scene/result metadata, slow main-page reply discarded on entering results, generic events blocked before API calls, contextual tab return, scene exit stopping speech, independent window swallow/emergence, inside-hole shouting, separate card reaction, and no uncaught browser errors. APIs and voice clips are mocked; no production credentials or service calls are needed.
- `/tmp/ileak-surroundings-msn-regression.mjs`: existing notification/speech tests through delayed-send grouping, covering persistence, three-bubble limits, dismissing old versus active bubbles, last-phrase/keyboard cancellation, queued speech and late composition.
- Build, lint and `git diff --check` passed. Live model wording and live Paxa delivery have not been evaluated by these mocked checks.

The browser harnesses resolve the app's actual `brain.js` resource URL (including Vite's update query) before importing it. An unqualified import during concurrent HMR edits can create a second store and produce misleading speech/notification test failures. Both final browser checks passed against the actual app store.

Concurrent independent companion/debris and Low/Medium-quality changes were already underway. This task does not commit, deploy or replace them.
