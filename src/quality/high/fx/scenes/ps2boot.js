// The PS2 boot screen's parts, ported from the PS2 skin in ft_blueprint (same
// author): src/skins/consoles/ps2.ts (ps2Boot, the canvas original: fog, cubes,
// lights) and src/gfx/scenes/ps2.ts (ps2Scene, the cubes as real glass on the
// GPU). Boot.jsx draws with these; createGlass() needs WebGL2, and without it
// Boot.jsx falls back to the canvas cubes.

export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// the fog: value noise on a tiny grid, a few octaves, inside a soft oval
export function fogTexture(seed) {
  const W = 96
  const H = 60
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const img = g.createImageData(W, H)
  const vnoise = (x, y, s) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const h = (i, j) => hash(i * 131 + j * 977 + s * 7919)
    const sx = (x - xi) ** 2 * (3 - 2 * (x - xi))
    const sy = (y - yi) ** 2 * (3 - 2 * (y - yi))
    const a = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * sx
    const b = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * sx
    return a + (b - a) * sy
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let n = 0
      let amp = 0.55
      for (let o = 0; o < 4; o++) {
        n += amp * vnoise((x / W) * 5 * 2 ** o, (y / H) * 3 * 2 ** o, seed + o)
        amp /= 2
      }
      const mask = Math.max(0, 1 - Math.hypot((x / W - 0.5) / 0.42, (y / H - 0.47) / 0.42))
      const d = Math.max(0, n - 0.3) * 2.2 * mask ** 1.2
      const k = (y * W + x) * 4
      img.data[k] = 20 + 26 * d
      img.data[k + 1] = 22 + 26 * d
      img.data[k + 2] = 110 + 70 * d
      img.data[k + 3] = Math.min(255, 255 * d * 0.6)
    }
  }
  g.putImageData(img, 0, 0)
  return c
}

export const CUBES = Array.from({ length: 6 }, (_, i) => ({
  x: [-0.34, 0.36, -0.1, 0.18, -0.42, 0.44][i],
  y: [-0.28, -0.3, -0.05, 0.2, 0.3, 0.26][i],
  s: 0.06 + 0.06 * hash(i * 5 + 1),
  depth: 0.1 + 0.12 * hash(i * 23 + 6),
  rx: 0.05 + 0.08 * hash(i * 7 + 2),
  ry: 0.04 + 0.07 * hash(i * 11 + 3),
  p: Math.PI * 2 * hash(i * 13 + 4),
}))
export const LIGHTS = [
  { col: '#ff4a5e', a: 0.23, b: 0.31, c: 0.17, p: [0.3, 1.9, 4.1, 0.7] },
  { col: '#3dff72', a: 0.29, b: 0.19, c: 0.23, p: [2.4, 0.2, 1.3, 2.9] },
  { col: '#9b7dff', a: 0.19, b: 0.27, c: 0.29, p: [4.6, 3.3, 0.4, 5.1] },
  { col: '#4f78ff', a: 0.26, b: 0.23, c: 0.2, p: [1.1, 5.2, 2.7, 3.8] },
]
export const TRAIL = 90

// where a light is at time tt, on a W × H screen (before any zoom or roll)
export function lightAt(L, tt, W, H) {
  const x3 = Math.sin(L.a * tt * 2.2 + L.p[0]) * (0.7 + 0.3 * Math.sin(0.11 * tt + L.p[3]))
  const y3 = Math.sin(L.b * tt * 2.2 + L.p[1])
  const z3 = Math.cos(L.c * tt * 2.2 + L.p[2])
  const k = 1.6 / (2.6 - z3)
  return { x: W / 2 + x3 * W * 0.46 * k, y: H * 0.47 + y3 * H * 0.36 * k, k }
}

