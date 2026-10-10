import { useCallback, useEffect, useState } from 'react'
import Appraisal from '../components/Appraisal.jsx'
import Peripherals from '../components/Peripherals.jsx'
import HoldButton from '../components/HoldButton.jsx'
import DevPanel from '../components/DevPanel.jsx'
import CalcOverlay from '../fx/CalcOverlay.jsx'
import { estimateWatts, readSpecs, specBonus, tierFor } from '../appraisal/specs.js'
import { computeScore } from '../game/score.js'
import { big } from '../game/format.js'

// Smallest total that lands on each FX level, nudged up a bit (for dev firing).
const LEVEL_TARGET = [0, 500, 3000, 12000, 50000, 300000, 5e9, 1e20]

export default function MainPage({ cards, tap, refresh, dev, onShowGate }) {
  const [specs, setSpecs] = useState(null)
  const [override, setOverride] = useState(null)
  const [userPlugged, setUserPlugged] = useState(false)
  const [checking, setChecking] = useState(false)
  const [stamped, setStamped] = useState(false)
  const [run, setRun] = useState(null) // snapshot of the score while the overlay is open
  // dev knobs
  const [devWatts, setDevWatts] = useState(null)
  const [devPower, setDevPower] = useState('auto')
  const [devFake, setDevFake] = useState(0)
  const [speed, setSpeed] = useState(dev ? 3 : 1)
  const [instant, setInstant] = useState(dev)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    // a beat of suspense before the appraisal starts typing
    const t = setTimeout(() => readSpecs().then(setSpecs), instant ? 0 : 900)
    return () => clearTimeout(t)
  }, [instant, replay])

  const battery = cards.find((c) => c.id === 'battery')
  const batteryKnown = battery.supported
  const realPowered = (batteryKnown && battery.live) || userPlugged
  const powered = devPower === 'on' ? true : devPower === 'off' ? false : realPowered
  const recheck = async () => {
    setChecking(true)
    await Promise.all([refresh('battery'), readSpecs().then(setSpecs), new Promise((r) => setTimeout(r, 600))])
    setChecking(false)
  }
  const power = {
    known: batteryKnown,
    charging: batteryKnown && battery.live,
    level: battery.level ?? specs?.battery?.level ?? null,
    why: battery.detail,
    userPlugged,
    setUserPlugged,
    recheck,
    checking,
  }
  const est = specs ? estimateWatts(specs) : { watts: 0, why: '' }
  const watts = devWatts ?? override ?? est.watts
  const tier = tierFor(watts)
  const bonus = specs ? specBonus(specs) : 0
  const peripherals = cards.filter((c) => c.id !== 'battery')
  const score = computeScore({ watts, bonus, tier, peripherals, powered, fakeUsbC: devFake })
  const onStamped = useCallback(() => setStamped(true), [])

  const fire = (level) => {
    if (level == null) return setRun({ score, tier })
    const w = level === 0 ? watts : Math.ceil(LEVEL_TARGET[level] / tier.mult)
    setRun({ score: computeScore({ watts: w, bonus: 0, tier, peripherals: [], powered: level > 0 }), tier })
  }

  return (
    <main className="main">
      <Appraisal
        key={replay}
        specs={specs}
        est={est}
        watts={watts}
        override={override}
        setOverride={setOverride}
        tier={tier}
        bonus={bonus}
        power={power}
        stamped={stamped}
        onStamped={onStamped}
        instant={instant}
      />

      {stamped && (
        <>
          <Peripherals items={peripherals} tap={tap} mult2={score.mult2} />

          <section className="panel finale">
            <span className="eyebrow">ขั้นที่ 3 · จุ่มสายและคำนวณ</span>
            <div className="formula">
              <span className="f chips"><small>พลัง</small>{big(score.chips)}</span>
              <span className="fx">X</span>
              <span className="f mult"><small>mult<sub>1</sub> {tier.id}</small>{score.mult1}</span>
              <span className="fx">X</span>
              <span className="f mult"><small>mult<sub>2</sub></small>{score.mult2}</span>
              <span className="fx">=</span>
              <span className="f q"><small>แรงดันไฟรั่ว</small>???</span>
            </div>
            <p className="muted">
              {score.powered
                ? `มีไฟเข้า ${score.live.length ? `และอุปกรณ์ต่อพ่วง ${score.live.length} ชิ้น` : ''} — ผลลัพธ์อาจรุนแรง`
                : 'ไม่มีไฟเข้าเครื่องเลย ผลลัพธ์น่าจะปลอดภัย (และน่าเบื่อ)'}
            </p>
            <HoldButton ms={dev ? 300 : 1500} onFire={() => fire(null)}>กดค้างเพื่อจุ่มสายลงน้ำ</HoldButton>
          </section>
        </>
      )}

      {run && <CalcOverlay score={run.score} tier={run.tier} speed={speed} onClose={() => setRun(null)} />}

      {dev && (
        <DevPanel
          specs={specs}
          est={est}
          watts={watts}
          setWatts={setDevWatts}
          power={devPower}
          setPower={setDevPower}
          fake={devFake}
          setFake={setDevFake}
          speed={speed}
          setSpeed={setSpeed}
          score={score}
          tier={tier}
          onFire={fire}
          onReplay={() => { setInstant(false); setStamped(false); setSpecs(null); setReplay((n) => n + 1) }}
          onShowGate={onShowGate}
        />
      )}
    </main>
  )
}
