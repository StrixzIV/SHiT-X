import { useEffect, useRef } from 'react'
import { drive, noise, playFile, reverb, session, tone } from '../audio.js'
import { shotUniforms } from './gargantua.js'
import { createUiLight } from './uiLight.js'
import { LOOK, getRetro, useRetro } from '../../retro.js'

// Level 7 — Gargantua. Rays are bent by the Schwarzschild photon equation
// (a = -1.5·h²·r̂ / r⁴, units of Rs = 1), so the lensed disk and photon ring
// come out of the physics rather than being painted on. The shot is framed on the
// hole's top-right with a slight roll (gargantua.js) and fades up slowly from black.
// Drawn at console resolution (retro.js): PS2 448 lines, PS1 240 lines + dithering.
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec4 uShot; // hole centre (uv), focal length, roll: see gargantua.js
uniform float uDither; // PS1: 15-bit colour, ordered dithering
uniform sampler2D uUiTex;
uniform vec2 uView; // scene CSS dimensions
uniform vec2 uUiCenter; // card centre relative to the scene, CSS px, y down
uniform vec4 uUiInverse; // inverse of the live card's rotation/scale/tidal stretch
uniform vec2 uUiSize; // visible card dimensions
uniform vec2 uUiImage; // unscrolled image dimensions
uniform float uUiScroll;
uniform float uUiAlpha;

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
// One layer of stars: a few cells of a 3D grid over the sky hold one star each.
vec3 starLayer(vec3 d, float cells, float rate, float size, float t) {
  vec3 p = d * cells;
  vec3 ip = floor(p);
  float h = hash(ip);
  if (h < 1.0 - rate) return vec3(0.0);
  vec3 off = vec3(hash(ip + 1.7), hash(ip + 3.1), hash(ip + 5.3)) - 0.5;
  float g = smoothstep(size, 0.0, length(fract(p) - 0.5 - off * 0.3));
  vec3 tint = mix(vec3(0.62, 0.75, 1.0), vec3(1.0, 0.8, 0.58), hash(ip + 7.7));
  float twinkle = 0.8 + 0.2 * sin(t * (1.5 + 3.0 * h) + 40.0 * h);
  return tint * g * g * (0.3 + 2.5 * hash(ip + 9.1)) * twinkle;
}
vec3 stars(vec3 d, float t) {
  vec3 col = starLayer(d, 320.0, 0.12, 0.34, t) * 0.7
           + starLayer(d, 160.0, 0.09, 0.3, t) * 1.4
           + starLayer(d, 70.0, 0.06, 0.24, t) * 3.0;
  // a faint Milky Way with dust lanes
  float band = exp(-pow(dot(d, normalize(vec3(0.25, 1.0, 0.35))) * 3.2, 2.0));
  float dust = noise2(vec2(atan(d.z, d.x) * 5.0, d.y * 9.0));
  return col + band * mix(vec3(0.05, 0.04, 0.07), vec3(0.16, 0.12, 0.16), dust);
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
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
mat3 lookAt(vec3 ro, vec3 ta) {
  vec3 f = normalize(ta - ro);
  vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
  return mat3(r, cross(r, f), f);
}
vec4 uiLight(vec2 screen) {
  vec2 delta = screen - uUiCenter;
  vec2 local = vec2(dot(uUiInverse.xy, delta), dot(uUiInverse.zw, delta)) + 0.5 * uUiSize;
  if (local.x < 0.0 || local.y < 0.0 || local.x > uUiSize.x || local.y > uUiSize.y) return vec4(0.0);
  vec2 tex = (local + vec2(0.0, uUiScroll)) / uUiImage;
  return texture2D(uUiTex, tex) * vec4(1.0, 1.0, 1.0, uUiAlpha);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  // the shot: hole off to the lower left, camera rolled a little
  vec2 q = uv - uShot.xy;
  float cr = cos(uShot.w);
  float sr = sin(uShot.w);
  q = vec2(cr * q.x + sr * q.y, cr * q.y - sr * q.x);
  float ca = 0.6 + t * 0.045;
  vec3 ro = vec3(cos(ca) * 19.0, 1.6 + sin(t * 0.07) * 0.5, sin(ca) * 19.0);
  mat3 camera = lookAt(ro, vec3(0.0));
  vec3 rd = normalize(camera * vec3(q, uShot.z));
  vec3 pos = ro;
  vec3 vel = rd;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  vec3 col = vec3(0.0);
  float trans = 1.0;
  float captured = 0.0;
  for (int i = 0; i < 170; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    if (r < 1.0) { trans = 0.0; captured = 1.0; break; }
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
  if (trans > 0.0) col += trans * stars(normalize(vel), t);
  // Project the *bent escape ray* back into the UI light plane. Close to the
  // photon ring rays loop around the hole, producing inverted secondary images
  // and elongated arcs of the actual XP title bar, text and buttons.
  vec4 light = vec4(0.0);
  vec4 foreground = vec4(0.0);
  float rim = length(uv - uShot.xy) / (uShot.z * 0.138);
  if (uUiAlpha > 0.0 && captured < 0.5 && rim > 1.035 && rim < 3.0) {
    vec3 escape = normalize(vel);
    vec3 viewRay = vec3(dot(camera[0], escape), dot(camera[1], escape), dot(camera[2], escape));
    if (viewRay.z > 0.01) {
      vec2 source = viewRay.xy / viewRay.z * uShot.z;
      source = vec2(cr * source.x - sr * source.y, sr * source.x + cr * source.y) + uShot.xy;
      vec2 screen = vec2(0.5 * uView.x + source.x * uView.y, (0.5 - source.y) * uView.y);
      light = uiLight(screen);
      light.a *= (1.0 - smoothstep(1.7, 3.0, rim)) * trans;
    }
    // The HTML card is a foreground emitter, unlike the distant stars. A
    // broadened strong-deflection image makes its near-horizon light visible at
    // console resolution: radial inversion, tangential stretch, logarithmic
    // bending towards the photon ring. This deliberately exaggerates the tiny
    // relativistic image; it is not a physically scaled foreground simulation.
    if (rim > 1.035 && rim < 2.1) {
      float sourceRadius = 0.5 - 1.4 * log(max(rim - 1.015, 0.001));
      vec2 radial = normalize(uv - uShot.xy);
      vec2 emitter = vec2((uUiCenter.x - 0.5 * uView.x) / uView.y, 0.5 - uUiCenter.y / uView.y) - uShot.xy;
      vec2 axis = length(emitter) > 0.001 ? normalize(emitter) : vec2(0.0, 1.0);
      vec2 tangent = vec2(-axis.y, axis.x);
      float arc = atan(dot(radial, tangent), dot(radial, axis)) * 0.55;
      vec2 direction = axis * cos(arc) + tangent * sin(arc);
      vec2 source = uShot.xy + direction * (uShot.z * 0.138) * sourceRadius;
      vec2 screen = vec2(0.5 * uView.x + source.x * uView.y, (0.5 - source.y) * uView.y);
      foreground = uiLight(screen);
      foreground.a *= smoothstep(1.035, 1.10, rim) * (1.0 - smoothstep(1.6, 2.1, rim));
      foreground.a *= 0.65 + 0.35 * trans;
    }
  }
  // slow fade up from black: exposure ramps, so the disk shows first and stars last
  float fade = smoothstep(0.0, 4.5, t);
  col = pow(1.0 - exp(-col * 1.15 * fade * fade), vec3(0.92));
  col = mix(col, light.rgb, light.a * fade);
  col = mix(col, foreground.rgb, foreground.a * fade);
  if (uDither > 0.5) col = floor(col * 31.0 + bayer4(gl_FragCoord.xy)) / 31.0;
  gl_FragColor = vec4(col, 1.0);
}`

export default function L7Gargantua({ uiRef }) {
  const canvas = useRef(null)
  const mode = useRetro()
  const look = useRef(LOOK[getRetro()])
  const relook = useRef(null)
  useEffect(() => {
    look.current = LOOK[mode]
    relook.current?.()
  }, [mode])

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
    const vertex = sh(gl.VERTEX_SHADER, VERT)
    const fragment = sh(gl.FRAGMENT_SHADER, FRAG)
    gl.attachShader(prog, vertex)
    gl.attachShader(prog, fragment)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('L7 shader unavailable', gl.getShaderInfoLog(fragment), gl.getProgramInfoLog(prog))
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      gl.deleteProgram(prog)
      return
    }
    gl.useProgram(prog)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uShot = gl.getUniformLocation(prog, 'uShot')
    const uDither = gl.getUniformLocation(prog, 'uDither')
    const uniforms = Object.fromEntries(['uView', 'uUiCenter', 'uUiInverse', 'uUiSize', 'uUiImage', 'uUiScroll', 'uUiAlpha'].map(name => [name, gl.getUniformLocation(prog, name)]))
    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    gl.uniform1i(gl.getUniformLocation(prog, 'uUiTex'), 0)
    let imageWidth = 1, imageHeight = 1, ready = false, dead = false, raf
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const t0 = performance.now()
    const repaint = () => {
      if (!dead && still) {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(frame)
      }
    }
    const light = createUiLight(uiRef, (image, width, height) => {
      if (dead) return
      if (image) {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        imageWidth = width
        imageHeight = height
        ready = true
      }
      repaint()
    })
    // console resolution: a fixed number of lines, upscaled with hard pixels
    const resize = () => {
      const ch = cv.clientHeight || 1
      cv.height = Math.min(look.current.lines, ch)
      cv.width = Math.max(1, Math.round((cv.height * (cv.clientWidth || 1)) / ch))
      gl.viewport(0, 0, cv.width, cv.height)
      gl.uniform4f(uShot, ...shotUniforms(cv.clientWidth || 1, cv.clientHeight || 1))
      gl.uniform1f(uDither, look.current.dither ? 1 : 0)
      repaint()
    }
    resize()
    addEventListener('resize', resize)
    function frame(now) {
      if (dead) return
      const el = light.sync()
      const scene = cv.getBoundingClientRect()
      gl.uniform2f(uniforms.uView, scene.width, scene.height)
      let alpha = 0
      if (el && ready) {
        const bounds = el.getBoundingClientRect()
        const m = new DOMMatrix(getComputedStyle(el).transform)
        if (Math.abs(m.a * m.d - m.b * m.c) > 0.000001) {
          const inv = m.inverse()
          alpha = Number(getComputedStyle(el).opacity)
          gl.uniform2f(uniforms.uUiCenter, (bounds.left + bounds.right) / 2 - scene.left, (bounds.top + bounds.bottom) / 2 - scene.top)
          gl.uniform4f(uniforms.uUiInverse, inv.a, inv.c, inv.b, inv.d)
          gl.uniform2f(uniforms.uUiSize, el.offsetWidth, el.offsetHeight)
          gl.uniform1f(uniforms.uUiScroll, el.scrollTop)
        }
      }
      gl.uniform1f(uniforms.uUiAlpha, alpha)
      gl.uniform2f(uniforms.uUiImage, imageWidth, imageHeight)
      gl.uniform2f(uRes, cv.width, cv.height)
      gl.uniform1f(uTime, still ? 8 : (now - t0) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!still) raf = requestAnimationFrame(frame)
    }
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(frame)
    // Reduced motion draws only on changes, including the late-mounted result.
    const mounts = new MutationObserver(() => { light.sync(); repaint() })
    mounts.observe(cv.closest('.calc'), { childList: true, subtree: true })
    const dimensions = new ResizeObserver(resize)
    dimensions.observe(cv)
    // the PS1/PS2 switch only changes the resolution and dithering; the clock runs on
    relook.current = () => {
      resize()
    }
    return () => {
      dead = true
      relook.current = null
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      mounts.disconnect()
      dimensions.disconnect()
      light.dispose()
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(prog)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [uiRef])

  return (
    <div className="scene scene-gargantua">
      <canvas ref={canvas} className="scene-canvas retro" aria-label="หลุมดำการ์กันทัว" />
    </div>
  )
}
