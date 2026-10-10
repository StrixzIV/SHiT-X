import { useEffect, useRef } from 'react'

// Balatro-style swirling paint background: a domain-warped polar swirl,
// rendered at quarter resolution and upscaled with pixelated sampling.
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uSpin;
uniform vec3 uC1, uC2, uC3;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / length(uRes);
  float r = length(uv);
  float a = atan(uv.y, uv.x) + uSpin * (0.08 * uTime - 5.0 * r);
  uv = vec2(cos(a), sin(a)) * r * 30.0;
  vec2 uv2 = vec2(uv.x + uv.y);
  float t = uTime * 1.2;
  for (int i = 0; i < 5; i++) {
    uv2 += sin(max(uv.x, uv.y)) + uv;
    uv += 0.5 * vec2(cos(5.1123 + 0.353 * uv2.y + t * 0.131), sin(uv2.x - 0.113 * t));
    uv -= cos(uv.x + uv.y) - sin(uv.x * 0.711 - uv.y);
  }
  float m = clamp(length(uv) * 0.035 * 1.4, 0.0, 2.0);
  float w1 = max(0.0, 1.0 - 2.0 * abs(1.0 - m));
  float w2 = max(0.0, 1.0 - 2.0 * abs(m));
  float w3 = 1.0 - min(1.0, w1 + w2);
  gl_FragColor = vec4(uC1 * w1 + uC2 * w2 + uC3 * w3, 1.0);
}`

const PALETTES = {
  calm: { spin: 1, c: [[0.05, 0.42, 0.62], [0.0, 0.6, 0.52], [0.04, 0.1, 0.14]] },
  live: { spin: 2, c: [[0.45, 0.2, 0.75], [0.89, 0.32, 0.02], [0.08, 0.05, 0.14]] },
  void: { spin: 9, c: [[0.35, 0.1, 0.6], [0.02, 0.0, 0.05], [0.9, 0.85, 1.0]] },
  leak: { spin: 5, c: [[0.95, 0.18, 0.12], [0.98, 0.65, 0.1], [0.18, 0.02, 0.02]] },
}

export default function SwirlBackground({ mood = 'calm' }) {
  const canvas = useRef(null)
  const target = useRef(PALETTES.calm)
  useEffect(() => {
    target.current = PALETTES[mood] ?? PALETTES.calm
  }, [mood])

  useEffect(() => {
    const cv = canvas.current
    const gl = cv.getContext('webgl', { antialias: false, preserveDrawingBuffer: false })
    if (!gl) return
    const sh = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (n) => gl.getUniformLocation(prog, n)
    const [uRes, uTime, uSpin, uC1, uC2, uC3] = ['uRes', 'uTime', 'uSpin', 'uC1', 'uC2', 'uC3'].map(u)

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const cur = { spin: 1, c: PALETTES.calm.c.map((x) => [...x]) }
    let raf, t = 0, last = performance.now()

    const resize = () => {
      cv.width = Math.ceil(innerWidth / 4)
      cv.height = Math.ceil(innerHeight / 4)
      gl.viewport(0, 0, cv.width, cv.height)
    }
    resize()
    addEventListener('resize', resize)

    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const tg = target.current
      const k = 1 - Math.exp(-dt * 3)
      cur.spin += (tg.spin - cur.spin) * k
      cur.c.forEach((col, i) => col.forEach((v, j) => (col[j] = v + (tg.c[i][j] - v) * k)))
      t += dt * cur.spin
      gl.uniform2f(uRes, cv.width, cv.height)
      gl.uniform1f(uTime, still ? 12 : t)
      gl.uniform1f(uSpin, 1)
      gl.uniform3fv(uC1, cur.c[0])
      gl.uniform3fv(uC2, cur.c[1])
      gl.uniform3fv(uC3, cur.c[2])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas ref={canvas} className="swirl" aria-hidden />
      <div className="crt" aria-hidden />
    </>
  )
}
