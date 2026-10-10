// Passive signals that need no permission: each one is a cable being plugged in.

// USB-C → Ethernet dongle (Chrome on Android/ChromeOS reports connection.type).
export function ethernet() {
  const c = navigator.connection
  return {
    id: 'ethernet', name: 'สายแลน', label: 'ต่อผ่านอะแดปเตอร์ USB-C → LAN', port: 'Ethernet', mult: 3,
    flavor: 'Cat6 นำไฟดีกว่า Cat5',
    support: () => (c && 'type' in c ? { ok: true } : { ok: false, why: 'เบราว์เซอร์ไม่บอกชนิดเครือข่าย' }),
    start(update) {
      const on = () => update({ live: c.type === 'ethernet', reading: c.type === 'ethernet' ? 125 : 0, detail: `เครือข่าย: ${c.type}` })
      on()
      c.addEventListener('change', on)
      return () => c.removeEventListener('change', on)
    },
  }
}

// USB-C DisplayPort alt-mode / HDMI: an extra screen appears.
export function display() {
  return {
    id: 'display', name: 'จอนอก', label: 'ต่อจอผ่าน HDMI หรือ USB-C', port: 'USB-C', mult: 2,
    flavor: 'จอเพิ่ม = ไฟเพิ่ม',
    support: () => ('isExtended' in screen ? { ok: true } : { ok: false, why: 'เบราว์เซอร์ไม่รู้จักจอนอก' }),
    start(update) {
      const on = () => update({ live: screen.isExtended, reading: screen.isExtended ? 144 : 0, detail: screen.isExtended ? 'พบจอนอก!' : 'จอเดียว' })
      on()
      screen.addEventListener?.('change', on)
      return () => screen.removeEventListener?.('change', on)
    },
  }
}

// USB-C OTG mouse on a phone: the device gains a fine pointer.
export function otgPointer() {
  const coarse = matchMedia('(pointer: coarse)')
  const fine = matchMedia('(any-pointer: fine)')
  return {
    id: 'otg', name: 'เมาส์บนมือถือ', label: 'เสียบเมาส์เข้ามือถือผ่าน OTG', port: 'USB-C', mult: 1,
    flavor: 'เมาส์ลอยน้ำ',
    support: () => (coarse.matches ? { ok: true } : { ok: false, why: 'เครื่องนี้มีเมาส์อยู่แล้ว (ไม่ใช่มือถือ)' }),
    start(update) {
      const on = () => update({ live: fine.matches, reading: fine.matches ? 50 : 0, detail: fine.matches ? 'พบเมาส์!' : 'ไม่มีเมาส์' })
      on()
      fine.addEventListener('change', on)
      return () => fine.removeEventListener('change', on)
    },
  }
}

// Native shells (Capacitor / Tauri / WebView) push hardware events the web
// can't see — see ARCHITECTURE.md "Native bridge".
export function native() {
  const has = () => !!(window.ILeakNative || window.Capacitor?.isNativePlatform?.())
  return {
    id: 'native', name: 'แอปติดตั้ง', label: 'เฉพาะเวอร์ชันแอป Android / Desktop', port: 'USB-C', xmult: 3,
    flavor: 'ทะลุข้อจำกัดเบราว์เซอร์',
    support: () => (has() ? { ok: true } : { ok: false, why: 'ไม่ได้เปิดผ่านแอป native' }),
    start(update) {
      const on = (e) => {
        const d = e.detail ?? {}
        update({ live: !!d.live, reading: d.reading ?? (d.live ? 220 : 0), port: d.port ?? 'USB-C', detail: d.label ?? d.kind ?? 'native' })
      }
      window.addEventListener('ileak:native', on)
      window.ILeakNative?.ready?.()
      return () => window.removeEventListener('ileak:native', on)
    },
  }
}

// Always available: a placebo toggle for stage demos and unsupported devices.
export function placebo() {
  return {
    id: 'placebo', name: 'ปุ่มจำลอง', label: 'ไม่มีสายก็กดอันนี้', port: 'ใจ', mult: 1,
    flavor: 'ได้ผลถ้าคุณเชื่อ',
    hint: 'แตะเพื่อเปิด/ปิด',
    support: () => ({ ok: true }),
    tap(update, state) {
      const live = !state.live
      update({ armed: true, live, reading: live ? 9 : 0, detail: live ? 'จำลองเสียบสาย (ไฟรั่ว!)' : 'จำลองถอดสาย' })
    },
  }
}
