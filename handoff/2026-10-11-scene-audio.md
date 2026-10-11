# L0 underwater, L5 Hoenn battle and L6 Codec audio

Date: 2026-10-11. **L0/L5 score work below was rejected by the user and superseded by [the original-theme correction](2026-10-11-original-theme-correction.md).** L6's Codec cues and shared synth cleanup remain. This note records the first implementation, not the current L0/L5 melodies or score format. No commit, push or deployment requested.

## User request and choice

The user asked to change L0's musical notes to match Mario's underwater level and Pokémon's battle sound. They explicitly chose **Ruby / Sapphire / Emerald (GBA)** when asked which Pokémon version. During implementation they added: "if possible do the metal gear as well". This expands the audio pass to L6's existing Codec scene. Keep Hoenn/RSE as the preference; do not revert to the initially suggested FireRed/LeafGreen.

Previous XP, agreement, retro scenes and L7 work was already present and remains uncommitted. Read the other handoff notes before changing those systems. This pass changes sound; it does not change sprites, dialogue, stage art, result-card physics or L7's shader.

## Implementation

- **L0:** replaced the short F-major loop with an original sixteen-bar **C-major 3/4 underwater arrangement**. A light 25% pulse lead, quieter alternating accompaniment on beats 2/3 and triangle bass make the waltz bounce more clearly. Held notes and cadences replace the old uniformly short tones. Tempo is 156 BPM, two grid cells per beat; one loop is about 18.46 s. The black lives screen stays silent for 2.4 s, then music starts. Existing bubble/bloop effects remain.
- **L5:** replaced the small square-wave pattern with an original **Hoenn/RSE-style** encounter flourish and eight-bar minor-key battle arrangement: harmonic brass lead, fast quiet 12.5% pulse arpeggios, octave triangle bass, sine kick, bandpass snare, high hats and a final-bar fill. Encounter is one finite 16-cell pass at 210 BPM; battle is 128 sixteenth-note cells at 176 BPM (about 10.91 s per loop). A separate music session fades at the 11.8 s fainting event, so the falling faint cue can finish without music underneath. Text, THUNDER, absorption and HP-drain effects remain. File music also stops at fainting.
- **L6:** ring is three short digital trill bursts with alternating 1500/2250 Hz pulse notes. Connection gets a descending data chirp, acknowledgement and short filtered static. Continuous radio hiss now starts after the 1.1 s connection and is quieter. Text uses short sine clicks with a different pitch per speaker; line endings get short squelches. Native Thai speech is preserved, voices are checked when each line starts so late-loading voices work, and clicks are quieter while a Thai voice is available and sound is enabled. No forced hangup or dialogue timing change.
- **Shared synth:** cached `PeriodicWave` instruments for pulse duty and brass, note hold/cutoff/attack/velocity controls, kick/noise tracks, and explicit finite-sequence timer cancellation. Ended oscillator/noise sources disconnect their per-note graph and leave the session's retained-node set. Existing square/sine/triangle/sawtooth calls keep their defaults. L5 needs separate music and effects sessions so fainting can fade only the music.

These are **original synthesized arrangements/recreations following the games' sound style**, not exact melody transcriptions or downloaded game recordings. No new audio dependency or soundtrack asset was added. Optional user-supplied files still take priority: `public/fx/l0-underwater.mp3`, `l5-battle.mp3`, `l6-radio.mp3` (radio bed only). A missing/undecodable file still falls back to the synth. DEV 1×/3×/10× scales the new scores and Codec cues with the scenes. Existing L0 bubble intervals and L5 attack effects keep their prior timing behavior.

## Files

