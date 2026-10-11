# iLeak — Hand Review Checklist

Every state can be reached by ticking **DEV** (top right, always visible; `?dev` works too). Section 7 lists everything the dev panel can do.

Values below are taken from the code after the fact-check round (October 2026).

---

## 1. Tier list (`src/appraisal/specs.js`)

Tier comes from the charger wattage; mult₁ is its multiplier.

| ✓ | Tier | From | mult₁ | Title | Remark |
|---|---|---|---|---|---|
| [ ] | Ω | 1e40 W | 9999 | ผู้สร้างจักรวาล | ท่านไม่ได้ใช้ไฟฟ้า ไฟฟ้าใช้ท่าน |
| [ ] | K-II | 3.8e26 W | 987 | อารยธรรมกินดวงอาทิตย์ (Kardashev II) | หัวชาร์จของท่านคือทรงกลมไดสันรอบดวงอาทิตย์ |
| [ ] | K-I | 1e16 W | 610 | เจ้าของดาวเคราะห์ (Kardashev I) | พลังงานทั้งโลกถูกใช้ชาร์จมือถือของท่านเครื่องเดียว |
| [ ] | TW | 1 TW | 377 | ดวงอาทิตย์พกพา | การไฟฟ้าทั้งประเทศขอสมัครเป็นลูกน้องท่าน |
| [ ] | GW | 1 GW | 233 | 1.21 จิกะวัตต์! | Great Scott! ท่านย้อนเวลากลับไปก่อนน้ำท่วมได้แล้ว |
| [ ] | MW | 1 MW | 144 | เจ้าของเขื่อนส่วนตัว | เขื่อนภูมิพลส่งการ์ดวันเกิดให้ท่านทุกปี |
| [ ] | kW | 10 kW | 89 | เครื่องปั่นไฟงานวัด | ท่านเปิดลำโพงหมอลำได้ทั้งตำบลจากรูชาร์จ |
| [ ] | SSSS | 2 kW | 55 | หม้อหุงข้าว 10 ใบพร้อมกัน | ปลั๊กพ่วงในบ้านท่านละลายไปแล้ว 3 อัน |
| [ ] | SSS | 600 W | 21 | โรงไฟฟ้าส่วนบุคคล | ท่านไม่ได้มาตรวจไฟรั่ว ท่านคือต้นเหตุของไฟรั่ว |
| [ ] | SS | 330 W | 13 | มหาเศรษฐีพลังงาน | การไฟฟ้าส่งกระเช้าปีใหม่ให้ท่านทุกปี |
| [ ] | S | 200 W | 8 | ชนชั้นปกครองแห่งปลั๊กพ่วง | หัวชาร์จของท่านหนักกว่าแมวของคนทั่วไป |
| [ ] | A | 100 W | 5 | ผู้ดีมีวัตต์ | น่านับถือ แต่ยังไม่ได้นั่งโต๊ะเดียวกับระดับ S |
| [ ] | B | 61 W | 3 | ชนชั้นกลางสาย USB-C | 65W คือค่าเฉลี่ยของคนธรรมดา ซึ่งก็คือท่าน |
| [ ] | C | 30 W | 2 | ผู้ใช้ทั่วไป | ระบบยินดีให้บริการ ด้วยความอดทน |
| [ ] | D | 10 W | 1.5 | ผู้ชาร์จช้า | กรุณาใช้ทางเข้าด้านหลัง |
| [ ] | F | 0 W | 1 | สามัญชน 5 วัตต์ | อุปกรณ์ของท่านไม่ผ่านเกณฑ์ความหรูหรา แต่เราจะตรวจให้เพราะสงสาร |

- [ ] **Fanfare:** S and above (mult₁ ≥ 8) play a 4-note fanfare when the stamp lands
- [ ] **Letter styles:**
  - F: rotated red
  - B: bronze
  - A: silver
  - S: gold shine
  - SS / SSS: rainbow
  - SSSS: rainbow with jitter
  - kW: fire
  - MW: blue pulse
  - GW: lightning flicker
  - TW: sun glow
  - K-I: Earth
  - K-II: spinning sun
  - Ω: black glowing letter that spins
