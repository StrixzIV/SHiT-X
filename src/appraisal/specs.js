// Reads whatever the browser admits about the device, then guesses how big
// its power brick is. Browsers never expose real wattage, so the GPU / CPU
// class decides it, and a live charge-rate reading can only raise it.
// `raw` keeps every source string so the dev panel can show what was seen.
import { androidBrand, appleModel, detectBrowser, specialDevice } from './devices.js'

export async function readSpecs() {
  const ua = navigator.userAgent
  const dpr = devicePixelRatio || 1
  const s = {
    cores: navigator.hardwareConcurrency ?? null,
    memory: navigator.deviceMemory ?? null,
    screen: { w: Math.round(screen.width * dpr), h: Math.round(screen.height * dpr), dpr, hz: null, extended: screen.isExtended ?? null },
    gpu: null,
    gpuArch: null,
    gpuVendor: null,
    mobile: /Android|iPhone|iPad|Mobile/i.test(ua),
    platform: platformFromUA(ua),
    browser: detectBrowser(ua).label,
    brand: null,
    apple: null,
    special: null,
    model: null,
    arch: null,
    battery: null,
    form: null,
    raw: { ua },
  }

  // WebGL with the high-performance hint so hybrid laptops report the dGPU, not the iGPU
  const gl = webglRenderer()
  s.raw.webgl = gl
  s.gpu = cleanGpu(gl)

  const [hi, gpu, bat, hz] = await Promise.all([
    // Android WebView (LINE / Facebook / IG in-app) has userAgentData but no getHighEntropyValues.
    typeof navigator.userAgentData?.getHighEntropyValues === 'function'
      ? navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion', 'architecture', 'bitness', 'formFactors']).catch(() => null)
      : null,
    webgpuInfo(),
    navigator.getBattery?.().catch(() => null),
    refreshRate(),
  ])

  if (s.platform.startsWith('iOS') || s.platform.startsWith('iPadOS')) {
    s.mobile = true
    s.apple = appleModel()
    s.model = s.apple?.model ?? null
  }
  if (hi) {
    s.raw.uach = hi
    if (hi.platform) s.platform = osName(hi.platform, hi.platformVersion)
    s.model = hi.model || s.model
    s.arch = hi.architecture ? `${hi.architecture}${hi.bitness ? `-${hi.bitness}` : ''}` : null
    s.mobile = s.mobile || !!hi.mobile
  }
  // Android WebViews / Firefox: no UA-CH, but older-style UAs still carry "Android 13; <model> Build/"
  const av = ua.match(/Android (\d+)/)
  if (av && !hi?.platformVersion) s.platform = `Android ${av[1]}`
  const am = ua.match(/Android [\d.]+; ([^;)]+?)(?: Build\/|\))/)
  if (!s.model && am && am[1] !== 'K' && !/^(Mobile|Tablet|wv)$/.test(am[1])) s.model = am[1].trim()
  // Firefox reports a generic bucket ("GeForce GTX 980, or similar"), Safari always "Apple GPU",
  // and Safari clamps hardwareConcurrency to 4 or 8 — flag them so the UI doesn't overclaim.
  s.gpuMasked = /, or similar$|^Generic Renderer$|^Apple GPU$/i.test(s.gpu ?? '')
  s.coresClamped = detectBrowser(ua).engine === 'WebKit'
  s.brand = androidBrand(s.model)
  if (s.brand) s.model = `${s.brand.brand} (${s.model})`
  s.special = specialDevice(ua, s.gpu ?? '')
  if (gpu) {
    s.raw.webgpu = gpu
    s.gpuVendor = gpu.vendor || null
    s.gpuArch = gpu.architecture || null
    if (!s.gpu || /swiftshader|llvmpipe|basic render/i.test(s.gpu)) s.gpu = gpu.description || s.gpu
  }
  if (bat) s.battery = { level: bat.level, charging: bat.charging, chargingTime: bat.chargingTime, dischargingTime: bat.dischargingTime }
  s.screen.hz = hz

  // A battery that isn't full, or is discharging, means a portable machine.
  const hasBattery = bat && (bat.level < 1 || !bat.charging || Number.isFinite(bat.dischargingTime))
  s.form = s.special ? s.special.form : s.mobile ? 'มือถือ / แท็บเล็ต' : hasBattery || /laptop|max-q|mobile/i.test(s.gpu ?? '') ? 'โน้ตบุ๊ก' : bat ? 'เดสก์ท็อป หรือโน้ตบุ๊กที่ชาร์จเต็ม' : 'ไม่ทราบ'
  if (s.special && !s.model) s.model = s.special.device
  return s
}

