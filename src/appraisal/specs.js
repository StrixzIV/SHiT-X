// Reads whatever the browser admits about the device, then guesses how big
// its power brick is. Browsers never expose real wattage, so the GPU / CPU
// class decides it, and a live charge-rate reading can only raise it.

export async function readSpecs() {
  const ua = navigator.userAgent
  const s = {
    cores: navigator.hardwareConcurrency ?? null,
    memory: navigator.deviceMemory ?? null,
    screen: { w: screen.width, h: screen.height, dpr: devicePixelRatio },
    gpu: gpuName(),
    mobile: /Android|iPhone|iPad|Mobile/i.test(ua),
    platform: /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'ไม่ทราบ',
    model: null,
    arch: null,
    battery: null,
  }
  try {
    const hi = await navigator.userAgentData?.getHighEntropyValues(['model', 'platform', 'platformVersion', 'architecture', 'bitness'])
    if (hi) {
      s.platform = `${hi.platform} ${hi.platformVersion ?? ''}`.trim()
      s.model = hi.model || null
      s.arch = hi.architecture ? `${hi.architecture}${hi.bitness ? `-${hi.bitness}` : ''}` : null
      s.mobile = hi.mobile ?? s.mobile
    }
  } catch { /* not Chromium */ }
  try {
    const b = await navigator.getBattery?.()
    if (b) s.battery = { level: b.level, charging: b.charging, chargingTime: b.chargingTime }
  } catch { /* blocked */ }
  return s
}

function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const raw = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Laptop GPU (0x..) Direct3D11 ..., D3D11)" → the GPU name
    const angle = raw.match(/^ANGLE \((.*)\)$/)
    const name = angle ? angle[1].split(', ')[1] ?? angle[1] : raw
    return name.replace(/\s*\(0x[0-9a-f]+\)/i, '').replace(/\s*(Direct3D|OpenGL|\/PCIe|, ).*$/, '').trim()
  } catch {
    return null
  }
}

// Typical charger for each hardware class. Returns { watts, why }.
export function estimateWatts(s) {
  const g = s.gpu ?? ''
  const laptop = /laptop|mobile|max-q/i.test(g)
  let best = { watts: s.mobile ? 18 : 65, why: s.mobile ? 'มือถือทั่วไป' : 'โน้ตบุ๊กมาตรฐาน' }
  const consider = (watts, why) => { if (watts > best.watts) best = { watts, why } }

  if (s.mobile) {
    if (/Apple/i.test(g)) consider(Math.min(s.screen.w, s.screen.h) >= 744 ? 35 : 20, 'อุปกรณ์ Apple พกพา')
    if (/Adreno.*\b(7[3-9]\d|8\d\d)\b|Immortalis|Xclipse 9/i.test(g)) consider(45, 'มือถือเรือธง')
    else if (/Adreno|Mali|PowerVR|Xclipse/i.test(g)) consider(25, 'มือถือ Android')
  } else {
    const rtx = g.match(/RTX\s*A?(\d{1,2})(\d{2})/i)
    if (rtx) {
      const t = +rtx[2]
      if (laptop) consider(t >= 80 ? 280 : t >= 70 ? 230 : t >= 60 ? 200 : 150, `RTX ${rtx[1]}${rtx[2]} Laptop`)
      else consider(t >= 90 ? 1000 : t >= 80 ? 850 : t >= 70 ? 750 : 650, `เดสก์ท็อป RTX ${rtx[1]}${rtx[2]} (PSU)`)
    } else if (/GTX|Quadro|RTX/i.test(g)) consider(laptop ? 180 : 550, 'การ์ดจอแยก NVIDIA')
    if (/Radeon\s*(RX|Pro)\s*\d/i.test(g)) consider(laptop ? 230 : 800, 'การ์ดจอแยก AMD')
    if (/Arc\s*A\d{3}/i.test(g)) consider(laptop ? 150 : 600, 'Intel Arc แยก')
    if (/Apple M\d\s*Ultra/i.test(g)) consider(480, 'Mac Studio Ultra')
    else if (/Apple M\d\s*Max/i.test(g)) consider(140, 'MacBook Pro Max')
    else if (/Apple M\d\s*Pro/i.test(g)) consider(96, 'MacBook Pro')
    else if (/Apple/i.test(g)) consider(70, 'Mac ชิป M')
    if (s.cores >= 24) consider(280, `CPU ${s.cores} เธรด (คลาส HX)`)
    else if (s.cores >= 16) consider(140, `CPU ${s.cores} เธรด`)
  }

  const measured = measuredWatts(s)
  if (measured) consider(measured, 'วัดจากอัตราชาร์จจริง')
  return { ...best, measured }
}

