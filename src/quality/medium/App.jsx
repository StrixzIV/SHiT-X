// Medium-quality tree — the one that found the UI library catalog and applied
// ALL of it. Premium: real gradients, glassmorphism, glow shadows, oversized
// radii, animated gradient text. Inconsistent: every block ships its own design
// language, its own font stack, its own border-radius, its own button anatomy.
// Nothing matches anything. (Shared scoring: src/appraisal, src/game, src/probes.)
import { useEffect, useState } from 'react'
import { Zap, Gem, Rocket, Crown, Flame, Star, Cable, BatteryCharging, Usb, Headphones, Monitor, Keyboard, Music, Camera, Gamepad2, Mouse, EthernetPort, Smartphone, Pill } from 'lucide-react'
import { readSpecs, estimateWatts, specBonus, tierFor, WATT_CHOICES } from '../../appraisal/specs.js'
import { computeScore } from '../../game/score.js'
import { big } from '../../game/format.js'
import { useProbes } from '../../probes/useProbes.js'

const ICONS = {
  serial: Cable, webusb: Usb, audio: Headphones, display: Monitor,
  webhid: Keyboard, midi: Music, camera: Camera, gamepad: Gamepad2, otg: Mouse, ethernet: EthernetPort, native: Smartphone, placebo: Pill,
}

// Every block declares its own fonts/radii/shadows on purpose — consistency
// is exactly what this version must not have.
const C = {
  heroFont: "'Playfair Display', 'Georgia', serif",
  neonFont: "'Comic Sans MS', 'Chalkboard SE', cursive",
  corpFont: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  monoFont: "'Courier New', monospace",
}

const BLOCK_BASE = 'linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.03))'