// iOS must be checked before macOS: the iPhone UA says "like Mac OS X".
// iPadOS desktop mode reports MacIntel with touch points.
function platformFromUA(ua) {
  const ios = ua.match(/(iPhone|iPad|iPod).*? OS (\d+)[_.](\d+)/)
  if (ios) return `${ios[1] === 'iPad' ? 'iPadOS' : 'iOS'} ${ios[2]}.${ios[3]}`
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'iPadOS'
  const odd = [[/Nintendo/, 'Nintendo Switch OS'], [/PlayStation/, 'PlayStation OS'], [/Xbox/, 'Xbox OS'], [/Tizen/, 'Tizen (Samsung TV)'], [/Web0S|webOS/, 'webOS (LG TV)'], [/Tesla/, 'Tesla OS']].find(([re]) => re.test(ua))
  if (odd) return odd[1]
  if (/Windows/.test(ua)) return 'Windows'
  if (/Android/.test(ua)) return 'Android'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Mac OS/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'ไม่ทราบ'
}



function webglRenderer() {
  try {
    const gl = document.createElement('canvas').getContext('webgl', { powerPreference: 'high-performance' })
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const raw = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return raw
  } catch {
    return null
  }
}

// "ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 4080 Laptop GPU/PCIe/SSE2, OpenGL 4.5.0)"
// "ANGLE (AMD, AMD Radeon 780M (radeonsi, gfx1103_r1, LLVM 17.0.6), OpenGL 4.6)"
// "ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Laptop GPU (0x00002717) Direct3D11 vs_5_0 ps_5_0, D3D11)"
export function cleanGpu(raw) {
  if (!raw) return null
  let name = raw
  const angle = raw.match(/^ANGLE \((.*)\)$/)
  if (angle) {
    const parts = []
    let depth = 0
    let cur = ''
    for (const ch of angle[1]) {
      if (ch === '(') depth++
      if (ch === ')') depth--
      if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = '' } else cur += ch
    }
    parts.push(cur.trim())
    name = parts[1] ?? parts[0]
  }
  return name
    .replace(/\s*\(0x[0-9a-f]+\)/gi, '')
    .replace(/\s*\((radeonsi|llvm|gfx|rpl|adl|tgl|mtl|lnl|dg2)[^)]*\)/gi, '')
    .replace(/\/PCIe.*$|\s+Direct3D.*$|\s+OpenGL.*$|\s+vs_\d.*$/i, '')
    .replace(/^Mesa\s+|^ANGLE Metal Renderer:\s*/i, '')
    .trim()
}

async function webgpuInfo() {
  try {
    const a = await navigator.gpu?.requestAdapter({ powerPreference: 'high-performance' })
    if (!a) return null
    const i = a.info ?? (await a.requestAdapterInfo?.())
    return i ? { vendor: i.vendor, architecture: i.architecture, device: i.device, description: i.description } : null
  } catch {
    return null
  }
}

function osName(platform, version = '') {
  const major = parseInt(version, 10)
  if (platform === 'Windows') return major >= 13 ? 'Windows 11' : major > 0 ? 'Windows 10' : 'Windows'
  if (platform === 'macOS') return `macOS ${version.split('.').slice(0, 2).join('.')}`
  if (platform === 'Android') return `Android ${major || ''}`.trim()
  return platform || 'ไม่ทราบ'
}

// Median frame interval over ~0.4 s → Hz, snapped to common panel rates.
function refreshRate() {
  return new Promise((resolve) => {
    const times = []
    const step = (t) => {
      times.push(t)
      if (times.length < 25) return requestAnimationFrame(step)
      const d = times.slice(1).map((t2, i) => t2 - times[i]).sort((x, y) => x - y)
      const hz = 1000 / d[Math.floor(d.length / 2)]
      const snap = [30, 48, 50, 60, 75, 90, 100, 120, 144, 165, 180, 240, 360, 480].reduce((p, c) => (Math.abs(c - hz) < Math.abs(p - hz) ? c : p))
      resolve(Math.abs(snap - hz) < 6 ? snap : Math.round(hz))
    }
    requestAnimationFrame(step)
    setTimeout(() => resolve(null), 1500)
  })
}