// ---- the glass, on the GPU ----
// Pass 1 draws the wall behind everything (space, fog, light heads, then the
// trails as 1 px lines) into a texture. Pass 2 traces each pixel: a cube is
// clear glass, the ray bent going in and out of it like a slab and followed on
// to the other cubes or the wall, with a faint reflection at a slant (Fresnel).
// Coordinates are screen px, y down. The camera's roll is a rotation of the
// pixel coordinates about the zoom centre, so the scene itself is laid out unrolled.

// the uniform block, in vec4s
const V_RES = 0 // w, h, t, the backdrop plane's z
const V_FOG = 1 // 2 rects: x, y, w, h
const V_FOGA = 3 // the two fog alphas
const V_CUBE = 4 // 6: centre x, y, half size, z
const V_ROT = 10 // 6 × 3 rows of the view-to-cube rotation
const V_HEAD = 28 // 4: x, y, radius
const V_COL = 32 // 4: r, g, b
const V_ROLL = 36 // cos, sin of the roll; the centre it turns about
const V_SHOW = 37 // how much of the cubes and lights is left (x); the fog has its own alphas
const VEC4S = 38

const HEAD = `#version 300 es
precision highp float;
uniform vec4 v[${VEC4S}];
out vec4 o;
// screen px (y down) → the unrolled scene, and back
vec2 unroll(vec2 p) { vec4 R = v[${V_ROLL}]; vec2 d = p - R.zw; return vec2(R.x * d.x + R.y * d.y, -R.y * d.x + R.x * d.y) + R.zw; }
vec2 reroll(vec2 p) { vec4 R = v[${V_ROLL}]; vec2 d = p - R.zw; return vec2(R.x * d.x - R.y * d.y, R.y * d.x + R.x * d.y) + R.zw; }
vec2 pixel() { return vec2(gl_FragCoord.x, v[${V_RES}].y - gl_FragCoord.y); }
`

const QUAD_VS = '#version 300 es\nin vec2 a;\nvoid main() { gl_Position = vec4(a, 0.0, 1.0); }'

const BACK_FS = `${HEAD}
uniform sampler2D fog0;
uniform sampler2D fog1;
vec4 over(vec4 d, vec4 s) { return s + d * (1.0 - s.a); }
void main() {
  vec2 p = unroll(pixel());
  vec4 c = vec4(0.0, 0.0, 3.0 / 255.0, 1.0);
  for (int i = 0; i < 2; i++) {
    vec4 r = v[${V_FOG} + i];
    vec2 uv = (p - r.xy) / r.zw;
    if (all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)))) {
      vec4 f = i == 0 ? texture(fog0, uv) : texture(fog1, uv);
      float a = f.a * v[${V_FOGA}][i];
      c = over(c, vec4(f.rgb * a, a));
    }
  }
  for (int i = 0; i < 4; i++) {
    vec4 h = v[${V_HEAD} + i];
    float r = length(p - h.xy) / max(h.z, 0.5);
    if (r < 1.0) {
      vec3 col = v[${V_COL} + i].rgb;
      vec4 s = r < 0.12 ? vec4(mix(vec3(1.0), col, r / 0.12), 1.0)
        : r < 0.35 ? vec4(col, mix(1.0, 0.4, (r - 0.12) / 0.23))
        : vec4(col, mix(0.4, 0.0, (r - 0.35) / 0.65));
      c.rgb += s.rgb * s.a * v[${V_SHOW}].x;
    }
  }
  o = vec4(c.rgb, 1.0);
}`

const TRAIL_VS = `#version 300 es
in vec2 a;
in vec4 col;
uniform vec2 res;
out vec4 vc;
void main() { vc = col; gl_Position = vec4(a.x / res.x * 2.0 - 1.0, 1.0 - a.y / res.y * 2.0, 0.0, 1.0); }`
const TRAIL_FS = `#version 300 es
precision mediump float;
in vec4 vc;
out vec4 o;
void main() { o = vec4(vc.rgb * vc.a, 1.0); }`

