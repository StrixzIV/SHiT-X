# XP reference comparison and sequential warning agreement

Completed by GPT, 2026-10-11, including the varied READ FIRST error follow-up below. Verified; uncommitted. No commit, push or deployment.

## User request

Read `/home/wxz/42me/ft_blueprint` for its XP theme references, cross-reference with real XP, then replace the agreement page with a sequence of warning popups. Each plays a sound and has gray OK until its cooldown reaches zero. Clicking OK opens the next warning. After all warnings, show our own popup with checkboxes and a large OK.

## References checked

- Local: `ft_blueprint/src/skins/xp.ts`, `src/styles/xp.css`, generic dialog styles in `src/styles/base.css`, and decisions `029-windows-skins.md` / `030-mac-eras.md`. Its XP entry in `docs/SKINS.md` is marked WIP, so it was not treated as authoritative. No file in that project was changed.
- Microsoft [XP error-dialog screenshot](https://learn.microsoft.com/en-us/windows/win32/uxguide/images/mess-error-image2.png), explicitly identified as XP in [the containing article](https://learn.microsoft.com/en-us/windows/win32/uxguide/mess-error). This supplied the compact caption/frame, square bottom corners, icon/text arrangement and centered OK placement. Its sample's button is unthemed; themed controls were checked separately.
- Microsoft's [XP SP2 developer training PDF](https://download.microsoft.com/download/d/f/8/df8e0222-62d5-470c-8ca5-81662aab1934/SEGURANCA/TreinamentoWindowsXPSP2.pdf), page 7: Luna firewall dialog, beige face and themed controls. Read the original PDF and rendered this page locally.
- Microsoft [MessageBox documentation](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messageboxw) for the warning icon, one-button OK and modal behavior; [Tahoma font documentation](https://learn.microsoft.com/en-us/typography/font-list/tahoma) confirms Thai support and Windows XP availability.
- Rejected as a Luna visual reference: the screenshot in Microsoft's general “Using Dialog Boxes” article uses a later glass-window theme. A page's mention of XP does not establish that every screenshot is XP.

The resulting frame follows the common Luna details from these references. Warning icon, landscape, app logo and fallback sounds are original work; no Microsoft image/audio/font assets were copied into the repository.

## Changes

- `src/quality/high/components/AgreementGate.jsx`: retained the five fact strings and all existing safety/consent text. Replaced the accumulating fact list with keyed `WarningDialog` instances, then `ConsentDialog`.
- Each warning plays `schemeSound('exclamation')` on mount and starts its own `readSeconds(body)` cooldown (2–4 s, currently four seconds for every fact). The button text stays **OK**, and the countdown appears separately. Disabled native buttons and a click guard block early progression; an index guard prevents repeated callbacks from skipping a warning. Only one fact is mounted at a time.
- Each popup focuses its window on entry. When cooldown reaches zero, OK receives focus if focus is still inside that warning; this avoids stealing focus from DEV. Warnings use `role="alertdialog"` with labeled message text. Close/Escape now opens the READ FIRST error popup described in the follow-up below, preserving progress without accepting it.
- Final popup plays `ding`, uses iLeak branding and a completion marker, shows three safety checks plus consent, and has a large OK with the existing acceptance text. All four boxes start unchecked. Acceptance is guarded; unticking any box disables OK again. Title and footer stay visible while the body scrolls on short screens.
- DEV skip remains explicit and DEV-only; header DEV still sits above the gate. Normal reload starts again at warning 1; App/session, region/iOS blocks, probes and result scenes were not edited.
- `src/index.css`: agreement-scoped compact Luna frame, original 32 px SVG warning icon, beige body, gray disabled OK, dotted button focus, square-bottom window, checkbox rendering and responsive final popup. Shared `.xp-titlebar` now uses the closer Luna gradient seen in the local reference and Microsoft screenshots; this also affects the taskbar restart dialog. Quality screen keeps its separate existing layout.
- `ARCHITECTURE.md`, `REVIEW.md`, `public/sounds/README.md`: current agreement flow and sound triggers. Handoff index and prior XP task note link here.

## Checks

- `pnpm lint`: zero warnings. `pnpm build`: passed. `git diff --check`: passed.
- Chromium at **1280×844**, **390×844** and **320×568**: exactly one warning at a time, five distinct facts in order, no checkbox/consent before the last warning, gray disabled OK, zero-only progression and timer reset for every new popup.
- Desktop used actual elapsed cooldowns; phone checks used Playwright's clock to verify OK remained disabled at three seconds and became enabled at four. Native disabled clicks were also attempted before zero.
- Audio: a test WAV override played exactly once for each of the five warnings; missing critical/final sounds used the synthesized fallback. Existing autoplay unlock waits for the first gesture. Sound master/drop-in implementation was not changed.
- Close/Escape cannot bypass the sequence; final close does not accept or clear checked boxes. All four final checks are required; unchecking any one disables OK. Acceptance enters the main page and re-enables the taskbar. Reload returns to warning 1.
- Header DEV and explicit DEV skip remain usable. Existing quality screen still fits on phones. No horizontal overflow; final OK stays within the viewport. Thai text and tone marks inspected in warning and final screenshots.
- **No browser runtime errors.** WebGL was disabled in the functional test; result-scene rendering/performance is outside this change.

## Preview and artifacts

Preview: `http://localhost:5201/?q=high&country=TH` (without `dev=1`, so the warning sequence appears). Server was already running; user port 5173 was not changed.

Temporary files outside the repository:

- `/tmp/ileak-xp-dialog-check.mjs`: current agreement/browser checks, using cached Playwright; no dependency added. The agreement portion of the older `/tmp/ileak-xp-regression.mjs` uses the superseded fact-list selectors.
- `/tmp/xp-warning-{1280,390,320}.png`, `/tmp/xp-consent-{1280,390,320}.png`, `/tmp/xp-consent-ready-{1280,390,320}.png`, `/tmp/xp-quality-after-dialog.png`.
- Original reference downloads/renders: `/tmp/xp-microsoft-error.png`, `/tmp/xp-microsoft-messagebox.png` (later theme, rejected), `/tmp/xp-training.pdf`, `/tmp/xp-training.txt`, `/tmp/xp-training-page7.png`.

## Follow-up: varied Thai READ FIRST errors

User request: clicking Close should pop another XP error and savagely say “READ FIRST” in Thai, with a pool of varied messages.

Implemented on 2026-10-11:

- New `src/quality/high/components/agreementMessages.js`: 12 Thai messages, easy to edit without changing dialog logic. Examples: “อ่านก่อนสิวะ! นี่ข้อตกลง ไม่ใช่โฆษณาที่กดข้ามได้” and “กากบาทไม่ใช่คำว่า ‘อ่านแล้ว’ เลิกเนียนแล้วกลับไปอ่าน”. The shuffled pool is owned by AgreementGate and shared across all five warnings and final consent. Each message is used once before reshuffling; the first message of a new cycle cannot equal the previous cycle's last message.
- `AgreementGate.jsx`: warning/final Close or Escape opens a separate `ReadFirstError` dialog titled **iLeak.exe — READ FIRST**, with an original red X icon, the chosen message and `critical` sound. This replaces the previous inline reminder. The underlying dialog becomes inert and aria-hidden; the error's enabled OK receives focus. Header DEV stays above both.
- Error OK, error Close or Escape dismisses only the error and restores focus. It returns to the same warning/final consent without progressing, resetting the reading timer, accepting, or clearing checked boxes. The original cooldown continues while the error is visible. Closing the error does not recursively open more errors; a new dismissal attempt on the original dialog picks another message.
- `src/index.css`: error backdrop/frame, red icon, and inactive Luna caption for the covered dialog. Removed unused inline-reminder styling. Architecture and review checklist updated.
- `pnpm lint`: zero warnings; `pnpm build` and `git diff --check`: passed.
- Current browser checks: `/tmp/ileak-xp-read-first-check.mjs`. At 1280×844, 390×844 and 320×568, verified random message changes, all 12 unique messages in the first cycle, no immediate repeats, critical sound, error focus, disabled underlying controls, all three dismissal methods, five-warning progression and preserved consent checkboxes. Final acceptance still works. No overflow or browser runtime errors. Screenshots: `/tmp/xp-read-first-{1280,390,320}.png`.
- The older `/tmp/ileak-xp-dialog-check.mjs` close-button assertions predate this error popup; use the newer follow-up script for dismissal behavior.

No remaining implementation work for this request. The shared tree still includes another agent's retro-scene changes; do not claim or overwrite them when reviewing this task.
