import { useEffect, useRef } from 'react'
import { drive, noise, playFile, reverb, session, tone } from '../audio.js'

// Level 7 — Gargantua. Rays are bent by the Schwarzschild photon equation
// (a = -1.5·h²·r̂ / r⁴, units of Rs = 1), so the lensed disk and photon ring
// come out of the physics rather than being painted on.
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(vec3(i, 1.0));
  float b = hash(vec3(i + vec2(1.0, 0.0), 1.0));
  float c = hash(vec3(i + vec2(0.0, 1.0), 1.0));
  float d = hash(vec3(i + vec2(1.0, 1.0), 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec3 stars(vec3 d) {
  vec3 col = vec3(0.0);
  vec3 p = d * 260.0;
  vec3 ip = floor(p);
  float h = hash(ip);
  if (h > 0.982) {
    float s = smoothstep(0.42, 0.0, length(fract(p) - 0.5));
    col += s * mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash(ip + 3.0)) * (h - 0.982) * 70.0;
  }
  float band = exp(-pow(dot(d, normalize(vec3(0.25, 1.0, 0.35))) * 3.2, 2.0));
  col += band * vec3(0.09, 0.07, 0.11);
  return col;
}
vec3 disk(vec3 p, vec3 dir, float t, out float alpha) {
  float r = length(p.xz);
  float ang = atan(p.z, p.x);
  float omega = 1.4 / pow(r, 1.5);
  float n = noise2(vec2((ang + t * omega) * 4.0, r * 3.0)) * 0.6 + noise2(vec2((ang + t * omega) * 11.0, r * 9.0)) * 0.4;
  float temp = clamp(pow(3.0 / r, 1.4), 0.0, 1.4);
  vec3 base = mix(vec3(1.0, 0.32, 0.06), vec3(1.0, 0.86, 0.62), clamp(temp, 0.0, 1.0));
  vec3 vel = normalize(vec3(-p.z, 0.0, p.x));
  float dop = 1.0 + 0.75 * dot(vel, -dir);
  alpha = clamp(smoothstep(2.3, 3.1, r) * (1.0 - smoothstep(9.0, 14.0, r)) * (0.55 + 0.7 * n), 0.0, 1.0);
  return base * (0.5 + 1.8 * temp) * max(dop, 0.15) * (0.55 + 0.9 * n);
}
mat3 lookAt(vec3 ro, vec3 ta) {
  vec3 f = normalize(ta - ro);
  vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
  return mat3(r, cross(r, f), f);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float ca = 0.6 + t * 0.045;
  vec3 ro = vec3(cos(ca) * 19.0, 1.6 + sin(t * 0.07) * 0.5, sin(ca) * 19.0);
  vec3 rd = normalize(lookAt(ro, vec3(0.0)) * vec3(uv, 1.7));
  vec3 pos = ro;
  vec3 vel = rd;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  vec3 col = vec3(0.0);
  float trans = 1.0;
  for (int i = 0; i < 170; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    if (r < 1.0) { trans = 0.0; break; }
    if (r > 70.0) break;
    float dt = clamp(0.09 * r, 0.025, 1.4);
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    vec3 np = pos + vel * dt;
    if (pos.y * np.y < 0.0) {
      vec3 hit = mix(pos, np, pos.y / (pos.y - np.y));
      float rr = length(hit.xz);
      if (rr > 2.2 && rr < 14.5) {
        float a;
        vec3 c = disk(hit, normalize(vel), t, a);
        col += trans * a * c;
        trans *= 1.0 - a;
        if (trans < 0.02) break;
      }
    }
    pos = np;
  }
  if (trans > 0.0) col += trans * stars(normalize(vel));
  col = 1.0 - exp(-col * 1.15);
  gl_FragColor = vec4(pow(col, vec3(0.92)), 1.0);
}`

export default function L7Gargantua() {
  const canvas = useRef(null)

  useEffect(() => {
    const s = session(0.9)
    if (!s) return
    playFile(s, 'l7-space.mp3', { loop: true }).then((ok) => {
      if (ok || !s.alive) return
      const room = reverb(s, 5, 1.8, 0.55)
      const dirt = drive(s, 6, room)
      const lp = s.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.Q.value = 9
      lp.frequency.value = 220
      lp.connect(dirt)
      const lfo = s.ctx.createOscillator()
      const depth = s.ctx.createGain()
      lfo.frequency.value = 0.07
      depth.gain.value = 260
      lfo.connect(depth).connect(lp.frequency)
      lfo.start()
      s.keep(lfo)
      // detuned drone, bending down over time (time dilation)
      for (const [f, type, g] of [[41.2, 'sawtooth', 0.09], [41.9, 'sawtooth', 0.09], [61.7, 'sawtooth', 0.05], [82.4, 'square', 0.03]]) {
        tone(s, { freq: f, slideTo: f * 0.78, type, dur: 40, gain: g, attack: 2.5, dest: lp })
      }
      tone(s, { freq: 27.5, slideTo: 22, type: 'sine', dur: 40, gain: 0.25, attack: 3, dest: room })
      s.every(() => noise(s, { dur: 3.5, gain: 0.08, type: 'bandpass', freq: 300, sweepTo: 3200, q: 4, attack: 1.2, dest: room }), 4200)
    })
    return () => s.stop()
  }, [])

  useEffect(() => {
    const cv = canvas.current
    const gl = cv.getContext('webgl', { antialias: false, powerPreference: 'high-performance' })
    if (!gl) return
    const sh = (type, src) => {
      const x = gl.createShader(type)
      gl.shaderSource(x, src)
      gl.compileShader(x)
      return x
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
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    // fewer pixels on small screens: the ray march is the expensive part
    const scale = Math.min(innerWidth, innerHeight) < 600 ? 0.35 : 0.5
    const resize = () => {
      cv.width = Math.max(1, Math.round(cv.clientWidth * scale))
      cv.height = Math.max(1, Math.round(cv.clientHeight * scale))
      gl.viewport(0, 0, cv.width, cv.height)
    }
    resize()
    addEventListener('resize', resize)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    let raf
    const frame = (now) => {
      gl.uniform2f(uRes, cv.width, cv.height)
      gl.uniform1f(uTime, still ? 8 : (now - t0) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!still) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="scene scene-gargantua">
      <canvas ref={canvas} className="scene-canvas smooth" aria-label="หลุมดำการ์กันทัว" />
    </div>
  )
}
