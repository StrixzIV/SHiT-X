import { useEffect, useRef } from 'react'
import { getRetro, useRetro } from '../../retro.js'
import { createRetroGL } from './retroGL.js'

// Runs a low-poly scene on the returned canvas ref. `build(r)` sets the scene up
// once and returns `frame(t, dt)`; t is the scene clock, which keeps running
// when the PS1/PS2 switch flips (only the look changes).
export function useRetroGL(build) {
  const ref = useRef(null)
  const gl = useRef(null)
  const buildRef = useRef(build)
  const mode = useRetro()
  useEffect(() => {
    buildRef.current = build
  })

  useEffect(() => {
    const r = createRetroGL(ref.current, getRetro())
    if (!r) return
    gl.current = r
    const frame = buildRef.current(r)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let last = start
    let raf
    const loop = (now) => {
      const t = still ? 2 : Math.max(0, (now - start) / 1000)
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      try {
        frame(t, dt)
      } finally {
        // one bad frame must not stop the scene
        raf = requestAnimationFrame(loop)
      }
    }
    raf = requestAnimationFrame(loop)
    addEventListener('resize', r.resize)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', r.resize)
      r.dispose()
      gl.current = null
    }
  }, [])

  useEffect(() => {
    gl.current?.setMode(mode)
  }, [mode])

  return ref
}
