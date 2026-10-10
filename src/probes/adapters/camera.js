// External webcam / capture card. Built-in cameras don't count.
const EXTERNAL = /usb|webcam|logi|brio|c9\d\d|elgato|cam link|capture|external|obs|razer|anker|insta360|obsbot/i
const BUILTIN = /integrated|built-?in|facetime|front|back|rear|ir camera|virtual/i

export default function camera() {
  let update, granted = false

  const refresh = async () => {
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput')
    const ext = cams.find((d) => EXTERNAL.test(d.label) && !BUILTIN.test(d.label))
    update({
      armed: granted,
      live: !!ext,
      reading: ext ? 1080 : 0,
      detail: ext ? `${ext.label.slice(0, 36)} (1080 ชิป เพราะ 1080p)` : `กล้อง ${cams.length} ตัว แต่เป็นกล้องในตัวทั้งหมด`,
    })
  }

  return {
    id: 'camera',
    name: 'กล้อง USB',
    label: 'เว็บแคมหรือการ์ดแคปเจอร์ที่เสียบสาย',
    port: 'USB-C',
    mult: 2,
    hint: 'แตะเพื่อเช็กกล้อง (ปิดทันที ไม่บันทึก)',
    support: () =>
      navigator.mediaDevices?.getUserMedia ? { ok: true } : { ok: false, why: 'ต้องเปิดผ่าน https ถึงจะเช็กกล้องได้' },
    start(u) {
      update = u
      const onChange = () => granted && refresh().catch(() => {})
      navigator.mediaDevices.addEventListener?.('devicechange', onChange)
      return () => navigator.mediaDevices.removeEventListener?.('devicechange', onChange)
    },
    async arm(u) {
      update = u
      // Permission only unlocks device labels; the stream is stopped straight away.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      granted = true
      await refresh()
    },
  }
}
