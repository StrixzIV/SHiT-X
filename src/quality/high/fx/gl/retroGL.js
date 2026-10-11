import { LOOK } from '../../retro.js'
import { STRIDE } from './mesh.js'
import { ident, lookAt, mul, perspective } from './m4.js'

// A tiny WebGL1 renderer for the low-poly result scenes, drawn at console
// resolution and upscaled with hard pixels (CSS: .scene-canvas.retro).
// PS1: 240 lines, vertices snapped to whole pixels (wobble), affine textures,
//      15-bit colour with ordered dithering, nearest-neighbour textures.
// PS2: 448 lines, no anti-aliasing (jaggies), bilinear textures, bloom, and a
//      faint interlace shimmer.

const VS = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec3 aCol;
attribute vec2 aUV;
uniform mat4 uModel;
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform vec3 uLightDir;
uniform vec3 uLightCol;
uniform vec3 uAmbient;
uniform float uLit;
uniform vec2 uSnap;
uniform float uAffine;
uniform vec2 uFog;
varying vec3 vCol;
varying vec3 vUVW;
varying float vFog;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vec3 n = normalize((uModel * vec4(aNrm, 0.0)).xyz);
  float diff = max(dot(n, -uLightDir), 0.0);
  vCol = mix(aCol, aCol * (uAmbient + uLightCol * diff), uLit);
  vec4 cp = uViewProj * wp;
  if (uSnap.x > 0.0 && cp.w > 0.0) cp.xy = floor(cp.xy / cp.w * uSnap + 0.5) / uSnap * cp.w;
  gl_Position = cp;
  // affine: interpolating uv * w and w then dividing cancels the perspective correction
  float w = mix(1.0, cp.w, uAffine);
  vUVW = vec3(aUV * w, w);
  vFog = clamp((distance(wp.xyz, uEye) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
}`

const FS = `
precision mediump float;
varying vec3 vCol;
varying vec3 vUVW;
varying float vFog;
uniform sampler2D uTex;
uniform float uUseTex;
uniform vec4 uTint;
uniform vec3 uFogCol;
uniform float uAdd;
uniform float uDither;
uniform float uCut;
uniform float uFogK;
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  vec4 c = vec4(vCol, 1.0) * uTint;
  if (uUseTex > 0.5) c *= texture2D(uTex, vUVW.xy / vUVW.z);
  if (c.a < uCut) discard;
  float f = vFog * uFogK;
  c.rgb = uAdd > 0.5 ? c.rgb * (1.0 - f) : mix(c.rgb, uFogCol, f);
  if (uDither > 0.5) c.rgb = floor(c.rgb * 31.0 + bayer4(gl_FragCoord.xy)) / 31.0;
  gl_FragColor = c;
}`

const QUAD_VS = 'attribute vec2 p; varying vec2 v; void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'
const BRIGHT_FS = `
precision mediump float;
varying vec2 v;
uniform sampler2D uSrc;
uniform vec2 uPx;
uniform float uCutoff;
void main() {
  vec3 c = (texture2D(uSrc, v + uPx * vec2(-0.5, -0.5)).rgb + texture2D(uSrc, v + uPx * vec2(0.5, -0.5)).rgb
          + texture2D(uSrc, v + uPx * vec2(-0.5, 0.5)).rgb + texture2D(uSrc, v + uPx * vec2(0.5, 0.5)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(uCutoff, 1.0, l), 1.0);
}`
const BLUR_FS = `
precision mediump float;
varying vec2 v;
uniform sampler2D uSrc;
uniform vec2 uDir;
void main() {
  vec3 c = texture2D(uSrc, v).rgb * 0.227;
  c += (texture2D(uSrc, v + uDir * 1.385).rgb + texture2D(uSrc, v - uDir * 1.385).rgb) * 0.316;
  c += (texture2D(uSrc, v + uDir * 3.231).rgb + texture2D(uSrc, v - uDir * 3.231).rgb) * 0.070;
  gl_FragColor = vec4(c, 1.0);
}`
const COMPOSE_FS = `
precision mediump float;
varying vec2 v;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomK;
uniform float uField;
uniform float uFade;
void main() {
  vec3 c = texture2D(uScene, v).rgb + texture2D(uBloom, v).rgb * uBloomK;
  // interlace: alternate lines dip a touch, swapping every frame
  if (mod(floor(gl_FragCoord.y) + uField, 2.0) < 1.0) c *= 0.94;
  gl_FragColor = vec4(c * uFade, 1.0);
}`

function program(gl, vs, fs) {
  const sh = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('[retroGL]', gl.getShaderInfoLog(s))
    return s
  }
  const p = gl.createProgram()
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs))
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)
  const u = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name
    u[name] = gl.getUniformLocation(p, name)
  }
  return { p, u }
}

function target(gl, w, h, depth) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  let rb = null
  if (depth) {
    rb = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { tex, fb, rb, w, h }
}

const IDENT = ident()

export function createRetroGL(canvas, mode) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance' })
  if (!gl) return null
  const main = program(gl, VS, FS)
  const bright = program(gl, QUAD_VS, BRIGHT_FS)
  const blur = program(gl, QUAD_VS, BLUR_FS)
  const compose = program(gl, QUAD_VS, COMPOSE_FS)
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  const A = (prog, name) => gl.getAttribLocation(prog.p, name)
  const attrs = { pos: A(main, 'aPos'), nrm: A(main, 'aNrm'), col: A(main, 'aCol'), uv: A(main, 'aUV') }
  const white = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, white)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]))

  const meshes = new Set()
  const textures = new Set()
  let look = LOOK[mode] ?? LOOK.ps2
  let W = 1
  let H = 1
  let rt = null // PS2 render targets
  let field = 0
  let fade = 1
  let bloomK = 0.9
  let bloomCut = 0.55

  const filter = (tex) => {
    const f = look.dither ? gl.NEAREST : gl.LINEAR
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f)
  }
  const dropTargets = () => {
    if (!rt) return
    for (const t of Object.values(rt)) {
      gl.deleteTexture(t.tex)
      gl.deleteFramebuffer(t.fb)
      if (t.rb) gl.deleteRenderbuffer(t.rb)
    }
    rt = null
  }
  const resize = () => {
    const ch = Math.max(1, canvas.clientHeight)
    const cw = Math.max(1, canvas.clientWidth)
    H = Math.min(look.lines, ch)
    W = Math.max(1, Math.round((H * cw) / ch))
    canvas.width = W
    canvas.height = H
    dropTargets()
    if (look.bloom) {
      const hw = Math.max(1, W >> 1)
      const hh = Math.max(1, H >> 1)
      rt = { scene: target(gl, W, H, true), a: target(gl, hw, hh), b: target(gl, hw, hh) }
    }
  }
  resize()

  let viewProj = IDENT
  const pass = (prog, dst, w, h, bind) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst)
    gl.viewport(0, 0, w, h)
    gl.useProgram(prog.p)
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    const loc = gl.getAttribLocation(prog.p, 'p')
    for (const a of Object.values(attrs)) if (a >= 0) gl.disableVertexAttribArray(a)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    bind()
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.disableVertexAttribArray(loc)
  }

  const r = {
    gl,
    get w() {
      return W
    },
    get h() {
      return H
    },
    get look() {
      return look
    },
    // camera basis after begin(), for sprites
    right: [1, 0, 0],
    up: [0, 1, 0],
    fwd: [0, 0, -1],
    // static (or, with dynamic: true, re-uploadable) triangle soup from mesh.js
    mesh(data, dynamic = false) {
      const buf = gl.createBuffer()
      const m = {
        buf,
        count: 0,
        update(d) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buf)
          gl.bufferData(gl.ARRAY_BUFFER, d instanceof Float32Array ? d : new Float32Array(d), dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW)
          m.count = d.length / STRIDE
        },
      }
      m.update(data)
      meshes.add(m)
      return m
    },
    // an image or canvas; `px` shrinks it first (PS1 textures were tiny)
    texture(src, { px } = {}) {
      let img = src
      const big = Math.max(src.width, src.height)
      if (px && big > px) {
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round((src.width * px) / big))
        c.height = Math.max(1, Math.round((src.height * px) / big))
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height)
        img = c
      }
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      filter(tex)
      textures.add(tex)
      return tex
    },
    setMode(next) {
      const l = LOOK[next]
      if (!l || l === look) return
      look = l
      textures.forEach(filter)
      resize()
    },
    resize,
    // cam: { eye, at, fov (deg), near, far }; env: { clear, fog, fogNear, fogFar, light, lightCol, ambient,
    // bloom (strength), glowFrom (brightness where bloom starts), fade }
    begin(cam, env = {}) {
      field ^= 1
      fade = env.fade ?? 1
      bloomK = env.bloom ?? 0.9
      bloomCut = env.glowFrom ?? 0.55
      const view = lookAt(cam.eye, cam.at, cam.up)
      viewProj = mul(perspective(((cam.fov ?? 60) * Math.PI) / 180, W / H, cam.near ?? 0.1, cam.far ?? 200), view)
      r.right = [view[0], view[4], view[8]]
      r.up = [view[1], view[5], view[9]]
      r.fwd = [-view[2], -view[6], -view[10]]
      gl.bindFramebuffer(gl.FRAMEBUFFER, rt ? rt.scene.fb : null)
      gl.viewport(0, 0, W, H)
      const c = env.clear ?? [0, 0, 0]
      gl.clearColor(c[0] * (rt ? 1 : fade), c[1] * (rt ? 1 : fade), c[2] * (rt ? 1 : fade), 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.disable(gl.CULL_FACE)
      gl.useProgram(main.p)
      const u = main.u
      gl.uniformMatrix4fv(u.uViewProj, false, viewProj)
      gl.uniform3fv(u.uEye, cam.eye)
      const L = env.light ?? [-0.4, -1, -0.3]
      const ll = Math.hypot(...L) || 1
      gl.uniform3f(u.uLightDir, L[0] / ll, L[1] / ll, L[2] / ll)
      gl.uniform3fv(u.uLightCol, env.lightCol ?? [0.8, 0.8, 0.8])
      gl.uniform3fv(u.uAmbient, env.ambient ?? [0.35, 0.35, 0.4])
      gl.uniform3fv(u.uFogCol, (env.fog ?? c).map((v) => v * (rt ? 1 : fade)))
      gl.uniform2f(u.uFog, env.fogNear ?? 20, env.fogFar ?? 80)
      gl.uniform2f(u.uSnap, look.snap ? W / 2 : 0, look.snap ? H / 2 : 0)
      gl.uniform1f(u.uAffine, look.affine ? 1 : 0)
      gl.uniform1f(u.uDither, look.dither ? 1 : 0)
      gl.uniform1i(u.uTex, 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
    },
    // opts: { tex, lit = true, fog = true, tint = [r,g,b], alpha = 1, blend: 'add' | 'alpha', depthWrite, cut, count (vertices) }
    draw(m, model = IDENT, opts = {}) {
      if (!m.count) return
      const u = main.u
      const blend = opts.blend
      // no post pass on PS1: fade straight into the colour
      const k = rt ? 1 : fade
      const tint = opts.tint ?? [1, 1, 1]
      gl.uniformMatrix4fv(u.uModel, false, model)
      gl.uniform1f(u.uLit, opts.lit === false ? 0 : 1)
      gl.uniform4f(u.uTint, tint[0] * k, tint[1] * k, tint[2] * k, opts.alpha ?? 1)
      gl.uniform1f(u.uAdd, blend === 'add' ? 1 : 0)
      gl.uniform1f(u.uCut, opts.cut ?? 0)
      gl.uniform1f(u.uFogK, opts.fog === false ? 0 : 1)
      gl.uniform1f(u.uUseTex, opts.tex ? 1 : 0)
      gl.bindTexture(gl.TEXTURE_2D, opts.tex ?? white)
      if (blend) {
        gl.enable(gl.BLEND)
        if (blend === 'add') gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      } else gl.disable(gl.BLEND)
      gl.depthMask(opts.depthWrite ?? !blend)
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf)
      const F = 4
      const S = STRIDE * F
      gl.enableVertexAttribArray(attrs.pos)
      gl.vertexAttribPointer(attrs.pos, 3, gl.FLOAT, false, S, 0)
      if (attrs.nrm >= 0) {
        gl.enableVertexAttribArray(attrs.nrm)
        gl.vertexAttribPointer(attrs.nrm, 3, gl.FLOAT, false, S, 3 * F)
      }
      gl.enableVertexAttribArray(attrs.col)
      gl.vertexAttribPointer(attrs.col, 3, gl.FLOAT, false, S, 6 * F)
      if (attrs.uv >= 0) {
        gl.enableVertexAttribArray(attrs.uv)
        gl.vertexAttribPointer(attrs.uv, 2, gl.FLOAT, false, S, 9 * F)
      }
      gl.drawArrays(gl.TRIANGLES, 0, Math.min(m.count, opts.count ?? m.count))
    },
    // PS2: bloom + interlace onto the canvas. PS1 drew straight to it.
    end() {
      gl.disable(gl.BLEND)
      gl.depthMask(true)
      if (!rt) return
      gl.disable(gl.DEPTH_TEST)
      const { scene, a, b } = rt
      pass(bright, a.fb, a.w, a.h, () => {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, scene.tex)
        gl.uniform1i(bright.u.uSrc, 0)
        gl.uniform2f(bright.u.uPx, 1 / W, 1 / H)
        gl.uniform1f(bright.u.uCutoff, bloomCut)
      })
      for (const [src, dst, dx, dy] of [[a, b, 1, 0], [b, a, 0, 1], [a, b, 1, 0], [b, a, 0, 1]]) {
        pass(blur, dst.fb, dst.w, dst.h, () => {
          gl.bindTexture(gl.TEXTURE_2D, src.tex)
          gl.uniform1i(blur.u.uSrc, 0)
          gl.uniform2f(blur.u.uDir, dx / src.w, dy / src.h)
        })
      }
      pass(compose, null, W, H, () => {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, scene.tex)
        gl.uniform1i(compose.u.uScene, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, a.tex)
        gl.uniform1i(compose.u.uBloom, 1)
        gl.uniform1f(compose.u.uBloomK, bloomK)
        gl.uniform1f(compose.u.uField, field)
        gl.uniform1f(compose.u.uFade, fade)
      })
      gl.activeTexture(gl.TEXTURE0)
    },
    dispose() {
      dropTargets()
      meshes.forEach((m) => gl.deleteBuffer(m.buf))
      textures.forEach((t) => gl.deleteTexture(t))
      gl.deleteTexture(white)
      gl.deleteBuffer(quad)
      for (const p of [main, bright, blur, compose]) gl.deleteProgram(p.p)
    },
  }
  return r
}
