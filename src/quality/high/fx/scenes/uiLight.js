import { toCanvas } from 'html-to-image'

// WebGL cannot sample live HTML. Keep one flat, styled image of the result;
// its position/rotation/scroll are separate uniforms, updated every frame.
// This is a light source for Gargantua, never a replacement for the DOM card.
const fontFiles = new Map()
async function embeddedFonts(el) {
  const families = new Set()
  for (const node of [el, ...el.querySelectorAll('*')]) {
    getComputedStyle(node).fontFamily.split(',').forEach(name => families.add(name.trim().replace(/["']/g, '')))
  }
  const sheets = await Promise.all([...document.styleSheets].map(async sheet => {
    try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n') }
    catch {
      if (!sheet.href) return ''
      try {
        const res = await fetch(sheet.href, { signal: AbortSignal.timeout(4000) })
        return res.ok ? await res.text() : ''
      } catch { return '' }
    }
  }))
  const rules = sheets.join('\n').match(/@font-face\s*\{[^}]*\}/g) || []
  const embedded = await Promise.all(rules.map(async rule => {
    const family = rule.match(/font-family:\s*([^;]+);/)?.[1].trim().replace(/["']/g, '')
    if (!families.has(family)) return ''
    const urls = [...rule.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)]
    for (const [expression, url] of urls) {
      if (!fontFiles.has(url)) fontFiles.set(url, (async () => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
          if (!res.ok) return null
          const blob = await res.blob()
          return await new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
          })
        } catch { return null }
      })())
      const data = await fontFiles.get(url)
      if (!data) return '' // fall back to the same system fonts as the page
      rule = rule.replace(expression, `url("${data}")`)
    }
    return rule
  }))
  return embedded.join('\n')
}

export function createUiLight(uiRef, onImage) {
  let el = null, dead = false, busy = false, dirty = false, timer = null
  let fontCSS = '', revision = 0
  const mark = () => {
    dirty = true
    if (!busy && !timer && !dead) timer = setTimeout(capture, 120)
  }
  const mutations = new MutationObserver(mark)
  const sizes = new ResizeObserver(mark)
  async function capture() {
    timer = null
    if (dead || busy || !el || !dirty) return
    dirty = false
    busy = true
    const target = el
    const width = target.offsetWidth
    const height = Math.max(target.offsetHeight, target.scrollHeight + target.offsetHeight - target.clientHeight)
    const scale = Math.min(1, 2048 / Math.max(width, height))
    try {
      const image = await toCanvas(target, {
        width, height, pixelRatio: 1, canvasWidth: Math.round(width * scale), canvasHeight: Math.round(height * scale),
        fontEmbedCSS: fontCSS,
        style: {
          position: 'relative', left: '0', top: '0', right: 'auto', bottom: 'auto', margin: '0',
          transform: 'none', filter: 'none', maskImage: 'none', webkitMaskImage: 'none',
          opacity: '1', animation: 'none', maxHeight: 'none', overflow: 'hidden', boxShadow: 'none',
        },
      })
      if (!dead && target === el) {
        onImage(image, width, height)
        el.dataset.uiLight = String(++revision)
      }
    } catch (error) {
      // A capture failure must not interrupt the black-hole scene or its controls.
      if (!dead) console.warn('L7 UI light capture unavailable', error)
    } finally {
      busy = false
      if (dirty && !dead) mark()
    }
  }
  function attach(target) {
    mutations.disconnect()
    sizes.disconnect()
    el?.removeEventListener('scroll', repaint)
    if (el) delete el.dataset.uiLight
    el = target
    if (!el) return
    // Orbit writes style attributes at 60 Hz: deliberately observe only content.
    mutations.observe(el, { childList: true, characterData: true, subtree: true })
    sizes.observe(el)
    el.addEventListener('scroll', repaint, { passive: true })
    mark()
    const source = el
    embeddedFonts(el).then(css => {
      if (dead || source !== el) return
      fontCSS = css
      mark()
    })
    document.fonts.ready.then(() => { if (!dead && source === el) mark() })
  }
  // The scene mounts before the result. Call sync even while its ref is null.
  const repaint = () => onImage(null)
  return {
    sync() {
      const target = uiRef?.current || null
      if (target !== el) attach(target)
      return el
    },
    dispose() {
      dead = true
      clearTimeout(timer)
      mutations.disconnect()
      sizes.disconnect()
      el?.removeEventListener('scroll', repaint)
      if (el) delete el.dataset.uiLight
    },
  }
}
