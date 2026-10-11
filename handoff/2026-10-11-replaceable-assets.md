# Replaceable FX asset inventory

Date: 2026-10-11. Documentation completed; uncommitted. No runtime code changed, no commit/push/deployment requested.

The user asked for the filenames they can replace for music and graphics. Audited all scene `playFile`/`loadImage` calls, XP `SOUND_FILES`, and the CSS wallpaper URL. Saved the complete current interface in **`public/fx/README.md`**: six scene audio slots (including L4's three aliases), three scene graphic slots, wallpaper and nine XP sound stems.

Important details for the next agent:

- Scene audio names are `.mp3` only; XP supports `.mp3`, `.wav`, `.ogg` in that order.
- Image format priority differs: Heaven JPG → PNG → WebP; Thunder and Battle PNG → JPG → WebP. Existing higher-priority files win, so a new lower-priority variant may not be seen.
- L6's `l6-radio.mp3` replaces the radio bed only. Ring/connect/text/squelch and native Thai speech still run.
- L5's supplied track includes/replaces the entire music opening and stops at fainting. Other battle effects remain.
- L2's music plays once; L0/L5/L6/L7 music loops. L4's FAHHH clip plays twice.
- `heaven.jpg` and `skeleton.png` exist in `public/fx/` but are unused by current scenes.
- L0/L1/L4/L6/L7 and loading graphics have no image-file override; their visuals are generated in code. L1/L3 have no audio-file override.
- The CSS wallpaper URL is `public/ui/desktop.svg`; it is not a scene texture hook.

No runtime tests were needed for this documentation-only inventory. Filename completeness was checked against the source, and `git diff --check` passed. Earlier theme-correction handoff remains current for L0/L5.
