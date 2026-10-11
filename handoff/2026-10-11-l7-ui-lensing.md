# L7 shader bends the live result UI

Completed by GPT, 2026-10-11. Verified; uncommitted. No commit, push or deployment.

**Later clarification:** the user liked this card deformation but wanted the black-hole shader itself to bend/reflect the surrounding UI light. That additional implementation is recorded in [L7 UI light around the rim](2026-10-11-l7-ui-light-ring.md). Its background shader now samples a captured UI texture; the no-capture/background-unchanged statements below describe this earlier task only. The live interactive card and its displacement filter are retained.

## User request and inherited behavior

“can you make the shader for the blackhole? so it bend the ui in as well?”

The existing L7 WebGL shader already bends rays through the disk/star field. The result was separate HTML with affine tidal stretch, orbit-position lensing and a shadow mask. This follow-up adds nonlinear pixel displacement to the live result card and its children. The user's prior requirements remain: smaller orbit size, no hover/click/tap/focus reading mode, draggable results, and the 20-second idle swallow / three-second hidden wait / spit-out cycle. See [the preceding orbit handoff](2026-10-11-l7-annoying-orbit.md).

The background shader, camera, other levels and XP header framing were not changed.

## Implementation

- New `src/quality/high/fx/scenes/uiLens.js` contains an actual GLSL fragment shader that encodes a softened point-lens vector field into red/green displacement channels. It renders two 128×128 PNG maps once: gentle swirl (`uSpin = 0.1`) and the stronger swallow swirl (`0.55`). Program, buffers, shaders and the temporary GL context are released after generation; the images are cached for later overlays. If WebGL is unavailable or linking fails, Canvas 2D generates the same fields.
- The helper creates an SVG filter with `feImage`, a neutral gray background, channel bias and `feDisplacementMap`, applied through CSS to the result HTML. Its text, controls, scrolling, waves and newly created certificate stay live; there is no DOM screenshot/texture capture. This is a stylized screen-space lens, rather than a ray-traced 3D HTML surface.
- `src/quality/high/fx/scenes/orbit.js` supplies the hole centre/radius from the shared `shot()` framing. The field is positioned in the card's local coordinate space each frame. Its reach tightens near the hole, its strength grows with proximity/behind-hole depth, and the swallow uses a stronger, tighter swirl. The existing spiral/stretch still runs underneath. The filter activates only after slide-up handoff and is bypassed at zero strength, including fully hidden states.
- Dragging biases the field to leave the grabbed source pixel under the pointer. Pointer positions are mapped from displaced paint back to the native source element. Lookup temporarily clears the CSS filter/shadow mask synchronously and restores them before the next paint, since a source pixel can be masked at its native position while its bent image is visible elsewhere. Fully masked output pixels remain unclickable. Forwarded pointer clicks can activate the visible button/link; keyboard activation keeps its native behavior.
- Pointer handlers run on the calculation surface in capture phase, so bent pixels outside the original card rectangle still work. The SVG filter only changes paint, so native hit regions alone are insufficient.
- On phones, a non-passive `touchstart` handler blocks panning only for the mapped visual heading. `src/index.css` gives a lensed heading `touch-action: auto`, so the native heading region does not accidentally block scrolling when the bent body is painted over it. Body scrolling stays available. This fixes pointer cancellation when a bent heading overlaps the native body.
- Certificate print rules now include `filter: none !important`. Reduced motion bypasses the orbit/lens entirely. The helper restores the original filter and removes its SVG definitions/data attribute when the result closes.

`ARCHITECTURE.md`, `REVIEW.md`, the handoff index and the preceding orbit handoff were updated. No dependencies were added.

## Verification

- `pnpm lint`: no warnings. `pnpm build` and `git diff --check`: passed.
- Chromium desktop, 1280×900: hover, actual painted heading clicks and keyboard focus keep the card small and moving. A magenta marker painted inside the filtered card was located from screenshots, rather than assuming its unfiltered DOM position. The painted mouse grab point tracked the pointer within one pixel. Certificate creation through the painted button, flat printing and overlay/filter cleanup passed.
- Chromium touch emulation, 390×844: actual painted heading taps did not stick; drag/release tracked the painted point within one pixel. After generating a certificate, the body scrolled by hundreds of pixels without becoming a drag. Reduced motion stayed docked, with no lens definitions. No browser runtime errors.
- Virtual clock: 20-second consumption, fully hidden wait, spit-out, interaction reset and repeated cycle passed.
- Actual WebGL enabled in Chromium with ANGLE/Vulkan: inspected the natural orbit, near-hole bend versus the same frame with the filter disabled, and the swallow distortion. Mouse drag/drop, certificate-button activation/printing and return from the hole passed with the scene shader running. No browser runtime errors.

The functional harness disables WebGL and therefore also exercises the 2D field fallback. The separate actual-WebGL harness exercises shader-generated maps and the rendered black-hole background. No physical-phone GPU performance measurements or Firefox/Safari browser runs were made.

## Preview and temporary artifacts

Preview: `http://localhost:5201/?q=high&dev=1&country=TH`, DEV → “ข้ามการคำนวณ” → L7. User port 5173 remains as it was.

- `/tmp/ileak-l7-lens-check.mjs`: current functional/browser checks; cached Playwright, plus Pillow only for reading screenshot marker coordinates. `timing` skips the desktop portion. No app dependency added.
- `/tmp/ileak-l7-lens-real.mjs`: run with `L7_REAL_GL=1` for the actual shader visual/drag/button/print/swallow checks.
- `/tmp/l7-ui-lens-natural.png`, `/tmp/l7-ui-lens-natural-flat.png`: same natural-orbit frame with/without the filter.
- `/tmp/l7-ui-lens-near.png`, `/tmp/l7-ui-lens-near-flat.png`: inspected near-hole bend comparison.
- `/tmp/l7-ui-lens-swallow.png`: stronger swallow distortion.
- Earlier `/tmp/ileak-l7-no-stick-check.mjs` and `/tmp/ileak-l7-annoying-check.mjs` describe prior geometry/reading expectations; use the lens harness now.

Implementation references checked: [W3C Filter Effects](https://www.w3.org/TR/filter-effects-1/#feDisplacementMapElement), [MDN feImage](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feImage). SVG displacement samples the source at an offset derived from image color channels; it can operate on HTML through CSS `filter`.

No remaining implementation work. Shared uncommitted XP/retro changes remain in the working tree; preserve them when reviewing this change.
