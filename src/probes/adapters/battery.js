// Battery Status API: "charging" flips true when a USB-C charger is plugged in,
// which iLeak interprets as the flood water feeding the cable.
// Some browsers (e.g. Chrome on Linux via UPower) drop `chargingchange`, so we
// also poll the properties (4×/s, cheap: only changes re-render), re-acquire
// the manager every 1.5 s and on focus, and expose refresh().
import { detectBrowser } from '../../appraisal/devices.js'

function unsupportedWhy() {
  const b = detectBrowser()
  if (b.ios) return 'iPhone/iPad ไม่บอกสถานะชาร์จให้เว็บ (ทุกเบราว์เซอร์บน iOS ใช้ WebKit เหมือน Safari)'
  if (!window.isSecureContext) return 'ต้องเปิดผ่าน https หรือ localhost ถึงจะอ่านแบตได้'
  if (b.inApp) return `แอป ${b.inApp} ไม่ให้เว็บอ่านแบต — เปิดในเบราว์เซอร์จริง`
  if (b.engine === 'Gecko') return 'Firefox ถอด Battery API ออกไปแล้ว'
  return `${b.name} ไม่บอกสถานะชาร์จให้เว็บ`
}

export default function battery() {
  let bat, update, last
  let gen = 0

  const read = () => {
    if (!bat) return
    const next = {
      live: bat.charging,
      reading: bat.charging ? 220 : 0,
      level: bat.level,
      detail: `แบต ${Math.round(bat.level * 100)}% · ${bat.charging ? 'ไฟเข้า!' : 'ไม่ได้ชาร์จ'}`,
    }
    const key = JSON.stringify(next)
    if (key !== last) {
      last = key
      update(next)
    }
  }

  const attach = (b) => {
    if (b === bat) return
    bat?.removeEventListener('chargingchange', read)
    bat?.removeEventListener('levelchange', read)
    bat = b
    b.addEventListener('chargingchange', read)
    b.addEventListener('levelchange', read)
  }

  const acquire = () => {
    const my = gen
    return navigator.getBattery().then((b) => {
      if (my !== gen) return
      attach(b)
      read()
    }).catch(() => update({ supported: false, detail: 'Battery API ถูกบล็อก' }))
  }

  return {
    id: 'battery',
    name: 'สายชาร์จ',
    label: 'ตรวจว่าเครื่องกำลังชาร์จอยู่',
    port: 'USB-C',
    xmult: 2,
    flavor: 'ชาร์จเข้า = น้ำมีไฟ',
    support: () =>
      navigator.brave
        ? { ok: false, why: 'Brave ปลอมค่าแบตเพื่อความเป็นส่วนตัว — ติ๊กยืนยันเอง' }
        : 'getBattery' in navigator
          ? { ok: true }
          : { ok: false, why: unsupportedWhy() },
    start(u) {
      update = u
      gen++
      acquire()
      const poll = setInterval(read, 250)
      const reacquire = setInterval(acquire, 1500)
      const onVisible = () => document.visibilityState === 'visible' && acquire()
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('focus', acquire)
      return () => {
        window.removeEventListener('focus', acquire)
        gen++
        clearInterval(poll)
        clearInterval(reacquire)
        document.removeEventListener('visibilitychange', onVisible)
        bat?.removeEventListener('chargingchange', read)
        bat?.removeEventListener('levelchange', read)
        bat = undefined
        last = undefined
      }
    },
    refresh(u) {
      update = u
      last = undefined
      return acquire()
    },
  }
}