- [ ] **Card shake:** SSSS and above also make the whole tier card quake

**Wattage dropdown:** 5, 10, 20, 45, 65, 100, 140, 240, 280, 330, 500 W, 1 kW, 3 kW, 25 kW, 5 MW, 1.21 GW, 1 TW, 1e17, 3.8e26, 1e42 W

---

## 2. Meter (`src/appraisal/meters.js`)

The meter changes with wattage, so the needle always stays on the scale.

| ✓ | Range | Instrument | Note |
|---|---|---|---|
| [ ] | 5 W – 1 kW | มัลติมิเตอร์ตลาดนัด | ราคา 99 บาท |
| [ ] | ≤ 1 MW | มิเตอร์หน้าบ้านการไฟฟ้า | ยืมมาจากเสาไฟ |
| [ ] | ≤ 1 GW | แผงควบคุมโรงไฟฟ้า | ยกมาทั้งห้องควบคุม |
| [ ] | ≤ 1 TW | ฟลักซ์คาพาซิเตอร์ | ถอดจาก DeLorean |
| [ ] | ≤ 1e17 W | หอดูดาวสุริยะ | วัดแสงอาทิตย์ทั้งดวง |
| [ ] | ≤ 1e27 W | มาตรวัดคาร์ดาเชฟ | ระดับอารยธรรม 0 → II |
| [ ] | above | มาตรวัดพลังพระเจ้า | ไม่มีหน่วย มีแต่ศรัทธา |

---

## 3. Scoring (`src/game/score.js`)

- **Chips** = watts + spec bonus (threads × 10 + RAM GB × 8 + screen megapixels × 10 + Hz / 2)
- **mult₂** = 1 + one step per live peripheral: USB-C +2, other ports +1, ปุ่มจำลอง +0.5
- **Total** = chips × mult₂ × mult₁. If nothing is powered, the last card is **×0**, so the total is 0.

Order of the cards in the calculation:

- [ ] หัวชาร์จ (+chips)
- [ ] สเปกเครื่อง (+chips)
- [ ] each live peripheral (+Mult)
- [ ] ระดับ X (×Mult)
- [ ] ไม่มีไฟเข้า (X0, only when unpowered)
- [ ] the total counts up with ticking sounds

---

## 4. Result scenes, verdicts and responders (`src/quality/high/fx/CalcOverlay.jsx`, `src/quality/high/fx/scenes/`, `src/game/responders.js`)

- [ ] Loading: the PS2 boot screen from ft_blueprint's PS2 skin (blue fog drifting, six clear glass cubes tumbling that bend the fog and light trails behind them, red/green/violet/blue lights with hairline trails; low hum, glassy chimes; without WebGL2 the cubes are drawn dark glass with a sliding reflection), with the Balatro tally on top (cards + chips × mult + sounds), then the total ticks up; the tally stays readable
- [ ] When the count finishes, it dives in faster and faster while rolling anticlockwise: cubes glint and rush past, the lights streak, and everything that moves leaves fading copies of itself (old-game frame stacking), a short flare. Then about a second in the void with only the smoke left, drifting closer and fading out (hum gone, a swell building) before the cut; the tally spins off anticlockwise with a blur; then the level's scene (L7 fades up slowly from black); the result sheet slides up over it later, with "<total> V" and the verdict at the top
- [ ] PS1 / PS2 switch (top right): every load starts on PS2. PS2 = sharp-edged 448-line pixels with glow and faint interlace lines; PS1 = chunkier 240-line pixels with dithering and wobbly 3D. Flip it mid-scene: the look changes, the scene doesn't restart. L0, L1 and L5 look the same in both
- [ ] Closing the sheet ("ประเมินใหม่") stops the scene's sound
- [ ] Choosing mute with the taskbar speaker before opening a scene keeps its synth/file audio silent; covered taskbar controls remain disabled