- `src/quality/high/fx/scenes/sceneAudio.js` — new shared pitch-token score/cue module. `C5:2:0.8` means MIDI pitch C5 held for two grid cells at 0.8 velocity; `.` is a rest. All tracks share their score's grid length. Edit this file to tune phrases without touching scene drawing.
- `src/quality/high/fx/audio.js` — instruments, envelopes and scheduler/node cleanup. It also already had the reverb destination extension from the inherited retro scene work; preserve it.
- `src/quality/high/fx/scenes/L0Underwater.jsx` — score hookup after the existing silent intro.
- `src/quality/high/fx/scenes/L5Battle.jsx` — score hookups and music-only fade at fainting.
- `src/quality/high/fx/scenes/L6Molam.jsx` — Codec cues and quieter connected radio bed.
- `ARCHITECTURE.md`, `REVIEW.md`, `handoff/README.md` — audio descriptions and verification notes.

## References consulted

The ft_blueprint project did not contain a relevant audio implementation. These primary references supplied context rather than a note-by-note score or measured recording:

- [Nintendo's original Super Mario developer interview](https://www.nintendo.com/en-gb/Iwata-Asks/Super-Mario-Bros-25th-Anniversary/Vol-5-Original-Super-Mario-Developers/5-To-Save-Memory/5-To-Save-Memory-212974.html) describes the underwater music's bubbly intent.
- [GAME FREAK's Ruby/Sapphire Super Music Collection](https://music.apple.com/us/album/pok%C3%A9mon-ruby-pok%C3%A9mon-sapphire-super-music-collection/820996217) identifies the requested soundtrack/version.
- [Konami's MGS Integral Codec manual](https://metalgear.konami.net/manual/mc1/mgs1_integral/pc/en/page05.html) documents CALL and the Codec transmission context.
- [MDN `createPeriodicWave`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave) documents harmonic arrays and normalization used for the instrument synthesis.

Do not claim the pitches/tempo/cadence are measured from those references. The tunes and Codec recreation were composed for this project.

## Validation

- Final `pnpm lint`, `pnpm build` and `git diff --check` passed. Build includes the Firebase HTML copy.
- `/tmp/ileak-scene-audio-render.mjs` renders actual scores/cues through Chromium `OfflineAudioContext` into WAVs. Passed: aligned grids (L0 96 cells, L5 128, encounter 16), finite non-silent samples, headroom, silent tails, finite intro scheduler cancellation, zero retained ended nodes. Peaks with a test output gain of 0.8: underwater 0.179, battle 0.597, encounter 0.170, Codec 0.060. This is render/structural verification, not a claim of listening to the original soundtracks or a subjective sound review.
- Rendered previews: `/tmp/ileak-underwater_score.wav`, `/tmp/ileak-hoenn_battle_score.wav`, `/tmp/ileak-hoenn_encounter_score.wav`, `/tmp/ileak-codec.wav`. These are temporary and not bundled into the app.
- `/tmp/ileak-scene-audio-browser.mjs` passed in the actual app: L0 starts its pulse score about 2.46 s after firing (no stage music/bubbles during the lives screen); L5 encounter/battle/faint and music-only fade; L6 1500/2250 Hz trills, connection/static bed and text sounds. The harness accounts for React StrictMode's effect replay and verifies that all scene sources end after closing and no future notes are scheduled.
- Browser checks also passed DEV 1×/3×/10×, missing-file synth fallback, valid WAV responses at the optional MP3 paths (music plays, without a duplicate synth score, while encounter/Codec cues remain), media pause on closing, and shared master mute/resume (gain falls below 0.002 and returns above 0.998). No page runtime errors.

No required implementation work remains. Listen on target devices for subjective musical balance/resemblance, and check a real native Thai voice if available; automated rendering does not establish fidelity to the original game recordings. The Codec WAV preview is a cue sampler, not a full timed scene recording.

The temporary harnesses use the cached Playwright module at `/home/wxz/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`, Chromium at `/home/wxz/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`, and the local Vite server at `http://127.0.0.1:5201`. User server 5173 is untouched. No test framework/package was added to the project.

The taskbar speaker is disabled while covered by overlays; this was inherited from the XP shell. The shared `setSound` API can still mute synth/file audio already playing. Native system speech is not routed through Web Audio; L6 checks `soundOn()` before each utterance, as before.
