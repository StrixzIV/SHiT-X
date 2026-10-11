# XP UI, sound scheme and gags (task brief for GPT 6.1)

Date: 2026-10-10. Written by Claude (Opus 5.5) for GPT 6.1. You work on this **at the same time** as Claude, in the same working tree; read "Who owns what" before editing anything. See [the handoff index](README.md) for earlier work.

## The direction (decided by the user, final)

- The app is called **iLeak: HydroCharging** (header, agreement title and tab title are already renamed).
- The pages become a glossy **Windows XP (Luna, blue)** style app. Keep today's layout and restyle it. Mood: **cheerful, striking, vibrant**.
- The result scenes play like retro games (PS2, prerendered CG, Famicom). Claude is building those.
- A **PS1 | PS2** switch sits at the top right of the header. Claude already added it (`components/RetroSwitch.jsx`, state in `retro.js`); every load starts on PS2.
- Everything else in the header moves into an **XP taskbar with a Start menu**. The header's top right keeps only the PS1/PS2 switch and the DEV controls.
- The agreement becomes an **XP warning message box**.
- All the XP gags: a Found New Hardware balloon, a Certificate of Authenticity sticker, an hourglass cursor, an Office-assistant-style helper, and an **XP sound scheme the user can swap for their own files later**.

## Tasks

### 1. XP restyle of today's layout