| ✓ | Lvl | Total ≥ | Verdict | Scene | Sound | Who responds |
|---|---|---|---|---|---|---|
| [ ] | 0 | 0 | ปลอดภัย | Black lives screen first (HUD, WORLD 0-0, Claude × 3, silent, ~2.4 s), then a Famicom-style underwater stage that fills any screen (wide, ultrawide, portrait). Claude in a hard hat is the hero, swimming with its USB-C cable trailing; a "BUILDING iLEAK..." bubble a second in and every 6 s; fish, coral, HUD with the score; no jellyfish | Reference-checked short opening of the original NES Mario Underwater theme: ascending intro once, held melody phrase repeats, two pulse voices and triangle bass + bubbles + bloop | แม่ |
| [ ] | 1 | 1 | ไฟรั่วเล็กน้อย | XP-style blue screen + sparks + a little smoke, memory dump % counts up; a big spark burst every ~1.8 s, small fizzes between | only the 8-bit spark crackle on each big burst (no hum) | ช่างไฟปากซอย (→ ฿15 tape) |
| [ ] | 2 | 2,000 | ไฟรั่วระดับหรู | Cut to white on the steps, then the camera tilts up a janky low-poly stairway through realistic-ish billboard clouds under low-poly god rays, to the meme crowd at the top (front row fully visible); they stay in view when the result slides up | angel choir + harp | การไฟฟ้า (กฟน. / กฟภ.) |
| [ ] | 3 | 8,000 | ไฟรั่วระดับพรีเมียม | Low-poly flooded soi at night: shophouses, lit windows, power lines, rain; lightning lights it up and the giant figure at the end of the street only shows in the flashes | crack + rumble per strike | ปภ. |
| [ ] | 4 | 30,000 | น้ำท่วมทั้งซอยมีไฟ | Low-poly person knee-deep in the flood, phone up, cable in the water, shaking: body → X-ray skeleton → white-out, purple arcs, jaw drops on each FAHHH | buzz + "FAHHH" ×2 (not louder than the rest; volume `FAHH_GAIN` in `L4Skeleton.jsx`) | กรมทหารช่าง |
| [ ] | 5 | 100,000 | หายนะระดับชาติ | GBA flash + stripe wipe → battle vs PLUGCHU: your THUNDER → "ได้ผลไม่ค่อยดี..." → absorbs 220V → its THUNDER → 0/20 → หมดสภาพ | Reference-checked short opening of RSE's wild-battle theme at 196 BPM: chromatic intro once, horn phrase repeats, source bass/harmony/snare/timpani rhythm with synth voices; music fades at fainting, attack / drain / faint effects continue | UN |
| [ ] | 6 | 1e8 | ภัยพิบัติระดับหมอลำ | Codec call (4:3, pillarboxed): "CALL" blinks, portraits open with static, 220.50 readout, typed Thai conversation (you ↔ ผู้การ) with the live voltage; mouths move with the speaker | Metal Gear-style trilling ring, connect chirp/static, quiet hiss after connection, soft text clicks, short squelch (+ Thai voice if available) | NASA + IAEA |
| [ ] | 7 | 1e15 | จักรวาลถูกรีสตาร์ท | Slow fade from black to Gargantua's top-right, camera rolled a little: lensed disk arc, bright disk running off to the right, stars (streaked near the hole) | distorted space drone, slow pitch bend | เบื้องบน (→ funeral chant) |

**L0 / L5 / L6 audio pass (2026-10-11):**

