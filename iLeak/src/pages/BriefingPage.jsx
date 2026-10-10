import { AlertTriangle, BookOpen, Info, ShieldAlert } from 'lucide-react'

// Former stages 1 + 2, merged: read it top to bottom and slowly realize.
const FACTS = [
  ['กฎฟิสิกส์พื้นฐานเรื่องมวลน้ำ', '"น้ำเปียกเสมอ หากระดับน้ำสูงขึ้นแปลว่ามีน้ำเพิ่มขึ้น" และหากน้ำท่วมมิดหัวเข่า แปลว่าท่านไม่สามารถเดินแบบเท้าแห้งได้อีกต่อไป'],
  ['การนำไฟฟ้าของน้ำลาดกระบัง', 'น้ำฝนบริสุทธิ์ไม่นำไฟฟ้า แต่น้ำท่วมขังอุดมไปด้วยแคลเซียม ดินตะกอน ขยะเปียก และเศษปลั๊กพ่วง จึงนำไฟดีกว่าทองแดงบริสุทธิ์ 12 เท่า'],
  ['ทฤษฎีการตรวจจับด้วยสายชาร์จ', 'พอร์ต USB-C มี 24 พิน หากมีไฟ 220V รั่วในน้ำ พิน VBUS จะรับไอออนอิสระเข้าสู่วงจรชาร์จ ทำให้โทรศัพท์เริ่มชาร์จเองอย่างน่าอัศจรรย์'],
  ['สมการไฮโดร-อิเล็กทริก', 'V_leak = (ความชื้น × ระดับน้ำ) ÷ สติสัมปชัญญะ — เมื่อ V_leak > 5V สมาร์ทโฟนจะทำหน้าที่เป็นโวลต์มิเตอร์พลีชีพ'],
]

const CHECKS = [
  ['สับคัตเอาต์ / เบรกเกอร์หลักลง', 'ทำเฉพาะกรณีที่ตู้ยังไม่จมน้ำ หากตู้จมแล้ว ห้ามแตะเด็ดขาด ให้วิ่งขึ้นชั้นสอง'],
  ['ถอดปลั๊กเครื่องใช้ไฟฟ้าทุกจุด', 'โดยเฉพาะพัดลมตั้งพื้นบนพื้นเปียก และปลั๊กสามตาที่ลอยน้ำอยู่เหมือนกระทง'],
  ['สวมรองเท้าบูทยางหรือยืนบนกะละมัง', 'เพื่อให้กระแสไฟเลือกไหลลงสายชาร์จแทนร่างกายมนุษย์ ตามหลักไบโอฟิสิกส์'],
  ['เลือกสาย USB-C เป็นอันดับแรก', 'สาย USB-C ได้ X2 Mult · แจ็ค 3.5mm ได้ +4 · สายแลน +3 · ไม่มีสายเลยใช้ Placebo Joker'],
]

export default function BriefingPage({ voucher, setVoucher }) {
  return (
    <main className="briefing">
      <section className="paper">
        <span className="kicker">ส่วนที่ 1 : FUNDAMENTALS</span>
        <h2><BookOpen /> ความรู้เรื่องน้ำท่วมและกายภาพของมวลน้ำ</h2>
        <div className="facts">
          {FACTS.map(([t, d], i) => (
            <article key={t} className="fact">
              <span className="fact-n">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <p className="note"><Info size={18} /> หากอุปกรณ์เริ่มมีควันขาวพวยพุ่งออกจากรูชาร์จ ให้ถอยห่างอย่างน้อย 3 ก้าว</p>
      </section>

      <section className="paper">
        <span className="kicker">ส่วนที่ 2 : SAFETY PROTOCOL</span>
        <h2><ShieldAlert /> มาตรการป้องกันและการยินยอมความเสี่ยง</h2>
        <ul className="checks">
          {CHECKS.map(([t, d]) => (
            <li key={t}>
              <label>
                <input type="checkbox" defaultChecked />
                <span><b>{t}</b><small>{d}</small></span>
              </label>
            </li>
          ))}
        </ul>
        <label className={`consent ${voucher ? 'on' : ''}`}>
          <input type="checkbox" checked={voucher} onChange={(e) => setVoucher(e.target.checked)} />
          <span>
            <b>[ข้อบังคับสำคัญ] ฉันยินยอมใช้สมาร์ทโฟนเป็นฟิวส์ตรวจกระแสไฟฟ้าตามหลักวิทยาศาสตร์</b>
            <small>
              ข้าพเจ้ารับทราบว่า iLeak เป็นซอฟต์แวร์เสียดสี (The Stupid Hackathon Thailand) หากนำสายชาร์จไปจุ่มน้ำจริง โทรศัพท์อาจลัดวงจรและหมดประกันโดยสมบูรณ์
              {voucher && ' — ได้รับ Voucher +1 Mult แล้ว 🎟️'}
            </small>
          </span>
        </label>
        <p className="real-warning">
          <AlertTriangle size={18} /> เรื่องจริงที่ไม่ตลก: ถ้าสงสัยว่าน้ำท่วมมีไฟรั่ว อย่าลงน้ำ อย่าจุ่มอะไรลงไป ตัดไฟที่ต้นทาง แล้วโทร 1129 (กฟภ.) หรือ 1130 (กฟน.)
        </p>
        <a className="btn orange wide" href="#/">รับทราบแล้ว ไปจุ่มสาย →</a>
      </section>
    </main>
  )
}
