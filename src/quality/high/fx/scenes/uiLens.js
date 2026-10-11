// A small GLSL displacement field, applied to the live HTML via an SVG filter.
// Red/green encode source-coordinate offsets. Rendering the field once avoids
// capturing/rasterizing the result DOM every frame: text, scrolling and buttons
// stay live. The orbit supplies the same hole centre/radius as the scene shader.
const NS = 'http://www.w3.org/2000/svg'
const SIZE = 128
const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'
const FRAG = `
precision mediump float;
uniform float uSpin;
void main() {
  // Canvas/SVG image coordinates run downwards; GL fragment coordinates run up.
  vec2 q = vec2(gl_FragCoord.x, ${SIZE}.0 - gl_FragCoord.y) / ${SIZE}.0 * 2.0 - 1.0;
  float r = length(q);
  float edge = 1.0 - smoothstep(0.65, 1.0, r);
  // Softened point lens plus swirl, with a neutral border outside the field.
  vec2 bend = (0.35 * q + uSpin * vec2(-q.y, q.x)) / (dot(q, q) + 0.18) * edge;
  gl_FragColor = vec4(clamp(0.5 + bend, 0.0, 1.0), 0.5, 1.0);
}`

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

// Also used for pointer coordinates and the no-WebGL fallback. This is the
// displacement shader's source lookup, rather than a second orbit simulation.
function field(x, y, spin) {
  const edge = 1 - smooth(0.65, 1, Math.hypot(x, y))
  const k = edge / (x * x + y * y + 0.18)
  return [clamp((0.35 * x - spin * y) * k, -0.5, 0.5), clamp((0.35 * y + spin * x) * k, -0.5, 0.5)]
}

let maps
let nextId = 0

function makeMaps() {
  if (maps) return maps
  const cv = document.createElement('canvas')
  cv.width = cv.height = SIZE
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true })
  if (gl) {
    const shaders = []
    const compile = (type, source) => {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, source)
      gl.compileShader(sh)
      shaders.push(sh)
      return sh
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    const buffer = gl.createBuffer()
    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const p = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(p)
      gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0)
      gl.viewport(0, 0, SIZE, SIZE)
      const spin = gl.getUniformLocation(prog, 'uSpin')
      maps = [0.1, 0.55].map(value => {
        gl.uniform1f(spin, value)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        return cv.toDataURL()
      })
    }
    gl.deleteBuffer(buffer)
    gl.deleteProgram(prog)
    shaders.forEach(sh => gl.deleteShader(sh))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  if (!maps) {
    const fallback = document.createElement('canvas')
    fallback.width = fallback.height = SIZE
    const ctx = fallback.getContext('2d')
    if (!ctx) return null
    maps = [0.1, 0.55].map(spin => {
      const image = ctx.createImageData(SIZE, SIZE)
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const [r, g] = field((x + 0.5) / SIZE * 2 - 1, (y + 0.5) / SIZE * 2 - 1, spin)
          const i = (y * SIZE + x) * 4
          image.data[i] = Math.round((0.5 + r) * 255)
          image.data[i + 1] = Math.round((0.5 + g) * 255)
          image.data[i + 2] = 128
          image.data[i + 3] = 255
        }
      }
      ctx.putImageData(image, 0, 0)
      return fallback.toDataURL()
    })
  }
  return maps
}

function node(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag)
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  return el
}

export function createUiLens(el) {
  const images = makeMaps()
  if (!images) return null
  const id = `l7-ui-lens-${++nextId}`
  const svg = node('svg', { width: 0, height: 0, 'aria-hidden': true, 'data-ui-lens': '' })
  svg.style.cssText = 'position:fixed;pointer-events:none;overflow:hidden'
  const defs = node('defs')
  const filter = node('filter', { id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' })
  const neutral = node('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'neutral' })
  const image = node('feImage', { href: images[0], preserveAspectRatio: 'none', result: 'gravity' })
  // Outside the field image, 50% gray produces no displacement.
  const merge = node('feMerge', { result: 'field' })
  merge.append(node('feMergeNode', { in: 'neutral' }), node('feMergeNode', { in: 'gravity' }))
  const bias = node('feComponentTransfer', { in: 'field', result: 'anchored' })
  const red = node('feFuncR', { type: 'linear', slope: 1, intercept: 0 })
  const green = node('feFuncG', { type: 'linear', slope: 1, intercept: 0 })
  bias.append(red, green)
  const displace = node('feDisplacementMap', { in: 'SourceGraphic', in2: 'anchored', xChannelSelector: 'R', yChannelSelector: 'G', scale: 0 })
  filter.append(neutral, image, merge, bias, displace)
  defs.append(filter)
  svg.append(defs)
  el.parentElement.append(svg)
  const previousFilter = el.style.filter
  let active = false
  let params = { x: 0, y: 0, radius: 1, scale: 0, spin: 0.1, bx: 0, by: 0 }
  let falling = false
  let width = 0
  let height = 0

  return {
    update({ matrix, x, y, size, hole, cw, ch, strength, fall, anchor }) {
      if (cw !== width || ch !== height) {
        width = cw
        height = ch
        const pad = Math.max(cw, ch) * 0.6
        for (const [key, value] of Object.entries({ x: -pad, y: -pad, width: cw + 2 * pad, height: ch + 2 * pad })) filter.setAttribute(key, value)
      }
      const local = matrix.inverse().transformPoint({ x: hole.x - x, y: hole.y - y })
      const distance = Math.hypot(hole.x - x, hole.y - y) / hole.r
      const reach = 1.8 + 1.3 * smooth(1.1, 3, distance)
      let radius = hole.r * reach / Math.max(size, 0.02)
      if (fall) {
        radius = Math.min(radius, Math.max(cw, ch) * 0.85)
        const d = Math.hypot(local.x, local.y) || 1
        const pull = Math.min(1, radius * 0.65 / d)
        local.x *= pull
        local.y *= pull
      }
      const cx = local.x + cw / 2
      const cy = local.y + ch / 2
      const scale = Math.min(Math.min(cw, ch) * (fall ? 0.8 : 0.75), hole.r * 0.9 / Math.max(size, 0.02)) * strength
      const spin = fall ? 0.55 : 0.1
      const [bx, by] = anchor ? field((anchor.x - cx) / radius, (anchor.y - cy) / radius, spin) : [0, 0]
      params = { x: cx, y: cy, radius, scale, spin, bx, by }
      if (!!fall !== falling) {
        falling = !!fall
        image.setAttribute('href', images[falling ? 1 : 0])
      }
      image.setAttribute('x', cx - radius)
      image.setAttribute('y', cy - radius)
      image.setAttribute('width', radius * 2)
      image.setAttribute('height', radius * 2)
      red.setAttribute('intercept', -bx)
      green.setAttribute('intercept', -by)
      displace.setAttribute('scale', scale)
      if (!active) {
        active = true
        el.dataset.lensed = ''
      }
      const nextFilter = scale > 0.1 ? `url(#${id})` : previousFilter
      if (el.style.filter !== nextFilter) el.style.filter = nextFilter
    },
    sourceAt(x, y) {
      const p = params
      const [dx, dy] = field((x - p.x) / p.radius, (y - p.y) / p.radius, p.spin)
      return { x: x + p.scale * clamp(dx - p.bx, -0.5, 0.5), y: y + p.scale * clamp(dy - p.by, -0.5, 0.5) }
    },
    dispose() {
      el.style.filter = previousFilter
      delete el.dataset.lensed
      svg.remove()
    },
  }
}
