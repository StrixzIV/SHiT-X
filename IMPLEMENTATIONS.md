# Role & Identity
You are an expert Frontend Engineer and Creative Hacker competing in "The Stupid Hackathon Thailand". 
Your mission is to build **"HydroCharge Sentinel"**, a mock-official, satirical single-page web app (Pure Software only) designed to "detect flood electricity leaks by submerging a smartphone charging cable directly into the floodwater."

---

## 🎨 Design & Corporate Identity (CI) Requirements
Emulate a prestigious Thai university portal (specifically KMITL room booking style)[cite: 1] with utmost seriousness to amplify comedic irony:
1. **Hero Header:**[cite: 1]
   - Deep charcoal/black tinted background (`#1A1A1A`) overlaying a blurred flood image[cite: 1].
   - University logo and mock portal header top-left ("KMITL STUPID LAB: Flood Electricity Division")[cite: 1].
   - "เข้าสู่ระบบ" (Login) button top-right that shows an alert: *"เซิร์ฟเวอร์จมน้ำอยู่ ไม่สามารถเข้าสู่ระบบได้"*[cite: 1].
   - Prominent bold title: **"KMITL Hydro-Charge Sentinel"** with subtitle: *"ระบบตรวจสอบกระแสไฟฟ้ารั่วไหลในมวลน้ำผ่านอินเทอร์เฟซ USB สากล"*[cite: 1].
2. **Floating Action Tab Bar:**[cite: 1]
   - Floating white card intersecting the Hero section and Content section[cite: 1].
   - KMITL brand orange accents (`#E35205`) for active states, borders, and main accents[cite: 1].
   - 4 Interactive Stage Tabs:
     1. `ความรู้เรื่องน้ำท่วม` (Flood Awareness)[cite: 1]
     2. `การป้องกันไฟฟ้า` (Pre-hazard Safety)[cite: 1]
     3. `เช็คไฟรั่ว (Main)` (Live Probe Detection)[cite: 1]
     4. `สรุปผล & ช่วยเหลือ` (Emergency Action)[cite: 1]

---

## ⚙️ Core Technical Implementation (Pure Software)
- **Framework:** React + Tailwind CSS + Lucide React.
- **Hardware Detection via Battery API:**
  - Utilize `navigator.getBattery()` to track `battery.charging` and `chargingchange`.
  - **Logic:** If charging becomes `true`, assume the submerged charging cable successfully detected live electricity in the water.
  - **Sensory Feedback:** Call `navigator.vibrate([300, 100, 300, 100, 600])` to simulate an electrical shock on mobile devices upon detecting charge.
  - Fallback UI if Battery API is not supported on the browser.

---

## 📑 4-Stage Workflow Specifications

### Stage 1: ความรู้เรื่องน้ำท่วม (Flood Awareness)
- Display pseudo-scientific and absurd flood facts (e.g., *"กฎฟิสิกส์: น้ำเปียกเสมอ หากระดับน้ำสูงขึ้นแปลว่ามีน้ำเพิ่มขึ้น"*).
- Include an acknowledgment button leading to Stage 2.

### Stage 2: การป้องกันไฟฟ้า (Pre-hazard Safety)
- Checklists of satirical precautions:
  - Cut main breakers only if not underwater yet.
  - Mandatory disclaimer checkbox: *"ฉันยินยอมใช้สมาร์ทโฟนเป็นฟิวส์ตรวจกระแสไฟฟ้าตามหลักวิทยาศาสตร์"*.

### Stage 3: เช็คไฟรั่ว (Main Detection Probe)
- Real-time battery status panel (Battery %, Charging status indicator).
- Instructions telling the user to dip their charger into the water (or plug the charger in to simulate live electricity).
- Interactive "เริ่มการตรวจสอบสเปกตรัมไฟฟ้าในของเหลว" button with loading animation.
- Dynamic gauge/voltage readout (spiking to `9999V DANGER` if charging is `true`).

### Stage 4: สรุปผล & ช่วยเหลือ (Emergency Action)
- Critical status summary based on detection outcome.
- Two mock emergency action cards:
  - **"เรียกช่างซ่อมด่วน":** External redirect link to Shopee search for black electrical tape (15 THB).
  - **"แจ้งเหตุกู้ภัยฉุกเฉิน":** External redirect link to YouTube playing Funeral Chant (บทสวดพระอภิธรรม 7 คัมภีร์).

---

## 🚀 Deliverable Output
Generate a complete, self-contained, and working React component (`App.jsx`) with inline Tailwind CSS classes, complete Lucide icon integrations, clean state handling, and zero dummy placeholders.