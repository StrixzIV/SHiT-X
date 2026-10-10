// Number formatting for numbers that go from 5 W to "God".
const SI = [[1e30, 'Q'], [1e27, 'R'], [1e24, 'Y'], [1e21, 'Z'], [1e18, 'E'], [1e15, 'P'], [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k']]

export function si(n, unit = 'W') {
  if (n >= 1e33) return `${n.toExponential(1)} ${unit}`
  const hit = SI.find(([v]) => n >= v)
  if (!hit) return `${+n.toFixed(1)} ${unit}`
  return `${+(n / hit[0]).toFixed(2)} ${hit[1]}${unit}`
}

// Compact for score boxes: plain up to a million, scientific after.
export const big = (n) => (n >= 1e6 ? n.toExponential(2) : (+n.toFixed(1)).toLocaleString('en-US'))
