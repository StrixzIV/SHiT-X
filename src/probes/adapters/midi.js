// Web MIDI: USB keyboards, pads and DJ controllers. Every note you play adds chips.
import { FIREFOX_ADDON, HTTPS, insecure } from '../why.js'

export default function midi() {
  let access, update
  let notes = 0

  const refresh = () => {
    if (!access) return
    const ins = [...access.inputs.values()].filter((p) => p.state === 'connected')
    ins.forEach((p) => {
      p.onmidimessage = (e) => {
        if ((e.data[0] & 0xf0) === 0x90 && e.data[2] > 0) {
          notes++
          update({ reading: 128 + notes * 10, detail: `${ins[0].name} · เล่นไป ${notes} โน้ต` })
        }
      }
    })
    update({
      armed: true,
      live: ins.length > 0,
      reading: ins.length ? 128 + notes * 10 : 0,
      detail: ins.length ? `${ins.map((p) => p.name).join(', ').slice(0, 40)} · กดโน้ตเพื่อเพิ่มชิป` : 'ยังไม่พบอุปกรณ์ MIDI',
    })
  }

  const open = async () => {
    access = await navigator.requestMIDIAccess()
    access.onstatechange = refresh
    refresh()
  }

  return {
    id: 'midi',
    name: 'เครื่องดนตรี MIDI',
    label: 'คีย์บอร์ดดนตรีหรือคอนโทรลเลอร์ USB',
    port: 'USB-C',
    mult: 2,
    hint: `แตะเพื่ออนุญาต MIDI${FIREFOX_ADDON}`,
    support: () =>
      'requestMIDIAccess' in navigator
        ? { ok: true }
        : { ok: false, why: insecure ? HTTPS : 'Web MIDI มีใน Chrome / Edge / Opera / Android และ Firefox 108+ บนคอม (Safari / iOS ไม่มี)' },
    start(u) {
      update = u
      // Already granted earlier → reconnect silently.
      navigator.permissions?.query({ name: 'midi' }).then((p) => p.state === 'granted' && open()).catch(() => {})
      return () => {
        if (access) access.onstatechange = null
        access = undefined
      }
    },
    async arm(u) {
      update = u
      await open()
    },
  }
}
