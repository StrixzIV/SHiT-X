import { HTTPS, browser, insecure } from '../why.js'

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
      support: () =>
        // Android WebView exposes navigator.usb but it does nothing (crbug.com/41441927).
        browser.webview
          ? { ok: false, why: api === 'usb' ? 'เบราว์เซอร์ในแอปมีปุ่ม USB ให้แต่ใช้ไม่ได้จริง — เปิดใน Chrome' : 'เบราว์เซอร์ในแอปไม่มี WebHID — เปิดใน Chrome บนคอม' }
          : api in navigator
            ? { ok: true }
            : { ok: false, why: insecure ? HTTPS : why },
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
  name: 'อุปกรณ์ USB',
  label: 'แฟลชไดรฟ์ ฮับ หรืออะไรก็ได้ที่เสียบ USB',
  api: 'usb',
  xmult: 2,
  why: 'WebUSB มีเฉพาะ Chrome / Edge / Opera / Samsung Internet (Firefox, Safari, iOS ไม่มี)',
  chips: (d) => (d.usbVersionMajor ?? 2) * 100 + (d.usbVersionMinor ?? 0) * 10,
})

export const webhid = makeBus({
  id: 'webhid',
  name: 'คีย์บอร์ด / เมาส์ USB',
  label: 'อุปกรณ์ HID ที่เสียบสาย',
  api: 'hid',
  mult: 3,
  why: 'WebHID มีเฉพาะ Chrome / Edge / Opera บนคอม',
  chips: () => 150,
})
