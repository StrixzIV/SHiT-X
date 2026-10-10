// Audio input: the most universal wired interface. Works on iOS too.
// A wired headset / USB-C audio dongle / bare TRRS plug with two wires in the
// water changes the mic signal; the iLeak Probe can also send a tone (freq ∝ volts).
const WIRED = /usb|type-?c|headset|wired|external|line|jack|earpods|earphone|3\.5|หูฟัง/i
const USB = /usb|type-?c/i

export default function audio() {
  let stream, ctx, timer, update

  function stop() {
    clearInterval(timer)
    stream?.getTracks().forEach((t) => t.stop())
    ctx?.close().catch(() => {})
    stream = ctx = undefined
  }

  async function listen() {
    stop()
    const base = { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    stream = await navigator.mediaDevices.getUserMedia({ audio: base })
    const inputs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput')
    const wired = inputs.find((d) => WIRED.test(d.label))
    if (wired && stream.getAudioTracks()[0]?.getSettings().deviceId !== wired.deviceId) {
      stream.getTracks().forEach((t) => t.stop())
      stream = await navigator.mediaDevices.getUserMedia({ audio: { ...base, deviceId: { exact: wired.deviceId } } })
    }
    const label = stream.getAudioTracks()[0]?.label || 'ไมค์'
    const isWired = WIRED.test(label)
    const viaUsb = USB.test(label)

    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    const an = ctx.createAnalyser()
    an.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(an)
    const time = new Float32Array(an.fftSize)
    const freq = new Float32Array(an.frequencyBinCount)
    const binHz = ctx.sampleRate / an.fftSize

    timer = setInterval(() => {
      an.getFloatTimeDomainData(time)
      an.getFloatFrequencyData(freq)
      const rms = Math.sqrt(time.reduce((s, v) => s + v * v, 0) / time.length)
      let peak = -Infinity, at = 0
      for (let i = Math.floor(300 / binHz); i < Math.min(freq.length, 8000 / binHz); i++) {
        if (freq[i] > peak) { peak = freq[i]; at = i * binHz }
      }
      const tone = peak > -30
      update({
        armed: true,
        live: isWired || tone,
        port: viaUsb ? 'USB-C' : '3.5mm',
        xmult: viaUsb ? 2 : undefined,
        mult: viaUsb ? undefined : 4,
        reading: Math.round(rms * 2000) + (tone ? Math.round(at / 10) : 0),
        detail: `${label.slice(0, 28)} · ${tone ? `โทน ${Math.round(at)} Hz` : `rms ${rms.toFixed(3)}`}${isWired || tone ? '' : ' (ไมค์ในตัว ไม่นับ)'}`,
      })
    }, 120)
  }

  return {
    id: 'audio',
    name: 'Jack Joker',
    label: 'แจ็คหูฟัง / USB-C audio',
    port: '3.5mm',
    mult: 4,
    flavor: 'ขั้วไมค์ 2 ขา จุ่มน้ำได้',
    hint: 'แตะเพื่อเปิดไมค์',
    support: () =>
      navigator.mediaDevices?.getUserMedia ? { ok: true } : { ok: false, why: 'ต้องเปิดผ่าน HTTPS ถึงจะใช้ไมค์ได้' },
    start(u) {
      update = u
      const onChange = () => stream && listen().catch(() => {})
      navigator.mediaDevices.addEventListener?.('devicechange', onChange)
      return () => {
        navigator.mediaDevices.removeEventListener?.('devicechange', onChange)
        stop()
      }
    },
    async arm(u) {
      update = u
      await listen()
    },
  }
}
