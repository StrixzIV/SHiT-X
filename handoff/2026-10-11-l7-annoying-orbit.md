# L7 smaller orbit, no hover/click assistance, idle swallow and spit-out

Completed by GPT, 2026-10-11. Verified; uncommitted. No commit, push or deployment.

**Next follow-up:** [L7 UI lensing](2026-10-11-l7-ui-lensing.md) adds nonlinear bending to the live card. The smaller scale, no hover/click reading assistance and idle cycle remain. Its current browser harness follows painted pixels; the native-geometry drag expectations in the temporary script below predate this shader.

## User requests

- The L7 result card must never zoom in or stop on mouse hover, to make it more stupid and annoying.
- Make the card smaller while orbiting. If left alone, the black hole should consume it, hold it for a while, then spit it back out.
- Follow-up: “please dont make it easy by having the click and stick behavior.” Removed the tap/click reading toggle and the keyboard-focus reading assistance too, so interacting with controls cannot restore a sticky enlarged card.

The user's new request authorizes these targeted changes to the orbit controller/overlay, which belonged to Claude during the earlier XP task. The black-hole shader, camera framing and other scenes were not changed.

## Changes

- `src/quality/high/fx/scenes/orbit.js`: removed all hover/tap/keyboard reading states, the click-to-pin toggle, slow physics time multiplier, reading enlargement, viewport clamping and time-dilation note. Hover, clicks, phone taps and focus keep the card in its normal small moving orbit. Pointer movement without a grab does not reset the idle timer. Dragging still tracks the grabbed point; holding an actual drag is the only way to keep it under the pointer.
- `ORBIT_SIZE = 0.7` multiplies the responsive base orbit scale: 30% smaller than before. Perspective, lensing, tidal stretch and spin still vary the projected size naturally. The initial slide-up retains its prior behavior.
- `IDLE_S = 20`: the deadline starts on capture and resets when spat out, pressed/released, dragged, focused, typed into, scrolled or wheeled over. Mere hover/mouse motion without a grab does not reset it. A held card cannot auto-swallow; after release it gets a new deadline. An abandoned focused card is allowed to expire.
- Idle expiry invokes the same `swallow()` used by a drop into the hole. The existing one-second physics spiral/stretch runs, then the sheet is inert and invisible for `GONE_S = 3`, then `emit()` spits it back into orbit and resets the idle deadline. Both the idle deadline and fully hidden wait use wall time; they do not slow down with the physics' capped frame delta. A Thai “หลุมดำกำลังเคี้ยวผลลัพธ์…” note appears during the hidden wait, followed by the existing Hawking-radiation note on return.
- `src/quality/high/fx/CalcOverlay.jsx`: card hint now says “ลากหัวการ์ดเพื่อเหวี่ยง · ปล่อยไว้เดี๋ยวโดนกิน”.
- `ARCHITECTURE.md`, `REVIEW.md`, handoff index and original L7 note updated for the new behavior.

Reduced motion still bypasses the orbit hook entirely, leaving a docked readable result without idle consumption. Existing XP print rules continue to print only the certificate, with transforms/masks removed and hidden scene dimensions retained.

## Verification

- `pnpm lint`: zero warnings. `pnpm build` and `git diff --check`: passed.
- Chromium desktop, 1280×900: repeatedly followed the moving card with the real mouse. Confirmed actual hover, continued orbit movement, small scale and no time-dilation reading note. Two actual mouse clicks and keyboard focus kept the card small and moving. Anchored mouse drag/release, certificate creation, certificate print styling and reassessment passed.
- Browser virtual-clock checks: card stays available before the 20-second deadline, is consumed at expiry, remains invisible for the hidden wait, returns with its Hawking note, and repeats the cycle. Keyboard interaction resets the deadline; a subsequently abandoned focused card is consumed as requested.
- Chromium touch emulation, 390×844: taps kept the card small and moving; heading drag/release passed. Reduced motion remained docked/static. No browser runtime errors.
- Actual WebGL scene, 1280×900: visually checked the smaller card against the rendered black hole. Its projected bounds were approximately 244×191 pixels in this frame. Chromium used ANGLE/Vulkan on the NVIDIA RTX 4060 Laptop GPU; no browser runtime errors.

The functional checks disable WebGL for speed and exercise the actual app/orbit; the separate visual check renders the shader. These checks do not measure physical-phone GPU performance.

## Preview and temporary artifacts

Preview: `http://localhost:5201/?q=high&dev=1&country=TH`, then DEV → enable “ข้ามการคำนวณ” → L7. User port 5173 was not changed.

- `/tmp/ileak-l7-no-stick-check.mjs`: current browser checks, updated for the no-click-to-stick follow-up. Includes desktop hover/click/focus/drag, certificate/print, virtual-clock idle cycle, touch tap/drag and reduced motion. Its virtual clock starts after the app/DEV controls are ready. It uses cached Playwright and adds no dependency.
- `/tmp/l7-smaller-hover.png`: desktop hover screenshot from the functional harness.
- `/tmp/l7-smaller-real-scene.png`: inspected screenshot with the actual black-hole shader running.
- The old `/tmp/ileak-orbit-regression.mjs` uses port 5174 and describes earlier hover behavior. `/tmp/ileak-l7-annoying-check.mjs` still expects tap/keyboard reading assistance. Use the current script for this task.

No remaining implementation work. Shared uncommitted changes from the XP/retro tasks remain in the working tree; preserve them when reviewing this targeted change.