// Charge rate → watts, assuming a typical battery size for the form factor.
export function measuredWatts(s) {
  const b = s.battery
  if (!b?.charging || !Number.isFinite(b.chargingTime) || b.chargingTime <= 0 || b.level >= 1) return null
  const wh = s.mobile ? 17 : 80
  return Math.round(((wh * (1 - b.level)) / (b.chargingTime / 3600)) * 1.15)
}

export function specBonus(s) {
  const mp = (s.screen.w * s.screen.h * s.screen.dpr ** 2) / 1e6
  return Math.round((s.cores ?? 4) * 10 + (s.memory ?? 4) * 8 + mp * 10)
}

export const WATT_CHOICES = [5, 10, 20, 45, 65, 100, 140, 240, 280, 330, 500, 1000, 3000, 25000, 5e6, 1.21e9, 1e12, 1e17, 3.8e26, 1e42]

// Fibonacci multipliers; past SSS it stops pretending to be a charger.
export const TIERS = [
  { id: 'Ω', cls: 'omega', min: 1e40, mult: 9999, title: 'ผู้สร้างจักรวาล', remark: 'ท่านไม่ได้ใช้ไฟฟ้า ไฟฟ้าใช้ท่าน' },
  { id: 'K-II', cls: 'k2', min: 3.8e26, mult: 987, title: 'อารยธรรมกินดวงอาทิตย์ (Kardashev II)', remark: 'หัวชาร์จของท่านคือทรงกลมไดสันรอบดวงอาทิตย์' },
  { id: 'K-I', cls: 'k1', min: 1e16, mult: 610, title: 'เจ้าของดาวเคราะห์ (Kardashev I)', remark: 'พลังงานทั้งโลกถูกใช้ชาร์จมือถือของท่านเครื่องเดียว' },
  { id: 'TW', cls: 'tw', min: 1e12, mult: 377, title: 'ดวงอาทิตย์พกพา', remark: 'การไฟฟ้าทั้งประเทศขอสมัครเป็นลูกน้องท่าน' },
  { id: 'GW', cls: 'gw', min: 1e9, mult: 233, title: '1.21 จิกะวัตต์!', remark: 'Great Scott! ท่านย้อนเวลากลับไปก่อนน้ำท่วมได้แล้ว' },
  { id: 'MW', cls: 'mw', min: 1e6, mult: 144, title: 'เจ้าของเขื่อนส่วนตัว', remark: 'เขื่อนภูมิพลส่งการ์ดวันเกิดให้ท่านทุกปี' },
  { id: 'kW', cls: 'kw', min: 1e4, mult: 89, title: 'เครื่องปั่นไฟงานวัด', remark: 'ท่านเปิดลำโพงหมอลำได้ทั้งตำบลจากรูชาร์จ' },
  { id: 'SSSS', cls: 'ssss', min: 2000, mult: 55, title: 'หม้อหุงข้าว 10 ใบพร้อมกัน', remark: 'ปลั๊กพ่วงในบ้านท่านละลายไปแล้ว 3 อัน' },
  { id: 'SSS', cls: 'sss', min: 600, mult: 21, title: 'โรงไฟฟ้าส่วนบุคคล', remark: 'ท่านไม่ได้มาตรวจไฟรั่ว ท่านคือต้นเหตุของไฟรั่ว' },
  { id: 'SS', cls: 'ss', min: 330, mult: 13, title: 'มหาเศรษฐีพลังงาน', remark: 'การไฟฟ้าส่งกระเช้าปีใหม่ให้ท่านทุกปี' },
  { id: 'S', cls: 's', min: 200, mult: 8, title: 'ชนชั้นปกครองแห่งปลั๊กพ่วง', remark: 'หัวชาร์จของท่านหนักกว่าแมวของคนทั่วไป' },
  { id: 'A', cls: 'a', min: 100, mult: 5, title: 'ผู้ดีมีวัตต์', remark: 'น่านับถือ แต่ยังไม่ได้นั่งโต๊ะเดียวกับระดับ S' },
  { id: 'B', cls: 'b', min: 61, mult: 3, title: 'ชนชั้นกลางสาย USB-C', remark: '65W คือค่าเฉลี่ยของคนธรรมดา ซึ่งก็คือท่าน' },
  { id: 'C', cls: 'c', min: 30, mult: 2, title: 'ผู้ใช้ทั่วไป', remark: 'ระบบยินดีให้บริการ ด้วยความอดทน' },
  { id: 'D', cls: 'd', min: 10, mult: 1.5, title: 'ผู้ชาร์จช้า', remark: 'กรุณาใช้ทางเข้าด้านหลัง' },
  { id: 'F', cls: 'f', min: 0, mult: 1, title: 'สามัญชน 5 วัตต์', remark: 'อุปกรณ์ของท่านไม่ผ่านเกณฑ์ความหรูหรา แต่เราจะตรวจให้เพราะสงสาร' },
]

export const tierFor = (watts) => TIERS.find((t) => watts >= t.min)