- **Scope:** restyle with CSS; small markup changes are fine where needed, but keep the layout, flows and wording. Covers:
  - the header bar and the main page (spec table, meter, tier card, device cards, hold-to-proceed button, manual charge);
  - the quality screen (`src/quality/components/QualitySelectGate.jsx` is a teammate's file, so restyle it from CSS);
  - the iOS block and region block;
  - the DEV panel (CSS only);
  - the result sheet (`.result`, `.responder`) and the buttons (`.btn-gold`, `.btn-line`);
  - selects, inputs, checkboxes and progress bars.
- **Look:**
  - Luna blue title-bar gradients, white panels with thin blue borders, rounded XP buttons with the orange hover glow, a green accent like the Start button.
  - A bright sky and green hills background drawn in CSS or SVG.
  - Replace the old gold and Cinzel "elite" theme (the `:root` variables in `src/index.css`) as you go.
- **Fonts:** Tahoma for UI text (XP's UI font, also its Thai UI font) and Trebuchet MS bold for titles, when installed. Fall back to fonts that render Thai tone marks properly (`'Noto Sans Thai'`, `'Sarabun'`, `'Leelawadee UI'`). Check that ่ ้ ๊ ๋ display correctly; this broke once before.
- **Optional reference:** [XP.css](https://botoxparty.github.io/XP.css/) is MIT-licensed. You may borrow from it, but scope it to our classes so it doesn't restyle every button globally.
- **Must keep working:**
  - the `.result.orbit[data-orbit]`, `[data-held]` and `[data-gone]` rules (the L7 card's orbit positioning);
  - the `@media print` rules (printing shows only the certificate);
  - `--header-h`;
  - the `.calc` overlay layout;
  - the reduced-motion rules.

### 2. Taskbar and Start menu

- **New components:** e.g. `components/Taskbar.jsx` and `components/StartMenu.jsx`, mounted in `src/quality/high/App.jsx`.
- **Taskbar:** fixed at the bottom, XP blue. It has a green Start button (our own drawing, not Microsoft's logo) and a tray on the right with:
  - the sound on/off button (moved from the header);
  - a clock;
  - the spot balloons pop out of.
- **Start menu:** gets the items moved out of the header:
  - the graphic quality choice (HIGH / MEDIUM / LOW, same `onQualityChange`);
  - "open the quality screen" (same `onOpenQualityGate`, replaces the ✦ button);
  - เข้าสู่ระบบ (login).
  - Cheap extras are welcome, e.g. a "Turn Off Computer" parody that reloads the page.
- **Header:** brand on the left. The top right keeps `<RetroSwitch />`, the DEV tickbox and the ▾ DEV menu button. Keep `PortalHeader`'s ResizeObserver that sets `--header-h`.
- **Layering:**
  - The header stays on top (z-index 96).
  - The calculation overlay (`.calc`, z 60) and the agreement (`.gate`, z 50) cover the taskbar, so results feel like a fullscreen game; put the taskbar around z 45.
  - Page content must not hide behind the taskbar (add bottom padding).
- **Phones (390 px):** the taskbar and Start menu must fit, and the header should drop to one row if possible.

### 3. Agreement as an XP warning message box

- **File:** `components/AgreementGate.jsx`.
- **Window:** an XP dialog with a title bar (iLeak: HydroCharging and a close ✕), a big warning icon (our own SVG) and XP buttons.
- **Keep the logic:** the facts and the "read every fact" flow stay unchanged.
- **Sound:** play the `exclamation` sound when it opens.
- **Still required:** it shows on every load, the DEV skip still works, and the header stays above it.

### 4. Gags

- **Found New Hardware balloon:**
  - When a device card becomes connected, show "พบฮาร์ดแวร์ใหม่ · Found New Hardware" with the device name and play `deviceConnect`. See `src/probes/useProbes.js` and how `pages/MainPage.jsx` receives `cards`.
  - Play `deviceDisconnect` when it goes away.
  - The balloon hides after about 5 s, or on click.
- **Certificate of Authenticity:** `src/quality/high/fx/Certificate.jsx` is yours; Claude moved it out of `CalcOverlay`. Props: `cert`, `tier`, `volts`, `verdict`.
  - Make it an XP-style COA sticker: a guilloche pattern in CSS, a hologram strip, the tier as the "edition", and a fake product key in `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` format derived from `cert.id`.
  - Keep `.cert` as the root class so printing still shows only the certificate.
- **Hourglass cursor:** our own SVG cursor while the overlay calculates: `.calc.phase-loading` (fallback `wait`). Claude keeps the `calc phase-loading` / `phase-scene` / `phase-result` class names.
- **Helper character:** an Office-assistant-style helper, but our own character, not Clippy. Suggestion: a little electric plug with eyes called "น้องปลั๊ก".
  - It sits bottom right above the taskbar with a speech balloon at a few key moments: first view of the main page ("ดูเหมือนท่านกำลังยืนอยู่ในน้ำท่วม ต้องการความช่วยเหลือไหม?"), after the appraisal, when nothing is plugged in, and before proceeding.
  - Buttons: ใช่ / ไม่ต้อง / ไม่ต้องแสดงอีก (for this session).
  - Overlays cover it.
- **XP sound scheme the user can replace:**
  - **Module:** a new one, e.g. `src/quality/high/sound/scheme.js`.
  - **Events:** each named event first tries drop-in files in `public/sounds/` (for example `xp-startup.mp3`, then `.wav`, then `.ogg`), and falls back to an original synthesized sound.
  - **Event names, at least:**
    - `startup`: the app is ready after the agreement;
    - `exclamation`: the agreement box opens;
    - `critical`: error screens, e.g. the iOS block and region block;
    - `ding`: generic info;
    - `notify`: balloons and the helper;
    - `deviceConnect` and `deviceDisconnect`;
    - `start`: the Start menu opens;
    - `shutdown`: "Turn Off Computer".
  - **Mute:** route everything through the master gain in `fx/sfx.js` so the mute button silences it.
  - **Docs:** document the event → when it plays → file names table in `ARCHITECTURE.md` so the user knows which files to drop in.
  - **Files:** `fx/audio.js` belongs to Claude. You may import `playFile` / `asset` from it, but put any new helpers in your own module.

### 5. Docs

- **`ARCHITECTURE.md`:** add new sections for the XP shell, the taskbar and Start menu, the sound scheme table and the gags.
- **`REVIEW.md`:** add checklist items for the same.
- **Shared files:** add your own sections only; Claude edits the "Result scenes" parts of both files.
- **Handoff:** update this note's status, and its row in `handoff/README.md`, when you finish.

## Who owns what

We edit the same working tree at the same time. Re-read a file right before you edit it, keep edits small, and never rewrite or reformat a whole file you don't own.

**Claude only (please don't edit):**
- `src/quality/high/fx/scenes/**`
- `src/quality/high/fx/CalcOverlay.jsx` (the loading screen and its transition are changing)
- `src/quality/high/fx/Particles.jsx`
- `src/quality/high/fx/audio.js`
- `src/quality/high/retro.js`
- the logic of `src/quality/high/components/RetroSwitch.jsx` (restyle it from CSS freely)
- any new files under `src/quality/high/fx/gl/`
- Claude's scene styles go in a separate CSS file, not `index.css`.

**GPT 6.1:**
- `src/index.css`
- `src/quality/high/App.jsx`
- `src/quality/high/pages/**`
- `src/quality/high/components/**` (except RetroSwitch's logic)
- `src/quality/high/fx/Certificate.jsx`
- `src/quality/high/fx/sfx.js`: keep its existing exports (`chipSound`, `multSound`, `xmultSound`, `zeroSound`, `tick`, `getAudio`, `setSound`, `soundOn`, `beep`, `shock`) working, because the calculation overlay and the scenes use them.
- new files for the taskbar, Start menu, balloons, helper and sound scheme
- `public/sounds/**`

**Nobody without asking the user:** `src/App.jsx` and `src/quality/components/**` (a teammate's quality router), `src/probes/**`, `src/appraisal/**`, `src/game/**`, `functions/**`.

## Ground rules

- **Commits:** don't commit or push unless the user asks; they ask explicitly when they want it.
- **DEV tickbox:** the TEMP DEV tickbox stays visible everywhere until the user says to remove it.
- **Blocks and agreement:** iOS stays hard-blocked (no escape button), the agreement shows on every load, and the region block stays.
- **Assets:** original work only. Don't copy Windows XP's Bliss photo, logos, sound files, cursors or font files, and don't recreate Clippy. "In the style of" is fine.
- **Code style:** no semicolons, single quotes, 2-space indent, few comments (say why, not what), Thai UI text.
- **Checks:**
  - `pnpm lint` (oxlint, 0 warnings) and `pnpm build`;
  - a desktop width and a 390 px phone width;
  - Thai tone marks render correctly.

## How to run and test

- `pnpm install`, then `pnpm dev`. The user's own server usually runs on port 5173, so start yours on another port, e.g. `pnpm dev --port 5201 --strictPort`.
- `?q=high&dev=1` skips the quality screen and turns DEV on; `&country=TH` skips the geolocation lookup.
- DEV panel (▾ next to the DEV tickbox):
  - skip toggles for the agreement and appraisal;
  - "ข้ามการคำนวณ" for jumping straight to results;
  - L0–L7 buttons to fire each result scene.

## Status

**Completed by GPT on 2026-10-11; verified, uncommitted.** No commit, push or deployment was performed. Claude's retro-scene work is present in the same working tree; check its separate handoff before changing scene files.

**Later user-directed change:** the agreement now uses five separate timed warning popups followed by an iLeak consent popup, replacing the accumulated fact list described below. See [the XP warning sequence handoff](2026-10-11-xp-warning-sequence.md) for current behavior, references and checks.

## Implementation notes for the next agent

- `src/index.css`: Luna palette and font stacks, XP window/button/field/progress styles for the existing screens, responsive header/taskbar/menu, helper, COA sticker, original hourglass cursor, print and reduced-motion rules. `public/ui/desktop.svg` supplies an original bright sky/hills background. Quality/router and block logic were left intact; their appearance changes through CSS.
- `components/PortalHeader.jsx`: brand, existing PS1/PS2 switch, DEV checkbox/menu only. The ResizeObserver still updates `--header-h`. At the tested widths the header is about 61 px tall on desktop and 48 px on a 390 px phone.
- `components/Taskbar.jsx` and `StartMenu.jsx`: Start, app button, shared mute and local clock; quality selector, quality-screen opener, login information, helper restoration and a restart parody. Escape/outside click closes Start. Restart requires its explicit button; cancel/Escape does not reload. `high/App.jsx` mounts the taskbar at z 45 and keys it by covered/uncovered state to reset menus when agreement/game overlays change. Covered taskbar controls are inert and disabled; the helper is hidden while the calculation runs.
- `components/AgreementGate.jsx`: blue title bar, original warning SVG and exclamation cue. The close button plays a critical cue and explains the required agreement. Timed facts, safety checks and consent keep their original behavior and remain mandatory on every normal load.
- `components/HardwareBalloon.jsx`: observes existing cards' `live` transitions without changing probes. Named connect/disconnect balloons and cues, close button, five-second timeout; hides while Start or restart is open.
- `components/PlugMascot.jsx` and `PlugAssistant.jsx`: original plug character, entry/appraisal/no-peripheral/before-proceed tips, help scrolling, collapse and session-wide dismissal. Start restores it. Custom events are `ileak:helper-show` and `ileak:helper-prepare`; the session key is `ileak:hide-plug-helper`. `pages/MainPage.jsx` mounts the helper and reports overlay state; `HoldButton.jsx` has an optional `onPrepare` callback.
- `fx/Certificate.jsx`: COA sticker with CSS guilloche and hologram, tier edition, deterministic fake 5×5 product key derived from `cert.id`, existing certificate data and print action. `.cert` remains the root. The L7 orbit/drag logic is still Claude's code.
- `sound/scheme.js`: all nine requested named events, drop-in MP3 → WAV → OGG lookup and original synthesized fallback. Sources use `fx/audio.js` sessions and the existing master gain. Suspended audio waits for a user gesture; effect cleanup cancels queued/playing cues. Each file attempt times out after 700 ms, and decoded/missing files are cached until reload. `public/sounds/README.md` documents replacement stems and triggers. `fx/sfx.js` only gained a caught `AudioContext.resume()` promise; existing exports remain available.
- `ARCHITECTURE.md` and `REVIEW.md`: appended XP shell, sound map and gag documentation/checklist. Claude's result-scene sections were preserved. No runtime dependencies were added.

### Integration fixes to retain

- Do not change the print-hidden scene back to `display: none`: L7 measures its scene to compute the orbit. Zero dimensions produced `NaN` transforms and a `DOMMatrix` exception during printing. The final print rules retain the scene's viewport dimensions with `visibility: hidden`, then print only the static certificate with result transforms, masks and clipping removed.
- The old retro-scene handoff mentions a Taskbar lint warning. It is resolved: the synchronous effect state reset was removed and App remounts the taskbar when coverage changes. Final lint has zero warnings.
- Hardware balloons hide behind the open Start menu so they cannot obscure its phone-sized controls.

## Verification completed 2026-10-11

- `pnpm lint`: passed, zero warnings.
- `pnpm build`: passed.
- `git diff --check`: passed.
- Chromium visual checks at 1280 px desktop and 390 px phone: XP desktop, Start menu, agreement and quality screen; no horizontal overflow. Thai tone marks ่ ้ ๊ ๋ were inspected with the configured Thai-capable font stack. Tahoma, Noto Sans Thai and Sarabun are installed on this host.
- Browser functional checks: PS2 default, header controls, Start Escape/outside close, both quality actions, login dialog, restart cancel/confirm, helper help/dismiss/reload/restore, named hardware connect/disconnect and manual/timed balloon dismissal.
- Sound checks: a valid WAV override was decoded/played after missing MP3; missing events synthesized tones; the shared master mute silenced the scheme.
- Normal agreement checks: sequential timed facts, every safety checkbox and final consent, close reminder, and agreement on reload. iOS hard block and region block remain working.
- L7 integration at 390 px: result certificate/key, covered taskbar/helper, certificate-only printing, restoration after reset, reduced-motion styles. **No browser runtime errors**, including printing.

The functional browser suite disabled WebGL for speed and focused on the shell/overlay/printing integration. It does not replace Claude's shader or real-phone performance checks; see the retro-scene handoff for those.

### Local preview and temporary artifacts

- Preview server started with `pnpm dev --host 127.0.0.1 --port 5201 --strictPort`; URL: `http://localhost:5201/?q=high&dev=1&country=TH`. The user's port 5173 was not changed. This process may not survive a later session.
- Browser scripts outside the repository: `/tmp/ileak-xp-check.mjs` and `/tmp/ileak-xp-regression.mjs`. They use the existing cached Playwright/Chromium install; no package was added.
- Screenshots outside the repository: `/tmp/xp-desktop.png`, `/tmp/xp-phone.png`, `/tmp/xp-start-desktop.png`, `/tmp/xp-start-phone.png`, `/tmp/xp-agreement-desktop.png`, `/tmp/xp-agreement-phone.png`, `/tmp/xp-quality-desktop.png`, `/tmp/xp-l7-certificate-phone.png`, `/tmp/xp-certificate-print.png` and `/tmp/xp-region.png`.
- There is no remaining implementation task from this brief. Review the uncommitted shared tree and both handoffs before a requested commit or deployment.
