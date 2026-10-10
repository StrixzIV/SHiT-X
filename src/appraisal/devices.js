// Everything iLeak knows about devices and browsers beyond the GPU/CPU guess.
// Watt figures are each family's typical / fastest stock charger — good enough
// for a tier list, not a spec sheet.

// ───────────── browsers ─────────────

const IN_APP = [
  [/\bLine\//i, 'LINE'],
  [/FB_IAB\/MESSENGER|\bMessenger\b/i, 'Messenger'],
  [/FBAN|FBAV|FB_IAB/i, 'Facebook'],
  [/Instagram/i, 'Instagram'],
  [/musical_ly|BytedanceWebview|TikTok/i, 'TikTok'],
  [/MicroMessenger/i, 'WeChat'],
  [/Twitter|TwitterAndroid/i, 'X (Twitter)'],
  [/Snapchat/i, 'Snapchat'],
  [/; wv\)/, 'แอปบางตัว (Android WebView)'],
]

const BROWSERS = [
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/NintendoBrowser/, 'Nintendo Browser'],
  [/OculusBrowser/, 'Meta Quest Browser'],
  [/Silk\//, 'Amazon Silk'],
  [/YaBrowser\//, 'Yandex'],
  [/UCBrowser\//, 'UC Browser'],
  [/DuckDuckGo\//, 'DuckDuckGo'],
  [/Vivaldi\//, 'Vivaldi'],
  [/OPR\/|OPT\/|Opera/, 'Opera'],
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]

export function detectBrowser(ua = navigator.userAgent) {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const android = /Android/.test(ua)
  const inApp = IN_APP.find(([re]) => re.test(ua))?.[1] ?? null
  let name = BROWSERS.find(([re]) => re.test(ua))?.[1] ?? 'เบราว์เซอร์นี้'
  const brave = !!navigator.brave
  if (brave) name = 'Brave'
  const engine = ios ? 'WebKit' : /Firefox\//.test(ua) ? 'Gecko' : /Chrome\/|Chromium/.test(ua) ? 'Blink' : /Safari\//.test(ua) ? 'WebKit' : '?'
  const label = inApp ? `แอป ${inApp}` : ios && name !== 'Safari' ? `${name} (ไส้ใน WebKit)` : name
  return { name, label, inApp, ios, android, brave, engine }
}

// How to get out of an in-app browser into a real one.
export function escapeInApp(b, href = location.href) {
  if (!b.inApp) return null
  if (b.inApp === 'LINE') {
    const u = new URL(href)
    u.searchParams.set('openExternalBrowser', '1')
    return { href: u.toString(), text: 'เปิดใน Chrome / Safari' }
  }
  if (b.android) {
    const u = new URL(href)
    return { href: `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;end`, text: 'เปิดใน Chrome' }
  }
  return { href: null, text: 'กดปุ่ม ··· หรือ ⋮ แล้วเลือก "เปิดในเบราว์เซอร์"' }
}

// ───────────── special hardware (overrides the GPU guess) ─────────────

const SPECIAL = [
  { re: /Tesla|QtCarBrowser/, device: 'รถ Tesla', form: 'รถยนต์ไฟฟ้า', watts: 250000, why: 'Tesla Supercharger 250 kW' },
  { re: /Xbox Series X/, device: 'Xbox Series X', form: 'เครื่องเกมคอนโซล', watts: 315, why: 'PSU ในตัว Xbox Series X' },
  { re: /Xbox/, device: 'Xbox', form: 'เครื่องเกมคอนโซล', watts: 220, why: 'PSU ในตัว Xbox' },
  { re: /PlayStation 5/, device: 'PlayStation 5', form: 'เครื่องเกมคอนโซล', watts: 350, why: 'PSU ในตัว PS5' },
  { re: /PlayStation/, device: 'PlayStation', form: 'เครื่องเกมคอนโซล', watts: 165, why: 'PSU ในตัว PlayStation' },
  { re: /Nintendo Switch/, device: 'Nintendo Switch', form: 'เครื่องเกมพกพา', watts: 39, why: 'แท่นชาร์จ Switch' },
  { re: /Steam Deck|SteamOS/, gpu: /Custom GPU 040[5-9]|van ?gogh/i, device: 'Steam Deck', form: 'เครื่องเกมพกพา', watts: 45, why: 'หัวชาร์จ Steam Deck' },
  { re: /OculusBrowser|Quest/, device: 'Meta Quest', form: 'แว่น VR', watts: 18, why: 'หัวชาร์จ Quest' },
  { re: /SMART-TV|SmartTV|Tizen|Web0S|webOS|BRAVIA|Android TV|GoogleTV|HbbTV|NetCast|Roku|AppleTV|AFT[A-Z]/i, device: 'สมาร์ททีวี', form: 'ทีวี', watts: 150, why: 'ทีวีจอใหญ่เสียบปลั๊กตลอดเวลา' },
  { re: /Kindle|Silk\//, device: 'Kindle', form: 'เครื่องอ่าน e-book', watts: 9, why: 'หัวชาร์จ Kindle' },
  { re: /Raspbian|Raspberry/, gpu: /V3D|VideoCore|Broadcom/i, device: 'Raspberry Pi', form: 'คอมจิ๋ว', watts: 27, why: 'หัวชาร์จ Raspberry Pi 5' },
  { re: /CrOS/, device: 'Chromebook', form: 'Chromebook', watts: 45, why: 'หัวชาร์จ Chromebook' },
]

export function specialDevice(ua, gpu = '') {
  return SPECIAL.find((d) => d.re.test(ua) || (d.gpu && d.gpu.test(gpu))) ?? null
}

// ───────────── Android brands by model code (UA-CH `model`) ─────────────

const ANDROID = [
  [/^SM-S9\d8/, 'Samsung Galaxy S Ultra', 45],
  [/^SM-S9\d6/, 'Samsung Galaxy S+', 45],
  [/^SM-S9/, 'Samsung Galaxy S', 25],
  [/^SM-F/, 'Samsung Galaxy Z Fold/Flip', 25],
  [/^SM-X9|^SM-X8/, 'Samsung Galaxy Tab S Ultra', 45],
  [/^SM-[XTP]/, 'Samsung Galaxy Tab', 15],
  [/^SM-/, 'Samsung Galaxy', 25],
  [/^Pixel \d+ Pro/i, 'Google Pixel Pro', 30],
  [/^Pixel/i, 'Google Pixel', 27],
  [/Ultra|Pro\+/i, 'มือถือจีนรุ่นท็อป', 120],
  [/^(Xiaomi|Redmi|POCO|Mi )|^2[0-5]\d{2}[A-Z0-9]{3,}/i, 'Xiaomi / Redmi / POCO', 67],
  [/^RMX37(0[89]|1)/, 'realme GT (240 W SUPERDART)', 240],
  [/^RMX/, 'realme', 67],
  [/^(CPH|PH[A-Z]\d{3}|PJ[A-Z]\d{3}|NE\d{4})/, 'OPPO / OnePlus (SUPERVOOC)', 80],
  [/^(V2\d{3}|I2\d{3}|vivo|iQOO)/i, 'vivo / iQOO', 80],
  [/^[A-Z]{3}-(AL|AN|LX|NX|L)\d{1,2}/, 'Huawei / Honor', 66],
  [/^A0\d{2}$/, 'Nothing Phone', 45],
  [/^Infinix/i, 'Infinix', 45],
  [/^TECNO/i, 'TECNO', 33],
  [/^(moto|motorola)/i, 'Motorola', 68],
  [/^XQ-/, 'Sony Xperia', 30],
  [/^ASUS_AI/, 'ASUS ROG Phone', 65],
  [/^Nokia/i, 'Nokia', 18],
]

export function androidBrand(model) {
  if (!model) return null
  const hit = ANDROID.find(([re]) => re.test(model))
  return hit ? { brand: hit[1], watts: hit[2] } : null
}

// ───────────── Apple by portrait screen size in points ─────────────

const APPLE_SCREENS = {
  '375x667@2': ['iPhone SE / 8', 20],
  '375x812@3': ['iPhone X / XS / 11 Pro / mini', 20],
  '414x896@2': ['iPhone XR / 11', 20],
  '414x896@3': ['iPhone XS Max / 11 Pro Max', 20],
  '390x844@3': ['iPhone 12 / 13 / 14', 20],
  '428x926@3': ['iPhone 12–13 Pro Max / 14 Plus', 20],
  '393x852@3': ['iPhone 14 Pro / 15 / 15 Pro / 16', 27],
  '430x932@3': ['iPhone 14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus', 27],
  '402x874@3': ['iPhone 16 Pro / 17 / 17 Pro', 30],
  '440x956@3': ['iPhone 16 Pro Max / 17 Pro Max', 30],
  '420x912@3': ['iPhone Air', 27],
  '744x1133@2': ['iPad mini', 20],
  '810x1080@2': ['iPad 9', 20],
  '820x1180@2': ['iPad Air / iPad 10', 20],
  '834x1194@2': ['iPad Pro 11"', 35],
  '834x1210@2': ['iPad Pro 11" (M4)', 35],
  '1024x1366@2': ['iPad Pro 12.9"', 35],
  '1032x1376@2': ['iPad Pro 13" (M4)', 35],
}

export function appleModel() {
  const w = Math.min(screen.width, screen.height)
  const h = Math.max(screen.width, screen.height)
  const hit = APPLE_SCREENS[`${w}x${h}@${Math.round(devicePixelRatio)}`]
  return hit ? { model: `${hit[0]} (เดาจากขนาดจอ)`, watts: hit[1] } : null
}
