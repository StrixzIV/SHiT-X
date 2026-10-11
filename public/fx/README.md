# Replaceable scene music, sounds and graphics

Put files in this directory using the exact names below, then reload the page. The scene tries each filename in the listed order and uses the first playable/loadable one. A missing or undecodable file falls back to the built-in synth or drawing.

Scene audio currently looks for **these `.mp3` names only**. Naming a file `l0-underwater.wav`, for example, will not make the current scene load it. The XP sound system separately supports MP3/WAV/OGG.

## Scene music and sound

| Level | Filename(s), in priority order | What it replaces | Playback |
| --- | --- | --- | --- |
| L0 — NES underwater | `l0-underwater.mp3` | Underwater music | Loops; starts after the 2.4 s silent lives screen. Bubble/bloop effects remain. |
| L2 — Heaven | `l2-heaven.mp3` | Synth choir and harp | Plays once when the scene starts. |
| L4 — Skeleton | `l4-fahh.mp3`, `fahh.mp3`, `fahhhhhhhhhhhhhh.mp3` | FAHHH voice effect | Plays on the cut and about 2.6 s later at 1×. Electrical buzz remains. |
| L5 — GBA wild battle | `l5-battle.mp3` | Entire battle score, including the opening | Loops from scene start; stops at fainting (~11.8 s at 1×). Attack, typing and HP effects remain. |
| L6 — Codec | `l6-radio.mp3` | Connected radio background/static bed | Loops after connection (~1.1 s at 1×). Ring, connection chirps, text blips, squelch and native Thai speech remain. |
| L7 — Black hole | `l7-space.mp3` | Synth space drone | Loops. |

L1 sparks and L3 rain/thunder do not have a drop-in audio file hook. Their sounds, the boot/loading sounds, and the extra scene effects listed above are generated in code. Closing a scene stops its file audio. File tracks retain their normal playback rate in DEV fast preview; synthesized scores scale with DEV speed.

## Scene graphics

| Level | Filename(s), in priority order | What it replaces | Suitable image |
| --- | --- | --- | --- |
| L2 — Heaven | `l2-heaven-crowd.jpg`, `l2-heaven-crowd.png`, `l2-heaven-crowd.webp` | Crowd at the top of the stairs | A wide image, about 2.3:1; its aspect ratio is preserved. |
| L3 — Thunder | `lowtiergod.png`, `lowtiergod.jpg`, `lowtiergod.webp` | Figure/photo revealed by lightning | A transparent cutout becomes a giant standing in the street; an opaque image fills the sky. |
| L5 — Battle | `l5-opponent.png`, `l5-opponent.jpg`, `l5-opponent.webp` | Opponent sprite | A square image, preferably transparent PNG; drawn at 44×44 game pixels. |

Use one format per graphic, or replace/remove a higher-priority file before adding a lower-priority alternative. For example, the existing `l2-heaven-crowd.jpg` wins over a newly added PNG.

The opponent name stays `PLUGCHU` unless `OPPONENT` is changed in `src/quality/high/fx/scenes/L5Battle.jsx`.

`heaven.jpg` and `skeleton.png` are leftover files and are **not read by the current scenes**. Replacing them has no visible effect. L0's sprites, L1's BSOD, L4's person/skeleton, L6's portraits, L7's black hole and the loading screen are drawn in canvas/WebGL/code and have no image-file replacement hook. L2's stairs/clouds and L3's street are also generated in code.

## Desktop assets

The wallpaper is `public/ui/desktop.svg`. Replace that SVG to change the wallpaper; another filename or format requires updating the URL in `src/index.css`.

XP sound files go in **`public/sounds/`**, not here. Each stem below supports `.mp3`, then `.wav`, then `.ogg`:

| Filename stem | Sound |
| --- | --- |
| `xp-startup` | Main app startup |
| `xp-exclamation` | Agreement warning popup |
| `xp-critical` | READ FIRST error or platform/region block |
| `xp-ding` | Final consent popup, helper action or login information |
| `xp-notify` | Helper notification |
| `xp-device-connect` | Device connection / hardware balloon |
| `xp-device-disconnect` | Device disconnection |
| `xp-start` | Start menu opening |
| `xp-shutdown` | Restart parody |

Example: `public/sounds/xp-exclamation.wav`. Reload after replacing sounds because decoded XP clips are cached for the page session. See [the desktop sound README](../sounds/README.md) for triggers.

Source of truth: `src/quality/high/fx/scenes/L*.jsx`, `src/quality/high/fx/audio.js`, `src/quality/high/sound/scheme.js` and `src/index.css`. Verified 2026-10-11; this is the existing replacement interface, not a new asset loader.
