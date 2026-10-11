# L7: UI light lensed by the black-hole shader

Completed by GPT, 2026-10-11. Verified; uncommitted. No commit, push or deployment.

## Clarified request

The user said the preceding [live-card lensing](2026-10-11-l7-ui-lensing.md) was nice, but clarified: “what i want is the blackhole shader on itself that reflect or bending lights around it (in this case it just the ui around it)”.

This task adds actual UI texture sampling to the **Gargantua scene fragment shader**, producing curved images of the result's XP title bar, text and buttons around the hole. The preceding HTML displacement remains. The existing small orbit, drag/fling, no hover/click/focus assistance, 20-second idle consumption and three-second hidden wait remain in effect.

## Implementation and affected files

- `src/quality/high/fx/CalcOverlay.jsx` passes the result's `sheet` ref to L7 as `uiRef`. The scene mounts before the result, so the texture bridge attaches when the ref becomes available.
- New `src/quality/high/fx/scenes/uiLight.js` captures the styled card with `html-to-image`, clearing only the clone's transform, filter, mask, opacity and animation. The interactive card remains HTML. It captures the full scrollable content, with a maximum texture dimension of 2048 px. Content mutations, size changes and font loading request a debounced capture; orbital style writes are deliberately excluded. Scroll is a separate live uniform, requiring no recapture.
- Font rules used by the card are embedded into the SVG image. Font files are cached; network requests time out after four seconds and fall back to system fonts. The first texture does not wait for font downloads. Capture failures leave the ordinary black-hole scene and live controls running.
- `src/quality/high/fx/scenes/L7Gargantua.jsx` uploads that canvas into `uUiTex`. Every scene frame supplies the card's CSS centre relative to the scene, inverse affine transform, visible dimensions, image dimensions, scroll and opacity. Thus the optical image follows drag, rotation, scale and tidal stretch immediately, without rasterizing HTML each frame.
- The shader projects bent escaping rays back into a screen-space UI light plane. It also uses a broadened, logarithmic foreground lens to produce a larger, radially inverted and tangentially stretched near-rim image. This visible foreground effect is **artistic, not a physically scaled ray trace of HTML**. The initial pure escape-ray image was too small/faint through the disk at PS2 resolution; the broader foreground image makes the intended effect visible.
- Optical images are confined outside `1.035 ×` the shared shadow radius, and taper away by three radii. The foreground branch ends at 2.1 radii. The existing disk/star ray integration, shot, roll and audio remain. Consumed-card opacity suppresses its light; spit-out restores it. The reflected images are decorative shader pixels; the actual DOM card provides the controls and dragging.
- Reduced motion draws only on changes, including late result mount, capture, resize, retro-switch and scrolling. Fixed a development StrictMode cleanup issue: the initial resize could queue a second redraw; initialization now cancels the superseded request, and callbacks refuse to draw after disposal. This prevents old uniform locations being used after the scene remounts.
- Closing the overlay cancels frames/capture timers, disconnects observers, removes capture metadata and deletes the GL texture, buffer, shaders and program.
- Added `html-to-image` **1.11.13**, synchronized `package.json`, `pnpm-lock.yaml` and `package-lock.json`. No unrelated dependency upgrades were introduced.
- Updated `ARCHITECTURE.md`, `REVIEW.md`, the handoff index and the preceding lensing note to distinguish live HTML deformation from black-hole UI-light sampling.

## Verification

- `pnpm lint`, `pnpm build`, `git diff --check`: passed.
- Actual WebGL in Chromium with ANGLE/Vulkan, desktop 1280×900: framebuffer comparison with UI light enabled/disabled changes about 2,000 console-resolution pixels during a natural orbit, including hundreds of blue title-bar pixels. Dragged near the hole, it changes about 6,300 pixels. The comparison changes **zero pixels inside the dark center** and zero outside the three-radius lens region; GL reports no errors.
- Inspected screenshots with the DOM card temporarily hidden: the black-hole canvas itself contains a curved UI image. This rules out mistaking the earlier HTML displacement for the requested scene-shader effect.
- Dragging the actual painted heading works; optical images follow the changed position. Hover keeps the card small and moving. Holding for more than 20 seconds prevents consumption; release restores the usual idle behavior.
- Clicking the actual painted certificate button generates the certificate and advances the captured-texture revision. Scrolling supplies the actual `scrollTop` to the shader. Print removes the live card's transform/filter.
- PS1/PS2 switches preserve the effect at 240/448 lines; idle consumption suppresses UI light completely during the hidden wait, and spit-out restores it. Closing removes the overlay and its lens definitions.
- Chromium phone emulation, 390×844: visible UI light in the actual shader, no GL errors. Existing touch interactions remain covered by the preceding lens handoff.
- Reduced motion: result remains docked; late-mounted result and newly generated certificate update the shader texture without an animation loop. No stale-program errors after the cleanup fix.
- No browser runtime errors or L7 capture/shader warnings in the final check. Firefox/Safari and physical-phone GPU performance were not measured.

## Preview and artifacts

Preview server: `http://localhost:5201/?q=high&dev=1&country=TH`. Enable “ข้ามการคำนวณ”, fire L7, hide the DEV panel and watch the upper/right rim as the card orbits. Dragging near it makes the image larger. User port 5173 was not changed.

- `/tmp/ileak-l7-light-check.mjs`: final actual-WebGL browser/framebuffer checks, including desktop, phone and reduced motion. Uses the cached Playwright installation; Pillow locates an actual painted magenta marker for pointer targeting. The scene canvas is hidden only during marker-coordinate screenshots so reflected marker pixels cannot contaminate that calculation.
- `/tmp/l7-ui-light-final-desktop.png`: orbit and rim image together.
- `/tmp/l7-ui-light-final-scene.png`: same scene with the DOM card hidden, showing UI light rendered by the black-hole shader.
- `/tmp/l7-ui-light-final-dragged.png`: dragged near-hole card and its curved optical image.
- `/tmp/l7-ui-light-final-phone.png`: portrait preview.
- `/tmp/l7-ui-texture.png`: inspected flat UI source image from the capture bridge.
- `/tmp/ileak-l7-light-reduced-debug.mjs`: isolated diagnostic which helped locate the old redraw callback. Its instrumentation consumes GL errors; use the final check above for verification.
- Older `/tmp/ileak-l7-light-debug.mjs` intentionally relinks the shader to isolate its output, invalidating existing uniform locations. Its warnings are from that diagnostic and do not describe the final implementation.

Primary implementation reference: [html-to-image source and usage](https://github.com/bubkoo/html-to-image). The dependency clones styled HTML into an SVG foreignObject and renders it to a canvas suitable for the UI light texture.

No outstanding implementation work. Preserve the shared uncommitted XP/retro/earlier L7 changes when reviewing or committing this task.
