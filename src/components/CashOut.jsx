import { useState } from 'react'
import { Award, PhoneCall, Printer, Wrench } from 'lucide-react'
import { WavyText } from '../fx/juice.jsx'

// Former "Stage 4": shown as Balatro's cash-out screen after a hand is played.
export default function CashOut({ result, cards, onClose }) {
  const [cert, setCert] = useState(null)
  const live = cards.filter((c) => c.supported && c.live)

  const issue = () =>
    setCert({
      id: `KMITL-STUPID-2569-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('th-TH'),
    })

  return (
    <div className="cashout-backdrop" role="dialog" aria-modal="true">
      <div className={`cashout ${result.leak ? 'leak' : 'safe'}`}>
        <div className="cashout-head">
          <WavyText text={result.leak ? 'ไฟรั่ว!!' : 'รอดไปอีกวัน'} className="cashout-title" />
          <div className="cashout-sub">
            {result.leak
              ? `${result.total.toLocaleString()} V ≥ 220 V — น้ำท่วมมีไฟแรงระดับชาร์จมือถือติด กรุณายกขาลอยจากพื้น`
              : `${result.total.toLocaleString()} V — ยังไม่ถึงไฟบ้าน หรือสายชาร์จของท่านขาดในอยู่แล้ว`}
          </div>
        </div>

        <ul className="cashout-rows">
          <li><span>มือที่เล่น: {result.hand.name}</span><b className="gold">{result.hand.en}</b></li>
          <li><span>สายที่ตรวจพบไฟ</span><b className="gold">{live.length} เส้น</b></li>
          <li><span>สถานะประกันเครื่อง</span><b className="red">สิ้นสุดทันที</b></li>
          <li><span>พอร์ตหลัก</span><b className="gold">{live[0]?.port ?? 'USB-C HydroProbe'}</b></li>
        </ul>

        <div className="cashout-actions">
          <a className="shop-card" href="https://shopee.co.th/search?keyword=เทปพันสายไฟ" target="_blank" rel="noopener noreferrer">
            <Wrench /> <span><b>เรียกช่างซ่อมด่วน</b><small>เทปพันสายไฟสีดำ ฿15 บน Shopee</small></span>
          </a>
          <a className="shop-card red" href="https://www.youtube.com/results?search_query=สวดพระอภิธรรม+7+คัมภีร์" target="_blank" rel="noopener noreferrer">
            <PhoneCall /> <span><b>แจ้งเหตุกู้ภัยฉุกเฉิน</b><small>บทสวดพระอภิธรรม 7 คัมภีร์</small></span>
          </a>
        </div>

        {cert && (
          <div className="cert">
            <div className="cert-id">CERTIFICATE ID: {cert.id}</div>
            <h3>หนังสือรับรองการตรวจวัดประจุไฟฟ้าในมวลน้ำ</h3>
            <p>ออกโดย ศูนย์วิจัยนวัตกรรมน้ำท่วมและการสละสมาร์ทโฟน KMITL · {cert.date}</p>
            <p>ผลการตรวจวัด: <b>{result.leak ? `อันตราย (${result.total.toLocaleString()} V)` : `ปลอดภัย (${result.total} V)`}</b></p>
            <p className="cert-fine">ใช้เพื่อความบันเทิงใน The Stupid Hackathon Thailand เท่านั้น เคลมประกันไม่ได้ทุกกรณี</p>
            <button type="button" className="btn ghost" onClick={() => window.print()}><Printer size={16} /> พิมพ์</button>
          </div>
        )}

        <div className="cashout-foot">
          {!cert && (
            <button type="button" className="btn gold" onClick={issue}><Award size={18} /> ออกใบรับรอง</button>
          )}
          <button type="button" className="btn orange" onClick={onClose}>จุ่มใหม่อีกรอบ</button>
        </div>
      </div>
    </div>
  )
}
