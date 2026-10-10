import { BLIND } from '../game/score.js'
import { CountUp, WavyText } from '../fx/juice.jsx'

export default function ScorePanel({ hand, chips, mult, total, leak, liveCount, voucher }) {
  return (
    <aside className="score-panel">
      <div className="blind">
        <div className="blind-chip">⚡</div>
        <div>
          <div className="blind-title">Boss Blind: ไฟบ้าน</div>
          <div className="blind-goal">
            ต้องได้อย่างน้อย <b>{BLIND} V</b>
          </div>
        </div>
      </div>

      <div className={`round-score ${leak ? 'on-fire' : ''}`}>
        <span className="rs-label">แรงดันรอบนี้</span>
        <span className="rs-value">
          <CountUp value={total} /> V
        </span>
        {leak && <span className="flames" aria-hidden />}
      </div>

      <div className="hand-name">
        <WavyText text={hand.name} />
        <span className="hand-en">{hand.en}</span>
      </div>

      <div className="tally">
        <div className="chips-box">
          <CountUp value={chips} ms={250} />
        </div>
        <span className="times">X</span>
        <div className="mult-box">
          <CountUp value={mult} ms={250} />
        </div>
      </div>

      <dl className="stats">
        <div><dt>สายที่มีไฟ</dt><dd className="blue">{liveCount}</dd></div>
        <div><dt>ประกันเครื่อง</dt><dd className="red">0</dd></div>
        <div><dt>เงินค่าเทป</dt><dd className="gold">฿15</dd></div>
        <div><dt>ระดับน้ำ</dt><dd>เข่า / 8</dd></div>
      </dl>

      {voucher && <div className="voucher">🎟️ Voucher: ยินยอมเป็นฟิวส์ +1 Mult</div>}
    </aside>
  )
}
