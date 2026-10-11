# น้องปลั๊ก companion: DeepSeek lines, Paxa voice, L7 stowaway (Claude)

Date: 2026-10-11. Done; uncommitted.

**Request:** a companion who is always in the bottom right, using the user's generated sprite sheet. She does one job: politely savage, funny Thai comments, or help that turns into a backstab. Each comment is voiced by a TTS API.
- Backend: DeepSeek (`deepseek-flash`) and Paxa Labs TTS (voice บัวลอย). The keys stay on this machine only.
- Look: an XP companion with her own frame.
- Coverage: every page, reacting to most actions.
- L7: she is sucked in with the result UI, shouting for help or blaming the user.
- Follow-ups from the user: use บัวลอย as the voice; call the user เธอ / นาย / แก, never ท่าน.
- Answers to my questions: Paxa Labs is the TTS; she replaces GPT's น้องปลั๊ก helper; the deployed site uses prewritten lines.

**Ownership change:** this replaces GPT's `PlugAssistant.jsx` and `PlugMascot.jsx`, both deleted along with the `.plug-*` CSS. The `ileak:helper-show` and `ileak:helper-prepare` events are gone. The Start menu's helper item and user picture now use her.

**Files**
- `server/companion.js`: the middleware.
  - Routes: `GET /api/companion/health`, `POST /api/companion/say` (DeepSeek chat completions, JSON mode) and `POST /api/companion/tts` (Paxa `POST /v1/tts`, mp3).
  - It holds the persona prompt and the `FACES` list.
  - Each route is rate-limited to 40/min, and voiced lines are cached in memory.
- `vite.config.js`: mounts the middleware on the dev and preview servers via `loadEnv(mode, cwd, '')`.
- `.env.example` is committed. `.env.local` is created empty and gitignored by `*.local`. It takes `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `PAXA_API_KEY`, `PAXA_VOICE=bualoi`, and optional base URLs and model.
- `src/quality/high/companion/brain.js`:
  - `nudge(event, detail, priority)` with throttling and a queue; see the ARCHITECTURE section for the priorities.
  - A health probe for the backend.
  - TTS audio is decoded into the shared WebAudio master, so mute works.
  - It also exports `poke`, `setStowaway` and the `useCompanion` store.
- `companion/lines.js`: the prewritten fallback bank, 171 lines.
  - One bank per event, plus specific banks chosen by `variant()`: tier group (low F–B, rich A–SSSS, absurd kW–Ω), scene and result per level 0–7, iOS vs region block, and hand-crank vs not plugged in.
  - A specific bank is used 70% of the time, and her last 5 lines are avoided.
- `companion/Companion.jsx` and `companion.css`:
  - the XP Messenger-style window, balloon and minimised orb;
  - global click, idle and visibility watchers;
  - `Stowaway` for L7.
- `public/companion/*.webp`: 18 portraits sliced from the sheet. The source sheet moved from `public/` to `art/companion-sheet.jpg`, so it no longer ships.
- Hooks:
  - `high/App.jsx`: hello, gate, agree and blocked; mounts `<Companion covered>`.
  - `pages/MainPage.jsx`: tier stamp, power answer, peripheral tap and hold.
  - `fx/CalcOverlay.jsx`: calc, scene, result, certificate and again; on L7, the stowaway and `l7:pulled` / `l7:released`.
  - `fx/scenes/orbit.js`: fling, swallow and spit.
  - `components/StartMenu.jsx`: help.
- Docs: a new ARCHITECTURE section, and the REVIEW XP checklist items were replaced.

**Follow-up: MSN toast and phrase-by-phrase voice**
- The single-toast clearing behavior below is superseded by [persistent time-grouped bubbles](2026-10-11-msn-persistent-bubbles.md), implemented after the agent reached its limit.
- The user's request:
  - an MSN-style notification for each remark;
  - Paxa reads a whole line with no pacing, so split it, by spaces probably, with a little pause between.
- `brain.js`:
  - `phrases()` splits at spaces and merges fragments under 4 code points, or all-ASCII ones, into a neighbour. Across the 171 prewritten lines this gives 2–4 phrases each.
  - `run()` synthesises every phrase in parallel, then sends them one at a time: the message appears, a chime plays (`beep`; no MSN audio is used), the voice plays, then a 0.3 s pause. The toast lingers 2.2 s after the last message.
  - Store shape is now `{msgs, typing, face, stowaway}`; `dismiss` is replaced by `hush`.
- The server's TTS limiter was raised to 200/min (one call per phrase), and the persona now asks DeepSeek for spaced phrases.
- `Companion.jsx` and `companion.css`: the yellow balloon was replaced by `.cp-toast`. The L7 stowaway shouts the latest message.
- Checked in the browser: a poke sends "หยุดพูดแล้วจ้ะ | ดีใจไหมเธอ | ฉันไม่ดีใจด้วยนะ" one by one with the typing indicator, then clears.

**Follow-up: taskbar overlap and DeepSeek modes**
- On the agreement she had dropped to the screen bottom over the taskbar, because `covered` included the gate.
  - Now only the result overlay, which is opaque and hides the taskbar, lowers her.
  - `.gate` and `.gate-error-layer` now stop at `--taskbar-h`, and the warning dialog's max-height subtracts it (`src/index.css`, GPT's XP block).
  - Verified at 1280×800 and 390×844: the gate ends at 758 and 802, and her window sits above the taskbar.
- DeepSeek gets the filled-in prewritten lines for the moment (`candidates()`), plus a suggested mode picked by the client: `builtin` .25, `extend` .25, `shorten` .2, `own` .3.
  - It returns `{mode, text, face}`, and the server logs the mode.
  - Mock test: the prompt includes the lines and the suggested mode, and the mode is passed back.

**Checks**
- `pnpm -s lint` and `pnpm -s build` pass.
- Middleware tested against mock DeepSeek and Paxa servers: health, say (Bearer auth, model, context), TTS mp3 passthrough, and pass-through for other paths.
- Both dev servers (5199 and the user's 5173) answer `/api/companion/health` with `{llm:false, tts:false}` until keys are added.
- Headless browser on 5199:
  - the hello line and the poke work;
  - L7 cuts her off, she clings to the card's title bar with "ช่วยด้วยแก", and the dock shows static and "สัญญาณหาย · ถูกดูดเข้าหลุมดำ".

**Not verified**
- Real DeepSeek and Paxa calls: no keys on hand yet.
- The model id `deepseek-flash` and the voice id `bualoi` are as the user named them. If either API rejects them, the server logs `[companion] deepseek 4xx` or `paxa 4xx`; fix the values in `.env.local`.
- Phone width (390 px) checked: the window, balloon and taskbar fit, and the poke works.
