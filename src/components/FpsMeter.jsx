import { useEffect, useState } from 'react'

// Dev stress-test aid: frames per second, sampled every half second.
export default function FpsMeter() {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let raf
    let frames = 0
    let last = performance.now()
    const tick = (now) => {
      frames++
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)))
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div className={`fps ${fps < 30 ? 'bad' : fps < 50 ? 'meh' : ''}`}>{fps} fps</div>
}
