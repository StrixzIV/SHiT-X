// The appraisal meter swaps to a bigger instrument as the wattage climbs,
// so the needle always lands on the scale.
export const METERS = [
  { id: 'multi', name: 'มัลติมิเตอร์ตลาดนัด', note: 'ราคา 99 บาท', min: 5, max: 1e3, ticks: [5, 20, 65, 280, 1e3], arc: ['#6b6b6b', '#c9a227', '#ff4d2e'] },
  { id: 'kwh', name: 'มิเตอร์หน้าบ้านการไฟฟ้า', note: 'ยืมมาจากเสาไฟ', min: 1e3, max: 1e6, ticks: [1e3, 1e4, 1e5, 1e6], arc: ['#9aa3ad', '#38bdf8', '#0ea5e9'] },
  { id: 'plant', name: 'แผงควบคุมโรงไฟฟ้า', note: 'ยกมาทั้งห้องควบคุม', min: 1e6, max: 1e9, ticks: [1e6, 1e7, 1e8, 1e9], arc: ['#16a34a', '#facc15', '#dc2626'] },
  { id: 'flux', name: 'ฟลักซ์คาพาซิเตอร์', note: 'ถอดจาก DeLorean', min: 1e9, max: 1e12, ticks: [1e9, 1e10, 1e11, 1e12], arc: ['#e0f2fe', '#7df9ff', '#6366f1'] },
  { id: 'solar', name: 'หอดูดาวสุริยะ', note: 'วัดแสงอาทิตย์ทั้งดวง', min: 1e12, max: 1e17, ticks: [1e12, 1e13, 1e14, 1e15, 1e16, 1e17], arc: ['#fde68a', '#f97316', '#b91c1c'] },
  { id: 'kardashev', name: 'มาตรวัดคาร์ดาเชฟ', note: 'ระดับอารยธรรม 0 → II', min: 1e17, max: 1e27, ticks: [1e17, 1e20, 1e23, 3.8e26], arc: ['#22c55e', '#3b82f6', '#a855f7'] },
  { id: 'god', name: 'มาตรวัดพลังพระเจ้า', note: 'ไม่มีหน่วย มีแต่ศรัทธา', min: 1e27, max: 1e45, ticks: [1e27, 1e33, 1e40, 1e45], arc: ['#ffffff', '#a855f7', '#000000'] },
]

export const meterFor = (w) => METERS.find((m) => w <= m.max) ?? METERS[METERS.length - 1]

export function meterAngle(w, m) {
  const p = (Math.log(Math.max(w, m.min)) - Math.log(m.min)) / (Math.log(m.max) - Math.log(m.min))
  return -90 + 180 * Math.min(1, Math.max(0, p))
}
