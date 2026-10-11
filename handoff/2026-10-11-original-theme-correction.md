# Correct L0/L5 to the original game themes

Date: 2026-10-11. Done; reference/render/scene checks passed. Uncommitted; no push/deployment requested.

## User correction and cause

The user said the Mario underwater music should be the **original Mario underwater theme**, and that the Pokémon sound was also wrong. They asked how it works here. Their earlier version choice remains **Ruby / Sapphire / Emerald (GBA)**. L5 is a wild battle, so its reference is the Hoenn wild-battle theme.

The first audio pass composed different melodies with broadly similar instruments. That misunderstood the request. Its automated checks established playback, timing/lifecycle and sound levels, but did not establish musical identity. The old note is explicitly superseded for L0/L5. Do not restore those invented scores or describe them as the requested original themes. L6's Codec cues were not part of this correction and remain.

## How scene audio works

The scenes call `playFile` in `fx/audio.js`, looking for optional music under `public/fx/`. There are currently no `l0-underwater.mp3` or `l5-battle.mp3` files. Missing/undecodable files resolve false, so the browser synthesizes the fallback score in `scenes/sceneAudio.js`.

The fallback is note data, not a hidden soundtrack stream: MIDI pitches become oscillator frequencies (`440 * 2 ** ((midi - 69) / 12)`); the sequencer queues notes about 250 ms ahead, ticking every 100 ms. Pulse, triangle, sine, sawtooth and harmonic brass voices plus filtered noise provide the instruments. Session gains route into a shared master for mute and closing. Supplying the actual desired recording at the optional path bypasses the score and reproduces that recording's instruments too.

## Correction

- **L0:** the actual opening's D–E–F♯–G–A–B♭ climb, repeated B notes, then the held E/E♭/E melody and pickup run replace the invented C-major arpeggio. Harmony and triangle bass are decoded from the same NES note data, including initial bass rests. Both pulse channels use 50% duty. This is a **short opening excerpt**, 384 NTSC frames (~6.39 s), represented by 48 cells of eight frames each. Tempo representation is 112.68525 BPM with four cells per quarter. The first 192 frames play once; the next 192-frame melody phrase repeats. The existing lives screen remains silent for 2.4 s before music, and bubbles/bloops remain.
- **L5:** the original chromatic descent, opening harp/saw accompaniment, source horn phrase, bass, harmony and snare/timpani hit timing replace the unrelated D-minor melody and invented drum pattern. Tempo is **196 BPM**, as encoded in the source MIDI (306122 μs/quarter, approximately 196.0003 BPM). This is a **short opening excerpt**, the first 576 MIDI ticks at 24 ticks/quarter (~7.35 s), in 96 cells of six ticks each. The 192-tick opening plays once, then the next four-bar horn phrase repeats. Original pitch/onset/duration/velocity data is preserved in that excerpt; source instrument roles are approximated with browser synth voices, not the game's PCM sound bank.
- L5 music now starts at scene mount, spans the flash/wipe and continues through battle. The separate made-up encounter jingle is removed. A supplied `l5-battle.mp3` starts at mount and replaces the whole score, including its intro, so no fake intro plays on top of it. The separate music bus still stops at the 11.8 s fainting event; attack/text/HP/faint effects keep their existing timing.
- `sequence` has a `loopStart` grid offset: first pass starts at zero, later passes begin at the selected phrase. Finite-loop cancellation and session cleanup are preserved. L0 uses 24; L5 uses 32.
- Pitch tokens now advance time: `C5:2` occupies two cells; `.:4` is a four-cell rest. A third value is MIDI velocity (0–127), e.g. `G3:2:60`. `phrase()` pads held cells with nulls, so notes trigger once, and pads silent voice parts to the common grid.

The bundled fallback is a short synthesized excerpt/phrase loop, **not a full original soundtrack recording**. The melodies and rhythm have objective reference checks; timbre fidelity still requires listening, and exact original GBA sound requires the actual recording or game sample bank. No ROM, full soundtrack, full MIDI or new audio dependency was bundled. Optional full audio files remain supported.

## References and reproducibility