const GLASS_FS = `${HEAD}
uniform sampler2D back;
// the wall as already drawn (it was drawn rolled, so roll the point first)
vec3 backAt(vec2 p) { vec2 s = reroll(p); return texture(back, vec2(s.x / v[${V_RES}].x, 1.0 - s.y / v[${V_RES}].y)).rgb; }
struct Hit { float tn; float tf; vec3 nIn; };
vec3 axisOf(float t, vec3 t3) { return t == t3.x ? vec3(1.0, 0.0, 0.0) : t == t3.y ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0); }
// a ray against cube i: where it enters and leaves, and the face it enters by
Hit cubeRay(int i, vec3 o, vec3 d) {
  Hit h;
  vec4 cc = v[${V_CUBE} + i];
  vec3 r0 = v[${V_ROT} + i * 3].xyz;
  vec3 r1 = v[${V_ROT} + i * 3 + 1].xyz;
  vec3 r2 = v[${V_ROT} + i * 3 + 2].xyz;
  vec3 rel = o - vec3(cc.xy, cc.w);
  vec3 ol = vec3(dot(r0, rel), dot(r1, rel), dot(r2, rel)) / cc.z;
  vec3 dl = vec3(dot(r0, d), dot(r1, d), dot(r2, d)) / cc.z;
  dl = mix(dl, vec3(1e-6), lessThan(abs(dl), vec3(1e-6)));
  vec3 t0 = (vec3(-1.0) - ol) / dl;
  vec3 t1 = (vec3(1.0) - ol) / dl;
  vec3 tn3 = min(t0, t1);
  vec3 tf3 = max(t0, t1);
  h.tn = max(max(tn3.x, tn3.y), tn3.z);
  h.tf = min(min(tf3.x, tf3.y), tf3.z);
  h.nIn = mat3(r0, r1, r2) * (axisOf(h.tn, tn3) * -sign(dl));
  return h;
}
// past the glass: the wall where the ray lands, or space if it heads away
vec3 wallAt(vec3 o, vec3 d) {
  float zb = v[${V_RES}].w;
  if (d.z > -1e-3) return vec3(0.0, 0.0, 3.0 / 255.0);
  return backAt((o + d * ((zb - o.z) / d.z)).xy);
}
int nearest(vec3 o, vec3 d, int skip) {
  int best = -1;
  float bt = 1e9;
  for (int j = 0; j < 6; j++) {
    if (j == skip) continue;
    vec4 cc = v[${V_CUBE} + j];
    vec3 rel = vec3(cc.xy, cc.w) - o;
    float along = dot(rel, d);
    if (along < -cc.z * 1.8 || dot(rel, rel) - along * along > 3.0 * cc.z * cc.z) continue;
    Hit h = cubeRay(j, o, d);
    if (h.tn <= h.tf && h.tn > 0.5 && h.tn < bt) { bt = h.tn; best = j; }
  }
  return best;
}
vec3 seen(vec3 o, vec3 d, int skip) {
  int j = nearest(o, d, skip);
  if (j < 0) return wallAt(o, d);
  Hit h = cubeRay(j, o, d);
  float F = 0.04 + 0.4 * pow(1.0 - abs(dot(h.nIn, d)), 4.0);
  return wallAt(o + d * h.tf, d) * (1.0 - F);
}
void main() {
  vec2 p = unroll(pixel());
  vec3 ro = vec3(p, 1e4);
  vec3 vd = vec3(0.0, 0.0, -1.0);
  int i = -1;
  Hit h;
  float bt = 1e9;
  for (int j = 0; j < 6; j++) {
    vec4 cc = v[${V_CUBE} + j];
    if (abs(p.x - cc.x) > cc.z * 1.8 || abs(p.y - cc.y) > cc.z * 1.8) continue;
    Hit hj = cubeRay(j, ro, vd);
    if (hj.tn <= hj.tf && hj.tn < bt) { bt = hj.tn; i = j; h = hj; }
  }
  vec3 wall = backAt(p);
  if (i < 0) { o = vec4(wall, 1.0); return; }
  vec3 x0 = ro + vd * h.tn;
  // through, as a slab of glass 1.5: bent going in, out again parallel, shifted sideways
  vec3 dir = refract(vd, h.nIn, 1.0 / 1.5);
  vec3 through = seen(x0 + dir * ((h.tf - h.tn) / max(-dir.z, 0.2)), vd, i);
  // on it: what the face reflects, faint face-on, stronger edge-on
  float F = 0.04 + 0.4 * pow(1.0 - clamp(h.nIn.z, 0.0, 1.0), 4.0);
  vec3 col = mix(through, seen(x0, reflect(vd, h.nIn), i), F);
  // soft silhouette: coverage from how much glass the ray crossed
  o = vec4(mix(wall, col, clamp((h.tf - h.tn) / 1.5, 0.0, 1.0) * v[${V_SHOW}].x), 1.0);
}`

