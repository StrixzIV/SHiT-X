// Battery Status API: "charging" flips true when a USB-C charger is plugged in,
// which iLeak interprets as the flood water feeding the cable.
export default function battery() {
  let bat, onChange
  return {
    id: 'battery',
    name: 'Battery Joker',
    label: 'ขั้วชาร์จแบต',
    port: 'USB-C',
    xmult: 2,
    flavor: 'ชาร์จเข้า = น้ำมีไฟ',
    support: () =>
      'getBattery' in navigator
        ? { ok: true }
        : { ok: false, why: 'เบราว์เซอร์นี้ไม่บอกสถานะชาร์จ (Safari/Firefox)' },
    start(update) {
      let dead = false
      navigator.getBattery().then((b) => {
        if (dead) return
        bat = b
        onChange = () =>
          update({
            live: b.charging,
            reading: b.charging ? 220 : 0,
            detail: `แบต ${Math.round(b.level * 100)}% · ${b.charging ? 'ไฟเข้า!' : 'ไม่ได้ชาร์จ'}`,
          })
        onChange()
        b.addEventListener('chargingchange', onChange)
        b.addEventListener('levelchange', onChange)
      }).catch(() => update({ supported: false, detail: 'Battery API ถูกบล็อก' }))
      return () => {
        dead = true
        bat?.removeEventListener('chargingchange', onChange)
        bat?.removeEventListener('levelchange', onChange)
      }
    },
  }
}