- [SMB disassembly by doppelganger, hosted by Dan Salvato](https://gist.github.com/dansalvato/ef1e3d34f6af710e57a876005d8b29a7): `WaterMusData`, `WaterMusHdr`, `FreqRegLookupTbl`, `MusicLengthLookupTbl`, `AlternateLengthHandler` and the triangle's frequency division. Used to decode only the opening excerpt. Temporary reference: `/tmp/ileak-smb-reference.asm`, SHA-256 `6af790bc54d2847405dcb071490c86270504f3ec1426f320420c825cc7e459d7`.
- [John Stacy's Underwater transcription at VGLeadSheets](https://www.vgleadsheets.com/assets/sheets/C/Super%20Mario%20Bros.%20-%20Underwater.pdf): independently confirms the opening pitches and held E/E♭/E phrase. The concert-C sheet was rendered and visually inspected. Temporary `/tmp/ileak-water-sheet.pdf` and `.png`.
- [pret/pokeemerald `mus_vs_wild.mid`](https://github.com/pret/pokeemerald/blob/master/sound/songs/midi/mus_vs_wild.mid): only its first 576 ticks are represented in the fallback. Temporary `/tmp/ileak-hoenn-wild-reference.mid`, SHA-256 `f3a7287af6fa8547e3bbfd36391aa41dd7ac0c367739174836a3993d2a908421`. Metadata and note-on/off events establish tempo, pitches, rests, velocity, bass and drum rhythm. Program changes at tick 192 establish the intro/horn division.

`/tmp/ileak-extract-audio-references.py` independently decodes those source formats and writes only the selected excerpt's events to `/tmp/ileak-audio-reference-excerpts.json`. `/tmp/ileak-check-theme-references.mjs` imports the actual browser module and compares it to the decoded reference: **all 48 NES and 171 Hoenn events passed**, including onset, duration, velocity, tempo and loop boundary. Snare MIDI pitch is mapped to a bandpass-noise cutoff; its onset/duration/velocity still match.

## Files changed

- `src/quality/high/fx/scenes/sceneAudio.js` — correct opening excerpts, phrase notation, source roles; Codec cues retained.
- `src/quality/high/fx/scenes/L0Underwater.jsx` — comment corrected; hookup stays after the lives screen.
- `src/quality/high/fx/scenes/L5Battle.jsx` — continuous original opening at scene start, entire-score file override, removed invented encounter score.
- `src/quality/high/fx/audio.js` — loop offset; misleading all-original-music comment removed.
- `ARCHITECTURE.md`, `REVIEW.md`, handoff index and previous audio note — correction and current behavior.

## Verification

- Reference comparison passed as described above.
- Updated `/tmp/ileak-scene-audio-render.mjs` passes actual Chromium `OfflineAudioContext` rendering of an opening plus two passes through its melody region. Finite samples, headroom, silent tails, zero scheduling timers and zero retained ended nodes. Peaks at test output gain 0.8: L0 0.196, L5 0.182. Codec render still passes. `/tmp/ileak-underwater_score.wav` and `/tmp/ileak-hoenn_battle_score.wav` now contain the corrected openings with one repeated phrase, replacing the earlier preview renders. The old `/tmp/ileak-hoenn_encounter_score.wav` is obsolete.
- Final `pnpm lint`, `pnpm build` (including Firebase HTML copy), and `git diff --check` passed.
- Updated actual-app browser checks in `/tmp/ileak-scene-audio-browser.mjs` passed: L0 starts stage music about 2.46 s after firing, L5 starts the continuous theme opening about 56 ms after firing and stops its music at fainting, file music also pauses at fainting, master mute/resume, DEV speed 1×/3×/10×, file override without duplicate synth, all scene sources ended and no future notes scheduled after closing. L6's existing Codec cues still pass. No page runtime errors.

No required implementation work remains for this correction. The bundled sound is explicitly the short synthesized excerpts described above; listen on target devices for timbre/balance and supply the optional audio files if exact/full recordings are desired.

The cached Playwright/Chromium paths and Vite port 5201 are in the preceding audio handoff. No claim was made of listening to the original game recordings; the evidence is source-note comparison, score inspection and actual Web Audio rendering. Subjective instrument balance is still for listening on target devices.
