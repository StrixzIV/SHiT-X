// Gamepad API: USB-C controllers work even on iOS Safari.
// The analog sticks double as an analog voltmeter.
export default function gamepad() {
  return {
    id: 'gamepad',
    name: 'จอยเกม',
    label: 'จอยที่เสียบสาย (กดปุ่มหนึ่งครั้ง)',
    port: 'USB-C',
    mult: 2,
    flavor: 'โยกก้าน = ไฟรั่วมากขึ้น',
    hint: 'เสียบจอยแล้วกดปุ่มใดก็ได้',
    support: () => ('getGamepads' in navigator ? { ok: true } : { ok: false, why: 'ไม่มี Gamepad API' }),
    start(update) {
      let last = ''
      const poll = () => {
        const pads = [...navigator.getGamepads()].filter(Boolean)
        const p = pads[0]
        const reading = p
          ? 100 + Math.round(p.axes.reduce((s, a) => s + Math.abs(a), 0) * 400) +
            p.buttons.filter((b) => b.pressed).length * 50
          : 0
        const next = { live: !!p, reading, detail: p ? p.id.slice(0, 40) : 'ไม่พบจอย' }
        const key = JSON.stringify(next)
        if (key !== last) {
          last = key
          update(next)
        }
      }
      const t = setInterval(poll, 120)
      window.addEventListener('gamepadconnected', poll)
      window.addEventListener('gamepaddisconnected', poll)
      return () => {
        clearInterval(t)
        window.removeEventListener('gamepadconnected', poll)
        window.removeEventListener('gamepaddisconnected', poll)
      }
    },
  }
}
