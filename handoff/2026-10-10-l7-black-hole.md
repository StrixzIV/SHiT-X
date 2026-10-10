# L7 black hole interaction handoff

Date: 2026-10-10. See [the handoff index](README.md) for other work completed while the original agent was unavailable.

## Request and current state

The user asked: “make change to the black hole screen to pull the result that slide in and make it rotate around the black hole, user can also drag the result around in there as well”.

The interaction is implemented and verified, and was committed and pushed on 2026-10-10 together with the cinematic-shot change (commit "L7: result card orbits the black hole; cinematic top-right shot").

## Project context

- React/Vite app. The full implementation lives in `src/quality/high/`.
- `pages/MainPage.jsx` snapshots a score and opens `fx/CalcOverlay.jsx`.
- `CalcOverlay` runs the tally, cuts to one of eight scenes, then slides in the result sheet.
- `fx/scenes/L7Gargantua.jsx` renders the black hole with WebGL. Its shader was left as it was.
- `fx/scenes/index.js` registers scenes and their delays. The existing DEV panel can fire **L7** directly.

## Work inherited from the previous agent

The previous agent had already written `orbit.js`, connected its `useOrbit` hook to the result sheet in `CalcOverlay.jsx`, and added `ORBITS = new Set([7])` to the scene registry. The hook implements capture, gravity, perspective, lensing/masking, dragging, reading mode, and disappearance/reappearance when dropped into the hole.

The integration was incomplete: the result sheet still used its bottom-docked CSS positioning, and the orbit-specific styles were missing.

## Changes completed

### `src/index.css`

- Added `.result.orbit[data-orbit]` positioning at the viewport origin, so the hook's pixel transforms place the card correctly.
- Disabled the entrance animation after takeover; added a complete border, rounded corners, grab/grabbing cursors, and transform/opacity hints.
- Made the heading a touch drag handle with `touch-action: none`. The body remains scrollable. Added overscroll containment.
- Added the Thai interaction hint and floating status-note styles; hid the interaction hint for reduced motion.
- Added print overrides to remove the orbit transform, opacity, mask, and height clipping when printing a certificate.

### `src/quality/high/fx/CalcOverlay.jsx`

- Kept the previous agent's L7 hook wiring and result-sheet ref.
- Made the L7 card keyboard-focusable with `tabIndex={0}`.
- Added the Thai hint: “ลากหัวการ์ดเพื่อเหวี่ยง · แตะเพื่ออ่าน”.

### `src/quality/high/fx/scenes/orbit.js`

- Fixed grab-point tracking using `DOMMatrix` to account for rotation, scale, and tidal stretching. The point grabbed stays under the mouse/finger.
- Released pointer capture cleanly and handled lost capture so the card cannot remain stuck in the held state.
- On touch screens, dragging starts from the heading. A short tap on non-button card content toggles reading mode; a body swipe is left to native scrolling.
- Restricted entrance takeover to the card's `slide-up` animation, with a timeout fallback.
- Added a resize listener and a fallback when `ResizeObserver` is unavailable.
- Added a fallback for browsers without the `:focus-visible` selector.
- Fixed phone reading layout: stretching is disabled while reading, and the bounds calculation accounts for tilt. The heading stays below the app header.
- Prevented the card being swallowed while the user is reading it or has an active pointer grab.

### `ARCHITECTURE.md`

Documented the L7 result-card interaction in the “Result scenes” section.

## Resulting controls

- The sheet slides up, trembles, then gets pulled into an orbit.
- Mouse: drag non-button card content and release to fling it. Hover to slow/enlarge it for reading.
- Touch: drag the heading; tap card content to toggle reading; swipe the body to scroll.
- Keyboard: focus the card or its controls to slow/enlarge it, then use the buttons normally.
- Dropping the card into the shadow triggers the inherited disappearance/reappearance effect.
- Reduced motion leaves the result docked and readable.
- The certificate and reassessment buttons remain functional. Other levels keep their regular result sheet.

## Verification completed

- `npm run lint` — passed.
- `npm run build` — passed, including the existing copy into `functions/dist`.
- `git diff --check` — passed.
- Headless Chromium at desktop size: actual WebGL scene visually inspected, orbit position sampled over time, and dragging checked.
- Browser regression checks passed for orbit movement, keyboard reading, grab-point accuracy, release, viewport resize, certificate creation, print styles, reassessment, and the normal L3 result.
- Phone emulation at 390 × 844 with real touch events passed tap-to-read, heading drag, release, and native body scrolling with an expanded certificate.
- Reduced-motion checks passed. No browser runtime errors were reported.

The input regression harness disables WebGL to avoid software-rendering cost; the actual shader was visually checked separately. These were Chromium checks, including phone emulation, rather than tests on physical phones or Safari/Firefox.

Temporary verification artifacts, outside the repo:

- `/tmp/ileak-orbit-check.mjs` — actual scene sampling and screenshots.
- `/tmp/ileak-orbit-regression.mjs` — input/accessibility/print checks; accepts `mobile` to skip the desktop section.
- `/tmp/ileak-l7-1.png`, `/tmp/ileak-l7-5.png`, `/tmp/ileak-l7-10.png`, `/tmp/ileak-l7-read.png`, `/tmp/ileak-l7-drag.png`, `/tmp/ileak-mobile-read.png`.

The temporary scripts use the existing cached Playwright installation via an absolute local path. No test dependency was added to the project. The local Vite server used for these checks was started on port **5174**, since 5173 was already occupied.

## Picking this up later

There is no known unfinished implementation work for this request. Open the existing DEV panel and fire **L7** to review the result. Enable “ข้ามการคำนวณ (ไปผลลัพธ์เลย)” for a quicker preview. Keep the new `orbit.js` file alongside the CSS and overlay changes when committing.

## Follow-up by the original agent (2026-10-10)

Reviewed the changes above, then fixed two issues found with the real shader on the GPU (headless Chromium with `--use-angle=vulkan`, about 60 fps; software rendering runs the scene at a few fps and the physics slows with it):

- **Throws were caught by hover.** After a mouse fling, the browser fires `pointerenter` on the card still under the cursor, so reading mode slowed the card almost to a stop. Hover is now ignored for 1.2 s after a release (`calmUntil` in `orbit.js`).
- **Dropping by the heading missed the hole.** Only the card's centre was tested, and it sits about 170 px below the heading. Releasing with the held point over the shadow now also swallows the card.

`REVIEW.md` now has an "L7 result card in orbit" checklist. Lint, build and `/tmp/ileak-orbit-regression.mjs` (desktop and mobile) all pass after these fixes. Committed and pushed with the cinematic-shot change.