// Typical charger for each hardware class. Returns { watts, why }.
export function estimateWatts(s) {
  const g = s.gpu ?? ''
  const laptop = /laptop|mobile|max-q/i.test(g) || s.form === 'โน้ตบุ๊ก'
  let best = { watts: s.mobile ? 18 : 65, why: s.mobile ? 'มือถือทั่วไป' : 'โน้ตบุ๊กมาตรฐาน' }
  const consider = (watts, why) => { if (watts > best.watts) best = { watts, why } }

  if (s.special) {
    const measured = measuredWatts(s)
    return { watts: Math.max(s.special.watts, measured ?? 0), why: s.special.why, measured }
  }

  if (s.mobile) {
    if (s.apple) consider(s.apple.watts, s.apple.watts >= 27 ? `${s.apple.model.split(' (')[0]} ชาร์จเร็ว` : s.apple.model.split(' (')[0])
    else if (/Apple/i.test(g) || /^i(OS|PadOS)/.test(s.platform)) consider(20, 'อุปกรณ์ Apple')
    if (s.brand) consider(s.brand.watts, `${s.brand.brand} ชาร์จเร็ว`)
    if (/Adreno.*\b(7[3-9]\d|8\d\d)\b|Immortalis|Xclipse 9/i.test(g)) consider(45, 'มือถือเรือธง')
    else if (/Adreno|Mali|PowerVR|Xclipse/i.test(g)) consider(25, 'มือถือ Android')
  } else {
    const rtx = !s.gpuMasked && g.match(/RTX\s*A?(\d{1,2})(\d{2})/i)
    if (s.gpuMasked && /GeForce|NVIDIA/i.test(g)) consider(laptop ? 180 : 450, 'การ์ดจอแยก NVIDIA (เบราว์เซอร์ซ่อนรุ่นจริง)')
    else if (rtx) {
      const t = +rtx[2]
      if (laptop) consider(t >= 80 ? 280 : t >= 70 ? 230 : t >= 60 ? 200 : 150, `RTX ${rtx[1]}${rtx[2]} Laptop`)
      else consider(t >= 90 ? 1000 : t >= 80 ? 850 : t >= 70 ? 750 : 650, `เดสก์ท็อป RTX ${rtx[1]}${rtx[2]} (PSU)`)
    } else if (/GTX|Quadro|RTX/i.test(g)) consider(laptop ? 180 : 550, 'การ์ดจอแยก NVIDIA')
    if (!s.gpuMasked && /Radeon\s*(RX|Pro)\s*\d/i.test(g)) consider(laptop ? 230 : 800, 'การ์ดจอแยก AMD')
    if (!s.gpuMasked && /Arc\s*A\d{3}/i.test(g)) consider(laptop ? 150 : 600, 'Intel Arc แยก')
    if (/Apple M\d\s*Ultra/i.test(g)) consider(480, 'Mac Studio Ultra')
    else if (/Apple M\d\s*Max/i.test(g)) consider(140, 'MacBook Pro Max')
    else if (/Apple M\d\s*Pro/i.test(g)) consider(96, 'MacBook Pro')
    else if (/Apple/i.test(g)) consider(70, 'Mac ชิป M')
    // WebGL can still show the iGPU on hybrid laptops; WebGPU's vendor/arch gives the dGPU away
    if (s.gpuVendor === 'nvidia' && !/nvidia|geforce|rtx|gtx/i.test(g)) {
      const newGen = /blackwell|lovelace|ada|ampere/i.test(s.gpuArch ?? '')
      consider(laptop ? (newGen ? 230 : 180) : newGen ? 750 : 550, `การ์ดจอแยก NVIDIA ${s.gpuArch ?? ''}`.trim())
    }
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
  const mp = (s.screen.w * s.screen.h) / 1e6
  return Math.round((s.cores ?? 4) * 10 + (s.memory ?? 4) * 8 + mp * 10 + (s.screen.hz ?? 60) / 2)
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
