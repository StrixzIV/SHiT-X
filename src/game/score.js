import { si } from './format.js'

// Balatro-style hand: chips from the brick and the specs, +Mult from every
// live peripheral (USB-C counts double), then the tier hits as ×Mult.
// Nothing powered → the mult is crushed to ×0 → safe.
// `steps` is the order the calculation screen plays them in.

export const peripheralWeight = (p) => (p.id === 'placebo' ? 0.5 : p.port === 'USB-C' ? 2 : 1)

export function computeScore({ watts, bonus, tier, peripherals, powered, fakeUsbC = 0 }) {
  const fake = Array.from({ length: fakeUsbC }, (_, i) => ({ id: `dev-${i}`, name: 'USB-C ปลอม', port: 'USB-C', supported: true, live: true }))
  const live = [...peripherals, ...fake].filter((p) => p.supported && p.live)
  const on = powered || live.length > 0
  const steps = []
  let chips = 0
  let mult = 1
  const push = (s) => steps.push({ ...s, chips, mult })

  chips += watts
  push({ id: 'brick', label: 'หัวชาร์จ', sub: si(watts), kind: 'chips', value: watts })
  if (bonus) {
    chips += bonus
    push({ id: 'spec', label: 'สเปกเครื่อง', sub: 'CPU · RAM · จอ', kind: 'chips', value: bonus })
  }
  for (const p of live) {
    const w = peripheralWeight(p)
    mult += w
    push({ id: p.id, label: p.name, sub: p.port, kind: 'mult', value: w })
  }
  const mult2 = mult
  mult *= tier.mult
  push({ id: 'tier', label: `ระดับ ${tier.id}`, sub: tier.title, kind: 'xmult', value: tier.mult })
  if (!on) {
    mult = 0
    push({ id: 'nopower', label: 'ไม่มีไฟเข้า', sub: 'ทุกอย่างคูณศูนย์', kind: 'zero', value: 0 })
  }

  const total = Math.round(chips * mult)
  return { chips, mult1: tier.mult, mult2, mult, total, live, powered: on, level: levelFor(total), steps }
}

// 6 = nuke (≥ 100M), 7 = black hole (≥ 1e15)
const LEVELS = [0, 1, 2000, 8000, 30000, 100000, 1e8, 1e15]
export const levelFor = (total) => LEVELS.findLastIndex((min) => total >= min)