- [x] L0/L5 opening excerpts now match independently decoded source pitches, onsets, durations and MIDI velocities (48 NES note events, 171 Hoenn events); source tempo and opening/loop boundaries are checked
- [x] Scores/cues render through Chromium Web Audio with finite samples, headroom and silent tails; track grids line up, the opening runs once before the phrase loop, finite render scheduling cancels, and ended note nodes are released
- [x] Updated browser pass: L0 stage music begins after the 2.4 s lives screen; L5's original chromatic opening continues into its horn phrase, the music bus fades at fainting, and a supplied track also stops at fainting; L6's cues remain
- [x] Browser: DEV 1× / 3× / 10× works for these scenes, and closing stops all their audio sources and future note scheduling
- [x] Updated browser pass: missing files fall back to synth; valid optional files play without duplicate synth music, replace L5's entire score including its intro, retain Codec cues and L5 attack effects, and pause on closing
- [x] Shared master mute/resume silences and restores the playing synth
- [ ] Listen on the target phone/desktop to judge musical resemblance and balance; check native Thai speech on a device with a Thai voice

**Drop-in files (`public/fx/`, all optional; a missing file falls back to the built-in version):**

- [ ] `l0-underwater.mp3`
- [ ] `l2-heaven.mp3`
- [ ] `lowtiergod.png` / `.jpg` / `.webp` (a cut-out stands full-height, lit only by lightning)
- [ ] `l4-fahh.mp3`, `fahh.mp3` or `fahhhhhhhhhhhhhh.mp3` (plays at the cut and ~2.6 s later)
- [ ] `l5-battle.mp3`
- [ ] `l5-opponent.png` / `.jpg` / `.webp` (plus the `OPPONENT` name in `L5Battle.jsx`)
- [ ] `l6-radio.mp3`
- [ ] `l7-space.mp3`

**L7 result card in orbit** (DEV → L7 with "ข้ามการคำนวณ" for a fast preview):

