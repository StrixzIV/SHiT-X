# Retro result scenes (Claude, in progress)

Date: 2026-10-10. Claude's half of the XP / PS1-PS2 direction; GPT 6.1 has the UI half in [the XP UI brief](2026-10-10-xp-ui-for-gpt.md), which also lists who owns which files.

## Decided by the user

- **PS1 | PS2 switch** at the top right, no "original" option, always starts on PS2.
- **Scenes:**
  - L0 Famicom, L1 XP blue screen and L5 GBA battle keep their own platform look.
  - L6 becomes a Metal Gear-style Codec call.
  - L2, L3 and L4 are rebuilt as low-poly 3D.
  - L7 (black hole) renders in PS1 or PS2 style.
- **Calculation screen:**
  - PS2 boot style, with the Balatro tally on top.
  - When it finishes, a PS2-like zoom in to black, then the result scene.

## Plan

1. `retro.js` (mode store) and the header switch. Done.
2. A small WebGL low-poly renderer with PS1 traits (240 lines, vertex snapping, affine textures, dithering) and PS2 traits (448 lines, hard jagged edges, glow), shared by the 3D scenes and the loading screen.
3. L7 in both modes.
4. PS2-style calculation screen and the zoom-to-black transition.
5. L2, L3, L4 in low-poly 3D.
6. L6 Codec call.
7. Docs (`ARCHITECTURE.md` and `REVIEW.md` "Result scenes" sections), checks.

## Status

Done, uncommitted (2026-10-11). Files:

- **New:**
  - `retro.js`, `components/RetroSwitch.jsx`
  - `fx/gl/` (`m4.js`, `mesh.js`, `retroGL.js`, `useRetroGL.js`)
  - `fx/scenes/Boot.jsx` (the loading backdrop: since 2026-10-11 a 2D-canvas port of ft_blueprint's PS2 boot, `/home/wxz/42me/ft_blueprint/src/skins/consoles/ps2.ts` `ps2Boot`, replacing the first WebGL tower field), `fx/retro.css` (scene CSS, imported by `CalcOverlay`)
  - `fx/Certificate.jsx` (handed to GPT 6.1)
- **Rewritten:** `L2Heaven.jsx`, `L3Thunder.jsx`, `L4Skeleton.jsx` (low-poly 3D) and `L6Molam.jsx` (Codec call).
- **Changed:**
  - `L7Gargantua.jsx`: console resolution and PS1 dithering.
  - `CalcOverlay.jsx`: boot screen and zoom transition.
  - `scenes/index.js`: `SCENE_MS` L6 13 s, L7 10.5 s.
- **Also changed on 2026-10-11:** the FAHH clip plays at `FAHH_GAIN` 0.35 (`L4Skeleton.jsx`). L1 lost its mains hum and plays its spark crackle only on every second burst (~1.8 s).
- **The way out of the boot screen (2026-10-11):** `ZOOM_S` 2.4 s.
  - Dive (~1.4 s): faster and faster, rolling anticlockwise, with the user's frame-stacking blur: the previous frame is laid over each new one at 85% a frame, with no zoom or turn of its own. A short flare ends it.
  - Void (~1 s): only the smoke (fog) is left, drifting closer and fading. The ambience fades out on its own gain node, and a swell and hiss lead into the cut.
  - The user rejected an earlier version that zoomed and turned the previous frame (a spiral) and had specks in the void. Don't bring those back.
  - `audio.js` `reverb()` takes an optional `dest`.
- **Glass cubes (2026-10-11):** `fx/scenes/ps2boot.js` holds the boot screen's shared parts and `createGlass()`, a WebGL2 port of ft_blueprint's `src/gfx/scenes/ps2.ts` glass shader. Fog comes from the CPU texture instead of a GPU bake. The roll is a pixel-coordinate rotation in the shaders. Without WebGL2, `Boot.jsx` draws the canvas cubes.
- **L2 redone (2026-10-11):** the user rejected the first 2D cartoon version as janky. It's now low-poly 3D in `fx/gl/` with noise-generated "trying to be realistic" billboard cloud cards (a 2 × 2 atlas), a janky low-poly stairway, low-poly additive god-ray shafts and a glow. At the top is the crowd from the "everyone in heaven" meme: `public/fx/l2-heaven-crowd.jpg`, cropped from the user's `~/Pictures/meme/xrb14ullwmg21.jpg`, as a feathered billboard. The camera starts looking down at the steps and tilts up at 0.5–2.2 s.
- **Removed:** `fx/Particles.jsx`. `public/fx/heaven.jpg` and `skeleton.png` are no longer used but are kept.
- **Docs:** the "Result scenes" parts of `ARCHITECTURE.md` and `REVIEW.md`.

Checks:
- Lint is clean for these files; the only warning left is in GPT 6.1's `components/Taskbar.jsx`, `react(set-state-in-effect)`.
- Build passes.
- The regression script passes on desktop, phone, reduced motion and runtime errors.
- Real-GPU screenshots of the boot screen, the zoom, L2, L3, L4, L6 and L7 in both PS1 and PS2 show no console errors.
