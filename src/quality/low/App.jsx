// Low-quality tree — what a second-year student ships after one intro-HTML class.
// No design, no framework: raw HTML in the browser's default styles, one <center>,
// one <marquee>, a border="1" table, and a CSS file that never happened.
// It still runs the same shared probes/scoring as High (src/appraisal, src/game, src/probes).
import { useEffect, useState } from 'react'
import { readSpecs, estimateWatts, specBonus, tierFor, WATT_CHOICES } from '../../appraisal/specs.js'
import { computeScore } from '../../game/score.js'
import { big } from '../../game/format.js'
import { useProbes } from '../../probes/useProbes.js'

const VERDICTS = [
  'ไม่มีไฟเข้าเครื่องเลย ปลอดภัยมาก (และน่าเบื่อมาก)',
  'ไฟจิ้ม ๆ นิดเดียว ระวังนิดหน่อยพอ',
  'เปปี้! น้ำเริ่มเดือดแล้ว',
  'ร้อนขึ้นมือแล้วนะ อย่าเพิ่งลืมสาย',
  'FAHHHHH (ห้ามลองจริง)',
  'แม่วิ่งมาปลุกตอนตีสาม',
  'ระดับนิวเคลียร์ แจ้ง ปภ. ด่วน!!',
  'หลุมดำ — อาจารย์ให้ A เพราะไม่มีใครกล้าแก้โค้ด',
]