- [ ] The sheet slides up, shivers, then gets pulled down past the hole, swings round it (briefly off-screen) and comes back over the top, behind the shadow. Then it settles into a long lap: slow through the open sky at top right (top centre on a phone), a quick whip round the hole.
- [x] The base orbital card is 30% smaller. Mouse hover keeps it moving at normal orbit speed and never triggers reading enlargement or the time-dilation subtitle.
- [x] The live card's text and edges bend near the hole, with a stronger swirl during swallowing. Its shader field follows the same hole framing; dragging tracks the painted grab point and clicking the bent certificate button works. The certificate prints without displacement.
- [x] The black-hole shader itself lenses the result UI into curved rim images of its title bar, text and controls. These follow dragging, update for certificates/scrolling, disappear during the hidden wait and return when the card is spat out. Desktop/phone framebuffer comparisons show UI light outside the dark center; PS1/PS2 and reduced motion work.
- [x] After 20 seconds without interaction, the hole swallows the card, keeps it invisible/inert for three seconds, then spits it back into orbit. The cycle repeats; interaction resets the deadline, and hover alone does not.
- [x] Drag and release still tracks the grabbed point accurately, with no stuck held state or hover catch.
- [ ] Drop it on the shadow (by its centre or by the point you're holding): it spirals in, stretches, vanishes, then comes back out with the Hawking-radiation subtitle
- [x] Clicking, phone taps and keyboard focus keep the card small and moving; none enable a sticky reading mode. Touch heading drag and release still work at 390 px. Body scrolling remains available.
- [ ] The buttons and the "ติดต่อเบื้องบน" link still work while it moves; the certificate prints flat
- [x] With reduced motion on, the sheet docks at the bottom without orbit or idle consumption.

- [ ] On the result sheet, every responder below the current level is crossed out with "เกินอำนาจ ส่งเรื่องต่อ" (beyond their authority, passed on)
- [ ] The certificate button and "ประเมินใหม่" (re-assess) both work
- [ ] Every result link opens a website, never a phone number

---

## 5. Screens and states

### Entry

- [ ] **Graphic quality screen** (first load without `?q`): Low / Medium / High tiles; "เข้าสู่ระบบ (HIGH)" sets `?q=high`. Low and Medium are blank placeholders. The DEV tickbox is in its top-right corner.
- [ ] Header shows the quality dropdown + ✦ (reopens the quality screen)
- [ ] **Region block:** `?q=high&country=NG` shows "Your region doesn't have floods", with the header and DEV still usable; DEV's "ข้ามหน้าบล็อกภูมิภาค" skip lets you through
- [ ] **iOS (iPhone / iPad, any browser):** joke screen showing
  - the swaying apple
  - a random excuse
  - "ยื่นอุทธรณ์" (cycles 5 rejection lines)
  - a share button
  - no way through (only the DEV skip "ข้ามหน้าบล็อก iOS" gets past it)
- [ ] **In-app browser** (LINE / FB / Messenger / IG / TikTok / WeChat / X): bottom banner with an escape link
  - Android text: "อ่านแบตได้ แต่ USB / Serial ใช้ไม่ได้ และแอปอาจไม่ให้ใช้ไมค์และกล้อง"
  - LINE: `?openExternalBrowser=1` link
  - Android: Chrome `intent://` link
  - iOS: instructions only
  - On Android in-app browsers, the อุปกรณ์ USB / โพรบ iLeak / คีย์บอร์ด tiles are crossed out with "เบราว์เซอร์ในแอป…"
  - The appraisal still loads in Android in-app browsers (they lack `getHighEntropyValues`)
- [ ] **Plain `http://`:** bottom banner listing what is disabled (battery, USB, Serial, MIDI, mic, camera, gamepads)

### Agreement gate

- [x] Facts 1–5 appear as separate XP warning dialogs, one at a time. Each opens with `exclamation` and a fresh 2–4 s cooldown; OK stays gray/disabled until zero, and only clicking it advances.
- [x] Close/Escape opens a separate XP “READ FIRST” error popup with `critical` sound and one of 12 varied Thai messages; the entire pool is used before repeating. No skip appears outside DEV.
- [x] The underlying warning/consent is inert while the error is open. Error OK/close/Escape returns to the same step without advancing or clearing checked boxes.
- [x] After the fifth OK, an iLeak dialog opens with `ding`, 3 safety checkboxes plus consent (none pre-ticked), and the real 1129 / 1130 warning.
- [x] The large final OK stays disabled until every box is ticked; unticking any box disables it again.
- [x] Warning/consent windows fit at 1280, 390 and 320 px; the final body scrolls while its large OK remains visible.
- [x] The gate shows again on every normal page load (never remembered).

### Appraisal

- [ ] Spec rows type out one by one, then the meter needle swings, then the tier stamp lands
- [ ] **Power box, auto mode** (the browser can read the battery):
  - [ ] ⚡ ตรวจพบไฟเข้าเครื่อง (charging detected)
  - [ ] ยังไม่พบไฟเข้าเครื่อง: "ตรวจซ้ำ" button and the optional "ยืนยันเอง…" tick
  - [ ] After "ตรวจซ้ำ" changes nothing: a "โหลดหน้าใหม่" button and a Linux / Chrome hint appear
  - [ ] "โหลดหน้าใหม่" reloads and skips the agreement once; a normal reload shows it again
- [ ] **Power box, forced manual mode** (Safari / Firefox / Brave / http; iOS only via the DEV skip):
  - [ ] Gold pulsing box "เบราว์เซอร์นี้อ่านสถานะชาร์จไม่ได้ — ต้องชาร์จด้วยมือ" with the browser-specific reason
  - [ ] "⚡ ชาร์จด้วยมือ" cranks a battery 0 → 100% with rising beeps, then "ชาร์จด้วยมือเรียบร้อย" (counts as powered)
  - [ ] "ไม่ได้เสียบสาย" gives "ยืนยันว่าไม่ได้เสียบสาย" (safe path)
  - [ ] "เปลี่ยนใจ" resets the answer
  - [ ] Until an answer is given, the dip button is replaced by "⚡ ไปชาร์จด้วยมือก่อน (ขั้นที่ 1) ↑", which scrolls to the box
- [ ] Spec rows are honest: Safari shows "(Safari ปัดเป็น 4 หรือ 8)"; RAM shows "(ปัดลง)" or "(สูงสุดที่เบราว์เซอร์ยอมบอก)"; masked GPUs show "เบราว์เซอร์ซ่อนรุ่นจริง"
- [ ] Plugging or unplugging the charger mid-test updates within about 1 s (auto mode)
- [ ] Choosing a wattage from the dropdown labels it "แจ้งเอง (ไม่ผ่านการรับรอง)" (self-declared)

### Peripheral tiles

Four states:

- [ ] off: crossed out, "ตัดสิทธิ์" plus the reason
- [ ] locked: gold "แตะเพื่อ…" (needs permission)
- [ ] idle
- [ ] live: gold border and a "⚡ เชื่อมต่อ" tag

Tiles:

| ✓ | Tile | Port | Weight |
|---|---|---|---|
| [ ] | โพรบ iLeak | USB-C | +2 |
| [ ] | อุปกรณ์ USB | USB-C | +2 |
| [ ] | แจ็คหูฟัง / ไมค์ | 3.5mm (+1) or USB-C (+2) | +1 / +2 |
| [ ] | จอนอก | USB-C | +2 |
| [ ] | คีย์บอร์ด / เมาส์ USB | USB-C | +2 |
| [ ] | เครื่องดนตรี MIDI | USB-C | +2 |
| [ ] | กล้อง USB | USB-C | +2 |
| [ ] | จอยเกม | USB-C | +2 |
| [ ] | เมาส์บนมือถือ | USB-C | +2 |
| [ ] | สายแลน | Ethernet | +1 |
| [ ] | แอปติดตั้ง | USB-C | +2 |
| [ ] | ปุ่มจำลอง | ใจ | +0.5 |

(สายชาร์จ has no tile; it only decides "powered".)

### Final step

- [ ] The formula shows `พลัง × mult₁ × mult₂ = ???`
- [ ] The text under it switches between "มีไฟเข้า… ผลลัพธ์อาจรุนแรง" (powered) and "ไม่มีไฟเข้า… ปลอดภัย (และน่าเบื่อ)" (unpowered)
- [ ] Hold-to-dip button: drains if you let go, fires at 100%

---

## 6. Device → wattage guesses (`src/appraisal/specs.js`, `src/appraisal/devices.js`)

| ✓ | Device | Guess | Tier |
|---|---|---|---|
| [ ] | RTX xx80 / 90 Laptop, or a 24+ thread CPU | 280 W | S |
| [ ] | Desktop RTX | 650–1000 W | SSS |
| [ ] | Apple M Max | 140 W | A |
| [ ] | Samsung S Ultra | 45 W | C |
| [ ] | Xiaomi / Redmi / POCO | 67 W | B |
| [ ] | realme GT | 240 W | S |
| [ ] | OPPO / OnePlus, vivo | 80 W | B |
| [ ] | Huawei / Honor | 66 W | B |
| [ ] | Pixel | 27–30 W | D |
| [ ] | Nintendo Switch | 39 W | C |
| [ ] | Steam Deck | 45 W | C |
| [ ] | Smart TV | 150 W | A |
| [ ] | Tesla in-car browser | 250 kW | kW |
| [ ] | iPhone / iPad | 20–35 W by screen size (only visible with the DEV skip) | blocked (joke screen) |

---

## 7. DEV panel (tick DEV, top right)

- [ ] The tickbox is visible and tappable on every screen: agreement, iOS block, main page, and during the calculation (blue screen, black hole included). The header sits above every overlay.
- [ ] Ticking it writes `?dev=1` to the URL, opens the panel under the tickbox, and ▾ / ▴ folds it
- [ ] Unticking hides the panel and nothing dev-related applies anymore (no fake watts, no skips)

**ข้าม (skips):**

- [ ] ข้ามหน้าข้อตกลง: off brings the agreement back (with the panel still on top), on returns to the main page
- [ ] ข้ามหน้าบล็อก iOS
- [ ] ข้ามหน้าบล็อกภูมิภาค
- [ ] ข้ามแอนิเมชันประเมิน (spec rows appear instantly)
- [ ] ข้ามการบังคับชาร์จด้วยมือ (dip allowed without answering)
- [ ] ข้ามการคำนวณ (straight to the result, effects still on)
- [ ] ปุ่มกดค้างแค่ 0.3 วิ

**ค่า / ยิง FX:**

- [ ] Wattage box accepts `280`, `1.21e9`, `1e42`; "auto" clears it
- [ ] Tier buttons F → Ω
- [ ] Power auto / on / off
- [ ] USB-C ปลอม − / +
- [ ] Speed 1× / 3× / 10×
- [ ] "คะแนนจริง" and L0–L7 work; they're disabled until the main page is showing

**Stress test:**

- [ ] วนทุกระดับ L0→L7: each result closes itself, and the last (L7) stays open
- [ ] ยิงคะแนนจริง ×5
- [ ] สุ่มวัตต์ 10 วิ: the meter and tier stamp keep switching (5 W … 1e42 W)
- [ ] USB-C ปลอม ×50 (long scoring sequence)
- [ ] โกลาหลสูงสุด: Ω + 30 fake devices + powered → L7
- [ ] หยุด stops the sequence and the random wattage
- [ ] แสดง FPS: green ≥ 50, yellow 30–49, red < 30. Check L6 / L7 on a real phone.

**Tools:**

- [ ] เล่นการประเมินใหม่ replays the typing, meter and stamp animation
- [ ] เปิดข้อตกลง
- [ ] รีเซ็ต restores the default skips and values
- [ ] raw spec shows what the browser actually reported

## XP desktop shell, sounds and gags

- [ ] Luna blue windows, white panels, orange button hover border, green controls and original sky/hills background appear at desktop and 390 px widths without horizontal overflow.
- [ ] Tahoma/Trebuchet and Thai fallback fonts render ่ ้ ๊ ๋ clearly, including in wrapped titles and buttons.
- [ ] Header contains the brand, PS1/PS2 switch and DEV controls; `--header-h` follows its size. DEV remains above agreement and game overlays.
- [ ] Bottom taskbar reserves space in the page; Start menu fits on phones, closes with Escape/outside click, and exposes quality selection, quality-screen opener, login and helper restoration.
- [ ] Taskbar mute uses the same master gain as the scenes; clock displays local time.
- [x] Each agreement warning plays `exclamation`, with gray OK until its cooldown reaches zero; the final consent window plays `ding`. Close/Escape cannot skip warnings or consent, and every normal reload starts again at warning 1.
- [ ] iOS remains hard-blocked and the region block still works, with the `critical` cue.
- [ ] Covered taskbar/helper controls cannot receive keyboard focus during the agreement or calculation overlay.
- [ ] “ปิดเครื่อง…” opens a restart dialog; cancel/Escape keeps the page intact, and only confirming restart plays `shutdown` and reloads.
- [ ] Connected/disconnected device cards trigger the correct sound and named hardware balloon; the balloon hides after five seconds or on close, and does not obscure the Start menu.
- [ ] น้องปลั๊ก gives entry/appraisal/no-peripheral/before-proceed tips, scrolls to controls on “ใช่”, collapses on “ไม่ต้อง”, remembers “ไม่ต้องแสดงอีก” for the session, and can be restored from Start.
- [ ] Certificate sticker has a guilloche pattern, hologram, tier edition and stable `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` fake key. Printing shows only the certificate, including from an orbiting L7 card.
- [ ] Calculation uses the original SVG hourglass cursor; reduced motion keeps the UI and L7 readable.
- [ ] Each event in `public/sounds/README.md` loads `.mp3` / `.wav` / `.ogg` in order; missing or broken files fall back to synthesis, respect mute and tolerate browser autoplay restrictions.
