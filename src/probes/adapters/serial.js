// Web Serial: the iLeak Probe (our own wired device) streams lines like
// "ILEAK/1 mv=1234" over USB CDC. Any line with a number is accepted.
import { FIREFOX_ADDON, HTTPS, browser, chromeMajor, insecure } from '../why.js'

const BAUD = 115200

export function parseLine(line) {
  const tagged = line.match(/mv=(-?\d+(?:\.\d+)?)/i)
  if (tagged) return Number(tagged[1])
  const bare = line.match(/-?\d+(?:\.\d+)?/)
  return bare ? Number(bare[0]) : null
}

export default function serial() {
  let port, reader, pipe, update
  let gen = 0

  async function close() {
    gen++
    await reader?.cancel().catch(() => {})
    await pipe?.catch(() => {})
    await port?.close().catch(() => {})
    port = reader = pipe = undefined
  }

  async function open(p) {
    await close()
    const my = gen
    port = p
    try {
      await p.open({ baudRate: BAUD })
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        update({ live: false, detail: `เปิดพอร์ตไม่ได้: ${e.message}` })
        return
      }
    }
    const { usbVendorId, usbProductId } = p.getInfo?.() ?? {}
    const id = usbVendorId ? `${hex(usbVendorId)}:${hex(usbProductId)}` : 'serial'
    update({ armed: true, live: true, reading: 0, detail: `probe ${id} ต่อแล้ว รอค่า…` })
    const decoder = new TextDecoderStream()
    pipe = p.readable.pipeTo(decoder.writable)
    reader = decoder.readable.getReader()
    let buf = ''
    while (my === gen) {
      const { value, done } = await reader.read().catch(() => ({ done: true }))
      if (done) break
      buf += value
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const mv = parseLine(buf.slice(0, i))
        buf = buf.slice(i + 1)
        if (mv != null) update({ reading: Math.max(0, Math.round(mv)), detail: `${(mv / 1000).toFixed(2)} V จาก probe ${id}` })
      }
    }
  }

  const onConnect = (e) => open(e.target ?? e.port)
  const onDisconnect = (e) => {
    if ((e.target ?? e.port) === port) {
      close()
      update({ live: false, reading: 0, detail: 'probe หลุด! (หรือจมน้ำไปแล้ว)' })
    }
  }

  return {
    id: 'serial',
    name: 'โพรบ iLeak',
    label: 'อุปกรณ์วัดไฟของเรา ต่อสาย USB',
    port: 'USB-C',
    xmult: 3,
    flavor: 'ESP32/RP2040 + สายไฟ 2 เส้น',
    // Chrome Android 138–147 only lists Bluetooth serial ports; USB arrives in 148.
    hint: `แตะเพื่อเลือกพอร์ต${FIREFOX_ADDON}${browser.android && chromeMajor && chromeMajor < 148 ? ' (Chrome รุ่นนี้เห็นแค่พอร์ต Bluetooth)' : ''}`,
    support: () =>
      browser.webview
        ? { ok: false, why: 'เบราว์เซอร์ในแอปไม่มี Web Serial — เปิดใน Chrome' }
        : 'serial' in navigator
        ? { ok: true }
        : {
            ok: false,
            why: browser.brave
              ? 'Brave ปิด Web Serial ไว้ (เปิดได้ที่ brave://flags)'
              : insecure
                ? HTTPS
                : 'Web Serial มีใน Chrome / Edge / Opera บนคอม, Chrome Android 148+ และ Firefox 151+ บนคอม',
          },
    start(u) {
      update = u
      navigator.serial.addEventListener('connect', onConnect)
      navigator.serial.addEventListener('disconnect', onDisconnect)
      navigator.serial.getPorts().then((ps) => ps[0] && open(ps[0]))
      return () => {
        navigator.serial.removeEventListener('connect', onConnect)
        navigator.serial.removeEventListener('disconnect', onDisconnect)
        close()
      }
    },
    async arm(u) {
      update = u
      await open(await navigator.serial.requestPort())
    },
  }
}

const hex = (n) => n?.toString(16).padStart(4, '0')
