// WebUSB / WebHID: any device you plug into the port counts as a "probe".
// Chips come from the USB spec version, because USB 3.2 is obviously more voltage.
function makeBus({ id, name, label, api, xmult, mult, why, chips }) {
  return () => {
    let update
    const refresh = async () => {
      const devs = await navigator[api].getDevices()
      const d = devs[0]
      update({
        armed: devs.length > 0,
        live: devs.length > 0,
        reading: d ? chips(d) : 0,
        detail: d ? `${d.productName || 'อุปกรณ์ไร้นาม'}${devs.length > 1 ? ` +${devs.length - 1}` : ''}` : 'ยังไม่มีอุปกรณ์',
      })
    }
    return {
      id, name, label, port: 'USB-C', xmult, mult,
      flavor: 'เสียบอะไรก็ได้ เรานับหมด',
      hint: 'แตะเพื่ออนุญาตอุปกรณ์',
      support: () => (api in navigator ? { ok: true } : { ok: false, why }),
      start(u) {
        update = u
        navigator[api].addEventListener('connect', refresh)
        navigator[api].addEventListener('disconnect', refresh)
        refresh()
        return () => {
          navigator[api].removeEventListener('connect', refresh)
          navigator[api].removeEventListener('disconnect', refresh)
        }
      },
      async arm(u) {
        update = u
        await navigator[api].requestDevice({ filters: [] })
        await refresh()
      },
    }
  }
}

export const webusb = makeBus({
  id: 'webusb',
  name: 'Raw USB Joker',
  label: 'อุปกรณ์ USB ใดๆ',
  api: 'usb',
  xmult: 2,
  why: 'ไม่มี WebUSB (iOS/Safari/Firefox)',
  chips: (d) => (d.usbVersionMajor ?? 2) * 100 + (d.usbVersionMinor ?? 0) * 10,
})

export const webhid = makeBus({
  id: 'webhid',
  name: 'HID Joker',
  label: 'คีย์บอร์ด/จอย/อะไรก็ได้',
  api: 'hid',
  mult: 3,
  why: 'ไม่มี WebHID (iOS/Safari/Firefox)',
  chips: () => 150,
})
