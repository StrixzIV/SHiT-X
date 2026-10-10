// Balatro-style scoring: every live probe adds chips (its reading) and either
// +Mult or ×Mult. Final "voltage" = chips × mult. Beat the blind (Thai mains) = leak.
export const BLIND = 220

const HANDS = [
  { min: 0, name: 'น้ำเปล่า', en: 'High Card', chips: 10, mult: 1 },
  { min: 1, name: 'ไฟรั่วเดี่ยว', en: 'Pair', chips: 20, mult: 2 },
  { min: 2, name: 'รั่วสองสาย', en: 'Two Pair', chips: 30, mult: 2 },
  { min: 3, name: 'สามสายจุ่มน้ำ', en: 'Three of a Kind', chips: 40, mult: 3 },
  { min: 4, name: 'บ้านทั้งหลังมีไฟ', en: 'Full House', chips: 50, mult: 4 },
  { min: 5, name: 'ชักโครก', en: 'Flush 🚽', chips: 80, mult: 6 },
]

export function handFor(liveCount) {
  return HANDS.findLast((h) => liveCount >= h.min)
}

// Returns the ordered steps the UI animates, plus the final tally.
export function scoreHand(cards, { voucher = false } = {}) {
  const live = cards.filter((c) => c.supported && c.live)
  const hand = handFor(live.length)
  let chips = hand.chips
  let mult = hand.mult + (voucher ? 1 : 0)
  const steps = []
  for (const c of live) {
    chips += c.reading
    steps.push({ id: c.id, kind: 'chips', text: `+${c.reading}`, chips, mult })
    if (c.xmult) {
      mult *= c.xmult
      steps.push({ id: c.id, kind: 'xmult', text: `X${c.xmult}`, chips, mult })
    } else if (c.mult) {
      mult += c.mult
      steps.push({ id: c.id, kind: 'mult', text: `+${c.mult}`, chips, mult })
    }
  }
  const total = chips * mult
  return { hand, steps, chips, mult, total, leak: total >= BLIND }
}