export default function MediumApp({ onOpenQualityGate }) {
  const { cards, tap } = useProbes()
  const [specs, setSpecs] = useState(null)
  const [watts, setWatts] = useState(null)
  const [manual, setManual] = useState(null)
  const [result, setResult] = useState(null)
  const [tier, setTier] = useState(null)

  // Reset the page chrome the High tree set, then gild this one.
  useEffect(() => {
    const previous = document.body.getAttribute('style')
    document.body.style.cssText =
      "margin:0;font-family:'Segoe UI',sans-serif;background:radial-gradient(1200px 800px at 20% -10%, #3b0764, transparent 55%),radial-gradient(1000px 700px at 90% 20%, #0c4a6e, transparent 50%),linear-gradient(160deg,#0f0524 0%,#1a0b2e 45%,#020617 100%);color:#fff;min-height:100vh;overflow-x:hidden"
    return () => previous === null ? document.body.removeAttribute('style') : document.body.setAttribute('style', previous)
  }, [])

  useEffect(() => {
    readSpecs().then((s) => {
      setSpecs(s)
      setWatts(estimateWatts(s).watts)
    })
  }, [])

  const battery = cards.find((c) => c.id === 'battery')
  const peripherals = cards.filter((c) => c.id !== 'battery')
  const wattChoices = [...new Set([...WATT_CHOICES, ...(specs ? [estimateWatts(specs).watts] : [])])].sort((a, b) => a - b)
  const mustAnswer = !battery.supported && manual === null
  const dip = () => {
    const t = tierFor(watts)
    setTier(t)
    setResult(
      computeScore({
        watts,
        bonus: specs ? specBonus(specs) : 0,
        tier: t,
        peripherals,
        powered: battery.supported ? battery.live : manual === true,
      }),
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* ███ Block 1: luxury-glass hero — serif gold, huge radius ███ */}
      <div
        style={{
          background: `${BLOCK_BASE}, linear-gradient(135deg,#7c2d12,#b45309)`,
          backgroundBlendMode: 'overlay',
          borderRadius: 42,
          padding: '48px 40px',
          border: '2px solid rgba(251,191,36,.55)',
          boxShadow: '0 0 90px rgba(251,191,36,.28), inset 0 1px 0 rgba(255,255,255,.25)',
          backdropFilter: 'blur(14px)',
          fontFamily: C.heroFont,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 7, color: '#fcd34d', textTransform: 'uppercase' }}>✦ premium leak experience ✦</div>
        <h1
          style={{
            margin: '14px 0 10px',
            fontSize: 'clamp(28px, 6vw, 52px)',
            overflowWrap: 'anywhere',
            background: 'linear-gradient(92deg,#fde68a,#fff7ed 30%,#f59e0b 55%,#fef3c7)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 2px 18px rgba(245,158,11,.55))',
          }}
        >
          iLeak: HydroCharging
        </h1>
        <p style={{ color: '#fef3c7', fontSize: 17, fontStyle: 'italic' }}>
          ประสบการณ์ตรวจไฟรั่วระดับพรีเมียม หรูหราด้วยเทคโนโลยี Glassmorphism ล้ำสมัย
        </p>
        <button
          type="button"
          onClick={() => onOpenQualityGate?.()}
          style={{
            marginTop: 22,
            padding: '12px 30px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,.5)',
            background: 'linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6,#06b6d4)',
            backgroundSize: '300% 100%',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 26px rgba(139,92,246,.45)',
            fontFamily: C.corpFont,
          }}
        >
          ✨ เปลี่ยนระดับกราฟิก
        </button>
      </div>

      {/* ███ Block 2: neon-cyber specs panel — different font, different radius, no glass ███ */}
      <div
        style={{
          marginTop: 34,
          borderRadius: 8,
          border: '2px solid #22d3ee',
          boxShadow: '0 0 24px rgba(34,211,238,.6), inset 0 0 18px rgba(34,211,238,.15)',
          background: 'rgba(2,6,23,.85)',
          padding: 26,
          fontFamily: C.monoFont,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ color: '#22d3ee', margin: 0, fontSize: 22, textShadow: '0 0 12px #22d3ee' }}>[ SYSTEM_SCAN.EXE ]</h2>
          <span style={{ color: '#4ade80', animation: 'medblink 1s steps(2) infinite' }}>● ONLINE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 12, marginTop: 18 }}>
          {(specs
            ? [
                ['MODEL', specs.model ?? 'UNKNOWN_DEVICE'],
                ['OS', specs.platform],
                ['GPU', specs.gpu ?? 'N/A'],
                ['CORES/RAM', `${specs.cores ?? '?'}C / ${specs.memory ?? '?'}GB`],
                ['DISPLAY', `${specs.screen.w}x${specs.screen.h}`],
                ['BROWSER', specs.browser],
              ]
            : [['SCAN', '▓▓▓▒▒░ running…']]
          ).map(([k, v]) => (
            <div key={k} style={{ border: '1px dashed #155e75', padding: '10px 12px', color: '#a5f3fc', minWidth: 0, overflowWrap: 'anywhere' }}>
              <div style={{ fontSize: 11, color: '#22d3ee', letterSpacing: 2 }}>{k}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ███ Block 3: corporate SaaS pricing-card — watts + power answer ███ */}
      <div
        style={{
          marginTop: 34,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))',
          gap: 20,
          fontFamily: C.corpFont,
        }}
      >
        <div
          style={{
            borderRadius: '28px 6px 28px 6px',
            background: 'linear-gradient(180deg,#ffffff,#eef2ff)',
            color: '#1e1b4b',
            padding: 30,
            boxShadow: '0 24px 60px rgba(0,0,0,.45)',
            border: '1px solid #c7d2fe',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Gem size={26} color="#7c3aed" />
            <span style={{ fontWeight: 800, fontSize: 19 }}>เลือกกำลังหัวชาร์จ</span>
          </div>
          <div style={{ margin: '18px 0 6px', fontSize: 'clamp(24px, 5vw, 44px)', fontWeight: 900, color: '#4c1d95', letterSpacing: -2, overflowWrap: 'anywhere' }}>
            {watts?.toLocaleString() ?? '—'} <span style={{ fontSize: 18 }}>W</span>
          </div>
          <input
            type="range"
            min={0}
            max={wattChoices.length - 1}
            value={Math.max(0, wattChoices.indexOf(watts))}
            onChange={(e) => setWatts(wattChoices[+e.target.value])}
            style={{ width: '100%', accentColor: '#7c3aed' }}
          />
          <div style={{ fontSize: 12.5, color: '#6366f1', marginTop: 6 }}>ระบบ AI ประเมินจากสเปกเครื่องของคุณแล้ว 💜</div>
        </div>

        <div
          style={{
            borderRadius: 4,
            background: 'linear-gradient(135deg,#052e16,#14532d)',
            border: '1px solid #4ade80',
            padding: 30,
            color: '#dcfce7',
            boxShadow: '0 0 34px rgba(74,222,128,.25)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <BatteryCharging size={24} color="#4ade80" />
            <span style={{ fontWeight: 800, fontSize: 18 }}>สถานะไฟ</span>
          </div>
          {battery.supported ? (
            <>
              <div style={{ margin: '14px 0 4px', fontSize: 30, fontWeight: 800 }}>{battery.live ? '⚡ กำลังชาร์จ' : 'ไม่ได้ชาร์จ'}</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>{battery.detail}</div>
            </>
          ) : (
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <label style={{ display: 'flex', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="medpower" checked={manual === true} onChange={() => setManual(true)} /> กำลังชาร์จอยู่
              </label>
              <label style={{ display: 'flex', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="medpower" checked={manual === false} onChange={() => setManual(false)} /> ไม่ได้เสียบไฟ
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ███ Block 4: brutalist-neon peripheral grid — nothing like the blocks above ███ */}
      <h2 style={{ marginTop: 40, fontFamily: C.neonFont, color: '#f472b6', textShadow: '3px 3px 0 #4c0d84', fontSize: 30 }}>
        🔌 เสียบของเพิ่ม!! (ยิ่งเสียบยิ่งปัง)
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
        {peripherals.map((p, i) => {
          const Icon = ICONS[p.id] ?? Star
          const hue = (i * 67) % 360
          const live = p.supported && p.live
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => tap(p.id)}
              disabled={!p.supported}
              style={{
                textAlign: 'left',
                cursor: p.supported ? 'pointer' : 'not-allowed',
                borderRadius: i % 3 === 0 ? 20 : i % 3 === 1 ? 4 : 14,
                padding: 16,
                border: live ? '2px solid #fef08a' : '2px solid transparent',
                background: p.supported ? `linear-gradient(140deg, hsl(${hue} 85% 30%), hsl(${(hue + 80) % 360} 90% 18%))` : '#27272a',
                color: p.supported ? '#fff' : '#71717a',
                boxShadow: live ? `0 0 26px hsl(${hue} 95% 60% / .8)` : '0 6px 16px rgba(0,0,0,.4)',
                opacity: p.supported ? 1 : 0.55,
                fontFamily: C.neonFont,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Icon size={22} />
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,0,0,.35)' }}>{p.port}</span>
              </div>
              <div style={{ marginTop: 10, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>{live ? '✓ เชื่อมต่อแล้ว' : p.supported ? 'แตะเพื่อเชื่อม' : 'ใช้ไม่ได้'}</div>
            </button>
          )
        })}
      </div>

      {/* ███ Block 5: the dip — "rocket CTA", gradient border trick ███ */}
      <div style={{ marginTop: 44, textAlign: 'center' }}>
        <button
          type="button"
          onClick={dip}
          disabled={!specs || mustAnswer}
          style={{
            padding: 3,
            borderRadius: 999,
            border: 'none',
            cursor: mustAnswer ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(90deg,#f43f5e,#f59e0b,#22d3ee,#a3e635,#f43f5e)',
            opacity: mustAnswer ? 0.5 : 1,
            boxShadow: '0 10px 44px rgba(244,63,94,.5)',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px clamp(12px, 4vw, 46px)',
              borderRadius: 999,
              background: '#0b0416',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
              fontFamily: C.corpFont,
            }}
          >
            <Rocket size={22} /> {mustAnswer ? 'ตอบสถานะไฟก่อนนะ' : 'จุ่มสายลงน้ำท่วม'}
            <Flame size={20} color="#fb923c" />
          </span>
        </button>
      </div>

      {/* ███ Block 6: result — royal-certification parchment that clashes with everything ███ */}
      {result && (
        <div
          style={{
            marginTop: 44,
            borderRadius: 16,
            padding: 4,
            background: 'linear-gradient(120deg,#b91c1c,#0e7490 40%,#7e22ce 75%,#b45309)',
          }}
        >
          <div style={{ borderRadius: 13, background: 'linear-gradient(165deg,#fffbeb,#fef3c7)', color: '#3f2d0c', padding: 34, fontFamily: C.heroFont }}>
            <div style={{ textAlign: 'center' }}>
              <Crown size={34} color="#b45309" />
              <div style={{ letterSpacing: 5, fontSize: 11, marginTop: 8, textTransform: 'uppercase' }}>certificate of hydro-electric excellence</div>
              <h2 style={{ margin: '10px 0 2px', fontSize: 32, color: '#78350f' }}>ผลการตรวจวัดระดับหรูหรา</h2>
            </div>
            <table style={{ width: '100%', marginTop: 22, borderCollapse: 'collapse', fontSize: 15, tableLayout: 'fixed', overflowWrap: 'anywhere' }}>
              <tbody>
                {[
                  ['พลังงานสะสม', `${big(result.chips)} units`],
                  ['ชั้นศักดิ์ศรีหัวชาร์จ', `${tier?.id ?? '—'} · ${tier?.title ?? ''}`],
                  ['ตัวคูณองค์ประกอบ', `×${result.mult2}`],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: '9px 4px', borderBottom: '1px solid #e7d3a1', opacity: 0.75 }}>{k}</td>
                    <td style={{ padding: '9px 4px', borderBottom: '1px solid #e7d3a1', textAlign: 'right', fontWeight: 700 }}>{v}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '14px 4px', fontSize: 17 }}>แรงดันไฟรั่วสุทธิ</td>
                  <td style={{ padding: '14px 4px', textAlign: 'right', fontSize: 30, fontWeight: 900, color: '#b91c1c' }}>{big(result.total)}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ textAlign: 'center', marginTop: 18, fontStyle: 'italic', color: '#92400e' }}>— {tier?.remark ?? ''} —</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, color: '#b45309' }}>
              <Zap size={18} />
              <Star size={18} />
              <Zap size={18} />
            </div>
          </div>
        </div>
      )}

      {/* One keyframe lives here so the block stays self-contained. */}
      <style>{'@keyframes medblink{50%{opacity:.25}}'}</style>
    </div>
  )
}