const rgb01 = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)

// → { canvas, render(W, H, s), dispose() } or null (no WebGL2 / shader failure).
// s: { t, z (zoom), roll, step (trail sample spacing, s), fogA: [a, a], show (cubes and lights, 0..1) }
export function createGlass(fogs) {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const prog = (vs, fs) => {
    const sh = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('[ps2 glass]', gl.getShaderInfoLog(s))
      return s
    }
    const p = gl.createProgram()
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs))
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null
  }
  const backP = prog(QUAD_VS, BACK_FS)
  const glassP = prog(QUAD_VS, GLASS_FS)
  const trailP = prog(TRAIL_VS, TRAIL_FS)
  if (!backP || !glassP || !trailP) return null

  const tex = (src, linear = true) => {
    const t = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, t)
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
    const f = linear ? gl.LINEAR : gl.NEAREST
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }
  const fogTex = fogs.map((f) => tex(f))
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const lines = gl.createBuffer()
  const vao = { quad: gl.createVertexArray(), lines: gl.createVertexArray() }
  gl.bindVertexArray(vao.quad)
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  for (const p of [backP, glassP]) {
    const loc = gl.getAttribLocation(p, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }
  gl.bindVertexArray(vao.lines)
  gl.bindBuffer(gl.ARRAY_BUFFER, lines)
  const la = gl.getAttribLocation(trailP, 'a')
  const lc = gl.getAttribLocation(trailP, 'col')
  gl.enableVertexAttribArray(la)
  gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 24, 0)
  gl.enableVertexAttribArray(lc)
  gl.vertexAttribPointer(lc, 4, gl.FLOAT, false, 24, 8)
  gl.bindVertexArray(null)

  let back = null
  let fb = null
  const u = new Float32Array(VEC4S * 4)
  const set = (i, a, b = 0, c = 0, d = 0) => u.set([a, b, c, d], i * 4)
  const verts = new Float32Array(LIGHTS.length * TRAIL * 12)
  const cols = LIGHTS.map((L) => rgb01(L.col))

  return {
    canvas,
    render(W, H, { t, z = 1, roll = 0, step = 0.018, fogA = [0.85, 0.6], show = 1 }) {
      if (canvas.width !== W || canvas.height !== H || !back) {
        canvas.width = W
        canvas.height = H
        if (back) gl.deleteTexture(back)
        if (fb) gl.deleteFramebuffer(fb)
        back = tex(null)
        gl.bindTexture(gl.TEXTURE_2D, back)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        fb = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, back, 0)
      }
      const CX = W / 2
      const CY = H * 0.47
      // a layer grows from the zoom centre by z^p (the roll is the shaders')
      const grow = (p, x, y) => {
        const s = z ** p
        return [CX + (x - CX) * s, CY + (y - CY) * s, s]
      }
      const unit = Math.min(W, H)
      set(V_RES, W, H, t, -0.55 * unit * z ** 0.9)
      for (let i = 0; i < 2; i++) {
        const dir = i ? -1 : 1
        const ox = Math.sin(t * 0.045 + i * 2) * W * 0.04 * dir
        const oy = Math.cos(t * 0.037 + i) * H * 0.03
        const [x, y, s] = grow(0.5, -W * 0.08 + ox, -H * 0.08 + oy)
        set(V_FOG + i, x, y, W * 1.16 * s, H * 1.16 * s)
      }
      set(V_FOGA, fogA[0], fogA[1])
      CUBES.forEach((C, i) => {
        const ax = C.p + t * C.rx
        const ay = C.p * 0.7 + t * C.ry
        const [cx, cy, s] = grow(0.9 + C.depth * 2.4, W / 2 + C.x * W, H * 0.47 + C.y * H)
        // 0.75: the canvas version's mean perspective; nearer cubes sit nearer
        set(V_CUBE + i, cx, cy, C.s * unit * 0.75 * s, ((C.depth - 0.16) / 0.06) * 0.35 * unit * s)
        // view = Ry(ay) · Rx(ax) · cube; the shader wants its transpose
        const c = Math.cos(ax)
        const sn = Math.sin(ax)
        const cY = Math.cos(ay)
        const sY = Math.sin(ay)
        set(V_ROT + i * 3, cY, 0, -sY)
        set(V_ROT + i * 3 + 1, sY * sn, c, cY * sn)
        set(V_ROT + i * 3 + 2, sY * c, -sn, cY * c)
      })
      // the lights: heads as uniforms, trails as lines (drawn rolled, like the screen)
      const rc = Math.cos(roll)
      const rs = Math.sin(roll)
      const rolled = (x, y) => [CX + (x - CX) * rc - (y - CY) * rs, CY + (x - CX) * rs + (y - CY) * rc]
      let n6 = 0
      LIGHTS.forEach((L, i) => {
        const [r, g, b] = cols[i]
        const at = (tt) => {
          const q = lightAt(L, tt, W, H)
          const [x, y, s] = grow(0.8, q.x, q.y)
          return { x, y, k: q.k * s }
        }
        let prev = at(t - TRAIL * step)
        for (let n = TRAIL - 1; n >= 0; n--) {
          const cur = at(t - n * step)
          const a = (1 - n / TRAIL) ** 1.6 * 0.9 * show
          verts.set([...rolled(prev.x, prev.y), r, g, b, a, ...rolled(cur.x, cur.y), r, g, b, a], n6)
          n6 += 12
          prev = cur
        }
        set(V_HEAD + i, prev.x, prev.y, (13 * prev.k * H) / 900)
        set(V_COL + i, r, g, b)
      })
      set(V_ROLL, rc, rs, CX, CY)
      set(V_SHOW, show)

      // pass 1: the wall, then the trails over it
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, W, H)
      gl.disable(gl.BLEND)
      gl.useProgram(backP)
      gl.uniform4fv(gl.getUniformLocation(backP, 'v'), u)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fogTex[0])
      gl.uniform1i(gl.getUniformLocation(backP, 'fog0'), 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fogTex[1])
      gl.uniform1i(gl.getUniformLocation(backP, 'fog1'), 1)
      gl.bindVertexArray(vao.quad)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.useProgram(trailP)
      gl.uniform2f(gl.getUniformLocation(trailP, 'res'), W, H)
      gl.bindVertexArray(vao.lines)
      gl.bindBuffer(gl.ARRAY_BUFFER, lines)
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.LINES, 0, n6 / 6)
      gl.disable(gl.BLEND)
      // pass 2: the glass, onto the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.useProgram(glassP)
      gl.uniform4fv(gl.getUniformLocation(glassP, 'v'), u)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, back)
      gl.uniform1i(gl.getUniformLocation(glassP, 'back'), 0)
      gl.bindVertexArray(vao.quad)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    },
    dispose() {
      ;[...fogTex, back].forEach((t) => t && gl.deleteTexture(t))
      if (fb) gl.deleteFramebuffer(fb)
      gl.deleteBuffer(quad)
      gl.deleteBuffer(lines)
      gl.deleteVertexArray(vao.quad)
      gl.deleteVertexArray(vao.lines)
      ;[backP, glassP, trailP].forEach((p) => gl.deleteProgram(p))
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
