import { useEffect, useRef } from 'react'

// Runs `draw(ctx, { w, h, t, dt })` every frame on a canvas sized to its box.
// `scale` < 1 renders fewer pixels (pixel art / heavy scenes); `fixed` pins an
// exact internal resolution; `size(cssW, cssH) → [w, h]` picks one per box
// (e.g. a 240-pixel-tall Famicom stage as wide as the screen). Pass module-level
// constants for `fixed` / `size`.
export function useCanvas(draw, { scale = 1, fixed, size, contextType = '2d' } = {}) {
  const ref = useRef(null)
  const drawRef = useRef(draw)
  useEffect(() => {
    drawRef.current = draw
  })

  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext(contextType, contextType === '2d' ? undefined : { antialias: false })
    if (!ctx) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      if (fixed) {
        cv.width = fixed[0]
        cv.height = fixed[1]
      } else if (size) {
        const [w, h] = size(cv.clientWidth || 1, cv.clientHeight || 1)
        cv.width = w
        cv.height = h
      } else {
        cv.width = Math.max(1, Math.round(cv.clientWidth * scale))
        cv.height = Math.max(1, Math.round(cv.clientHeight * scale))
      }
    }
    resize()
    addEventListener('resize', resize)
    let raf
    const start = performance.now()
    let last = start
    const frame = (now) => {
      // The first rAF timestamp can predate `start`; never hand scenes a negative t.
      const t = Math.max(0, (now - start) / 1000)
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      try {
        drawRef.current(ctx, { w: cv.width, h: cv.height, t, dt, cv })
      } finally {
        // one bad frame must not stop the scene
        if (!still) raf = requestAnimationFrame(frame)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [scale, fixed, size, contextType])

  return ref
}

// Deterministic pseudo-random (keeps renders pure and scenes repeatable).
export const rand = (i, k = 0) => (((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1) + 1) % 1
