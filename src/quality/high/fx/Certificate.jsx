import { Droplets, Printer } from 'lucide-react'

function productKey(id) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let seed = 2166136261
  for (const letter of id) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619) >>> 0
  let key = ''
  for (let i = 0; i < 25; i++) {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    if (i && i % 5 === 0) key += '-'
    key += alphabet[(seed >>> 0) % alphabet.length]
  }
  return key
}

// The printable certificate on the result sheet. Printing shows only this
// (index.css @media print keeps `.cert`).
export default function Certificate({ cert, tier, volts, verdict }) {
  return (
    <div className="cert">
      <div className="coa-hologram" aria-hidden="true"><Droplets size={30} /><span>iLeak<br />ORIGINAL<br />iLeak<br />ORIGINAL</span></div>
      <div className="coa-brand"><Droplets size={21} /><b>iLeak: HydroCharging</b></div>
      <div className="coa-heading"><strong>Certificate of Authenticity</strong><span className="coa-edition">{tier.id} EDITION</span></div>
      <div className="cert-id">CERTIFICATE ID: {cert.id}</div>
      <h3>หนังสือรับรองระดับชั้นทางพลังงาน</h3>
      <p>ระดับ <b>{tier.id}</b> · {tier.title} · {cert.date}</p>
      <p>ผลการตรวจวัด: <b>{volts} V</b> ({verdict})</p>
      <div className="coa-license"><small>PRODUCT KEY · ใช้อวดได้ เปิดใช้งานอะไรไม่ได้</small><code>{productKey(cert.id)}</code></div>
      <p className="cert-fine">ใช้เพื่อความบันเทิงใน The Stupid Hackathon Thailand เท่านั้น อวดได้ แต่เคลมประกันไม่ได้</p>
      <button type="button" className="btn-line" onClick={() => window.print()}><Printer size={16} /> พิมพ์</button>
    </div>
  )
}
