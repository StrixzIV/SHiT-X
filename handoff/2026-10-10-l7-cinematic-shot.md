# L7 cinematic shot handoff

Date: 2026-10-10. Builds on [the L7 orbit work](2026-10-10-l7-black-hole.md).

## Request

"make the blackhole scene become more cinematic here, the composition is now capturing top right part of the blackhole with a little bit of tilt / and lets make the transition just slowly fade from black / then add stars in to make it pretty". The user also said the hackathon look will be Frutiger Aero / 2000s glass with prerendered-era or low-res, jagged PS2-style 3D, still to be discussed, so this pass should not be over-polished.

## Changes

- `src/quality/high/fx/scenes/gargantua.js` (new, untracked): one definition of the shot (hole centre, shadow radius, roll) shared by the shader and the orbit.
- `L7Gargantua.jsx`: shader camera takes `uShot` (hole centre in uv, focal length, roll) for a telephoto shot of the hole's top-right with a ~9° roll. Exposure ramps up from black over 4.5 s. Three star layers with colour and twinkle, plus a faint dusty Milky Way.
- `scenes/index.js`: `SCENE_MS[7]` 9000 → 10500 ms, to keep the scene on screen for a while after the fade.
- `orbit.js`: places the hole from `shot()`. The home lap is now a Kepler ellipse with the hole at a focus: apoapsis in the open sky (top right; top centre and a flatter lap on portrait), periapsis just outside the shadow. Steering targets the ellipse's Kepler velocity, blending to a circular orbit deep inside so a card near the hole can climb out. Releasing over 0.8 R of the shadow swallows the card; re-emission heads for the open sky.
- `ARCHITECTURE.md` and `REVIEW.md` describe the new shot, fade and lap.

## Checks

- Lint, build, `git diff --check`.
- `/tmp/ileak-orbit-regression.mjs` passes (desktop, L3, phone touch, reduced motion, no runtime errors).
- Real shader on the GPU (headless Chromium, `--use-angle=vulkan`, ~60 fps): screenshots at 1280×900 and 390×844; fade brightness 2.8 → 14 → 53 → 65 at 0.3 / 1.5 / 3 / 5.5 s. The card is fully on screen ~64% of each lap on a laptop and ~49% on a phone, entirely off-screen ~11% / ~26%. Hover-to-read, fling and drop-in rechecked.

Committed and pushed on 2026-10-10 together with the orbit work (commit "L7: result card orbits the black hole; cinematic top-right shot").
