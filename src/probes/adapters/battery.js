// Battery Status API: "charging" flips true when a USB-C charger is plugged in,
// which iLeak interprets as the flood water feeding the cable.
// Some browsers (e.g. Chrome on Linux via UPower) drop `chargingchange`, so we
// also poll the properties, re-acquire the manager, and expose refresh().
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

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
    name: 'Battery Joker',
    label: 'ขั้วชาร์จแบต',
    port: 'USB-C',
    xmult: 2,
    flavor: 'ชาร์จเข้า = น้ำมีไฟ',
    support: () =>
      'getBattery' in navigator
        ? { ok: true }
        : {
            ok: false,
            why: IOS
              ? 'iPhone/iPad ไม่บอกสถานะชาร์จให้เว็บ (Chrome บน iOS ก็ใช้ WebKit เหมือน Safari)'
              : !window.isSecureContext
                ? 'ต้องเปิดผ่าน https หรือ localhost ถึงจะอ่านแบตได้'
                : 'เบราว์เซอร์นี้ไม่บอกสถานะชาร์จ (Safari/Firefox)',
          },
    start(u) {
      update = u
      gen++
      acquire()
      const poll = setInterval(read, 2000)
      const reacquire = setInterval(acquire, 10000)
      const onVisible = () => document.visibilityState === 'visible' && acquire()
      document.addEventListener('visibilitychange', onVisible)
      return () => {
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