export default function LowApp({ onOpenQualityGate }) {
  const { cards, tap } = useProbes()
  const [specs, setSpecs] = useState(null)
  const [watts, setWatts] = useState('')
  const [manual, setManual] = useState(null)
  const [result, setResult] = useState(null)
  const [tier, setTier] = useState(null)

  // เปลี่ยนหน้าเว็บทั้งใบกลับเป็น "งานส่ง": พื้นขาว ตัวดำ ฟอนต์ที่เบราว์เซอร์ให้มา
  useEffect(() => {
    const previous = document.body.getAttribute('style')
    document.body.style.cssText = 'background:#fff;color:#000;font-family:serif;line-height:normal;max-width:680px;margin:24px auto;padding:0 8px'
    return () => previous === null ? document.body.removeAttribute('style') : document.body.setAttribute('style', previous)
  }, [])
  useEffect(() => {
    readSpecs().then((s) => {
      setSpecs(s)
      setWatts(String(estimateWatts(s).watts))
    })
  }, [])

  const battery = cards.find((c) => c.id === 'battery')
  const peripherals = cards.filter((c) => c.id !== 'battery')
  const wattChoices = [...new Set([...WATT_CHOICES, ...(specs ? [estimateWatts(specs).watts] : [])])].sort((a, b) => a - b)
  const mustAnswer = !battery.supported && manual === null
  const dip = () => {
    const tier = tierFor(Number(watts))
    setResult(
      computeScore({
        watts: Number(watts),
        bonus: specs ? specBonus(specs) : 0,
        tier,
        peripherals,
        powered: battery.supported ? battery.live : manual === true,
      }),
    )
    setTier(tier)
  }

  const specRows = specs
    ? [
        ['รุ่นเครื่อง', specs.model ?? 'ไม่รู้ (มือถือ)'],
        ['ระบบปฏิบัติการ', specs.platform],
        ['CPU', specs.cores ? `${specs.cores} คอร์` : '-'],
        ['RAM', specs.memory ? `${specs.memory} GB` : '-'],
        ['การ์ดจอ', specs.gpu ?? '-'],
        ['จอ', `${specs.screen.w}x${specs.screen.h}${specs.screen.hz ? ` ${specs.screen.hz}Hz` : ''}`],
        ['เบราว์เซอร์', specs.browser],
      ]
    : [['กำลังโหลด...', '...']]

  return (
    <main className="low-html">
      <style>{'.low-html :where(h1,h2,h3,p,ul,ol,a,button,input,select,table,td,small){all:revert}.low-html table{max-width:100%;overflow-wrap:anywhere}.low-html button{max-width:100%}'}</style>
      <h1>โปรเจคจบ: ตรวจไฟรั่วในน้ำท่วม (v.2 final_FINAL)</h1>
      <hr />
      <p>
        จุ่มสายลงน้ำท่วมแล้วดูว่าไฟรั่วไหม — จัดทำโดย กลุ่ม 4
        <br />
        <small>(หมายเหตุ: อาจารย์ยังไม่ได้สอนเรื่อง CSS)</small>
      </p>
      <p>
        <small>
          <a
            href="#0"
            onClick={(e) => {
              e.preventDefault()
              onOpenQualityGate?.()
            }}
          >
            ← เปลี่ยนระดับกราฟิก (ของจริงมี WebGL กับหลุมดำ)
          </a>
        </small>
      </p>

      <h2>1) ข้อมูลเครื่อง</h2>
      <table border="1" cellPadding="4">
        <tbody>
          {specRows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>2) หัวชาร์จกี่วัตต์</h2>
      <select value={watts} onChange={(e) => setWatts(e.target.value)}>
        {wattChoices.map((w) => (
          <option key={w} value={w}>
            {w} W
          </option>
        ))}
      </select>
      <p>
        <small>(ระบบเดาให้แล้ว ปกติคนใช้ประมาณนี้)</small>
      </p>

      <h2>3) ตอนนี้กำลังชาร์จอยู่ไหม</h2>
      {battery.supported ? (
        <p>เบราว์เซอร์อ่านเองได้: {battery.live ? 'กำลังชาร์จอยู่ ⚡' : 'ไม่ได้ชาร์จ'}</p>
      ) : (
        <p>
          <label>
            <input type="radio" name="manual" checked={manual === true} onChange={() => setManual(true)} /> กำลังชาร์จ
          </label>
          <br />
          <label>
            <input type="radio" name="manual" checked={manual === false} onChange={() => setManual(false)} /> ไม่ได้เสียบอะไรเลย
          </label>
        </p>
      )}

      <h2>4) อุปกรณ์ที่เสียบเพิ่ม (กดเพื่อเชื่อมต่อ)</h2>
      <ul>
        {peripherals.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => tap(p.id)} disabled={!p.supported}>
              {p.name} ({p.port}) — {p.live ? 'เสียบแล้ว ✔' : p.supported ? 'ยังไม่เสียบ' : 'เบราว์เซอร์นี้ใช้ไม่ได้'}
            </button>
          </li>
        ))}
      </ul>

      <hr />
      <button type="button" onClick={dip} disabled={!specs || mustAnswer}>
        [ จุ่มสายลงน้ำ ]
      </button>
      {mustAnswer && <p>ต้องตอบข้อ 3 ก่อนนะ</p>}

      {result && (
        <>
          <h2>ผลลัพธ์</h2>
          <table border="1" cellPadding="4">
            <tbody>
              <tr>
                <td>พลังงาน (chips)</td>
                <td>{big(result.chips)}</td>
              </tr>
              <tr>
                <td>ระดับหัวชาร์จ (mult1)</td>
                <td>
                  {tier?.id} — {tier?.title} (×{result.mult1})
                </td>
              </tr>
              <tr>
                <td>อุปกรณ์ต่อพ่วง (mult2)</td>
                <td>×{result.mult2}</td>
              </tr>
              <tr>
                <td>
                  <b>แรงดันไฟรั่วรวม</b>
                </td>
                <td>
                  <b>{big(result.total)}</b>
                </td>
              </tr>
            </tbody>
          </table>
          {result.level >= 3 ? (
            <marquee>
              <h3 style={{ color: 'red' }}>{VERDICTS[result.level]}</h3>
            </marquee>
          ) : (
            <p>
              <b>{VERDICTS[result.level]}</b>
            </p>
          )}
          <p>
            <a
              href="#0"
              onClick={(e) => {
                e.preventDefault()
                setResult(null)
              }}
            >
              ลองใหม่อีกครั้ง
            </a>
          </p>
        </>
      )}

      <hr />
      <center>
        <small>© กลุ่ม 4 สาขาวิชา... อ้างอิง: ไม่มี | Best viewed in Internet Explorer 6 (1024x768)</small>
      </center>
    </main>
  )
}
