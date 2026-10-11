import { apply } from './m4.js'

// Flat-shaded triangle soup for the low-poly scenes: every vertex carries
// position, face normal, colour and uv (11 floats). Add shapes, then hand
// `g.data` to the renderer once (static) or every frame (dynamic).
export const STRIDE = 11

export function geo() {
  const data = []
  const g = {
    data,
    // one triangle; colour [r, g, b] in 0..1
    tri(a, b, c, col, uv = [[0, 0], [1, 0], [1, 1]]) {
      const ux = b[0] - a[0]
      const uy = b[1] - a[1]
      const uz = b[2] - a[2]
      const vx = c[0] - a[0]
      const vy = c[1] - a[1]
      const vz = c[2] - a[2]
      let nx = uy * vz - uz * vy
      let ny = uz * vx - ux * vz
      let nz = ux * vy - uy * vx
      const l = Math.hypot(nx, ny, nz) || 1
      nx /= l
      ny /= l
      nz /= l
      ;[a, b, c].forEach((p, i) => data.push(p[0], p[1], p[2], nx, ny, nz, col[0], col[1], col[2], uv[i][0], uv[i][1]))
      return g
    },
    // a, b, c, d counter-clockwise seen from the front
    quad(a, b, c, d, col, uv = [[0, 1], [1, 1], [1, 0], [0, 0]]) {
      g.tri(a, b, c, col, [uv[0], uv[1], uv[2]])
      return g.tri(a, c, d, col, [uv[0], uv[2], uv[3]])
    },
    // axis-aligned box centred on its base: x, z centre, y = bottom; `m` places it
    box({ x = 0, y = 0, z = 0, w = 1, h = 1, d = 1, col = [1, 1, 1], top, m } = {}) {
      const x0 = x - w / 2
      const x1 = x + w / 2
      const z0 = z - d / 2
      const z1 = z + d / 2
      const y1 = y + h
      const P = (px, py, pz) => (m ? apply(m, px, py, pz) : [px, py, pz])
      const c = col
      g.quad(P(x0, y, z1), P(x1, y, z1), P(x1, y1, z1), P(x0, y1, z1), c) // front
      g.quad(P(x1, y, z0), P(x0, y, z0), P(x0, y1, z0), P(x1, y1, z0), c) // back
      g.quad(P(x1, y, z1), P(x1, y, z0), P(x1, y1, z0), P(x1, y1, z1), c) // right
      g.quad(P(x0, y, z0), P(x0, y, z1), P(x0, y1, z1), P(x0, y1, z0), c) // left
      g.quad(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0), top ?? c) // top
      return g.quad(P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1), c) // bottom
    },
    // upright cylinder / cone (r2 = top radius), base at y
    tube({ x = 0, y = 0, z = 0, r = 0.5, r2 = r, h = 1, sides = 6, col = [1, 1, 1], caps = true, m } = {}) {
      const P = (px, py, pz) => (m ? apply(m, px, py, pz) : [px, py, pz])
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * Math.PI * 2
        const a1 = ((i + 1) / sides) * Math.PI * 2
        const b0 = P(x + Math.cos(a0) * r, y, z + Math.sin(a0) * r)
        const b1 = P(x + Math.cos(a1) * r, y, z + Math.sin(a1) * r)
        const t0 = P(x + Math.cos(a0) * r2, y + h, z + Math.sin(a0) * r2)
        const t1 = P(x + Math.cos(a1) * r2, y + h, z + Math.sin(a1) * r2)
        g.quad(b1, b0, t0, t1, col)
        if (caps) {
          if (r2 > 0) g.tri(P(x, y + h, z), t1, t0, col)
          g.tri(P(x, y, z), b0, b1, col)
        }
      }
      return g
    },
    // low-poly sphere (rings × sides), centred; shade(h) colours each band by height (-1 bottom … 1 top)
    ball({ x = 0, y = 0, z = 0, r = 0.5, rings = 4, sides = 6, col = [1, 1, 1], shade, sy = 1, m } = {}) {
      const P = (px, py, pz) => (m ? apply(m, px, py, pz) : [px, py, pz])
      const pt = (i, j) => {
        const v = (i / rings) * Math.PI
        const u = (j / sides) * Math.PI * 2
        return P(x + Math.sin(v) * Math.cos(u) * r, y - Math.cos(v) * r * sy, z + Math.sin(v) * Math.sin(u) * r)
      }
      for (let i = 0; i < rings; i++) {
        const tint = shade ? shade(-Math.cos(((i + 0.5) / rings) * Math.PI)) : col
        for (let j = 0; j < sides; j++) {
          const a = pt(i, j)
          const b = pt(i, j + 1)
          const c = pt(i + 1, j + 1)
          const d = pt(i + 1, j)
          if (i === 0) g.tri(a, d, c, tint)
          else if (i === rings - 1) g.tri(a, c, b, tint)
          else g.quad(a, d, c, b, tint)
        }
      }
      return g
    },
    // a beam between two points with a square section (wires, bones, bolts)
    beam(p, q, w = 0.1, col = [1, 1, 1]) {
      const dx = q[0] - p[0]
      const dy = q[1] - p[1]
      const dz = q[2] - p[2]
      const l = Math.hypot(dx, dy, dz) || 1
      // any vector not parallel to the beam, then two perpendiculars
      const ax = Math.abs(dy / l) < 0.9 ? [0, 1, 0] : [1, 0, 0]
      let ux = (dy * ax[2] - dz * ax[1]) / l
      let uy = (dz * ax[0] - dx * ax[2]) / l
      let uz = (dx * ax[1] - dy * ax[0]) / l
      const ul = Math.hypot(ux, uy, uz) || 1
      ux = (ux / ul) * (w / 2)
      uy = (uy / ul) * (w / 2)
      uz = (uz / ul) * (w / 2)
      const vx = ((dy * uz - dz * uy) / l)
      const vy = ((dz * ux - dx * uz) / l)
      const vz = ((dx * uy - dy * ux) / l)
      const corner = (o, s, t) => [o[0] + ux * s + vx * t, o[1] + uy * s + vy * t, o[2] + uz * s + vz * t]
      const ring = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
      for (let i = 0; i < 4; i++) {
        const [s0, t0] = ring[i]
        const [s1, t1] = ring[(i + 1) % 4]
        g.quad(corner(p, s0, t0), corner(p, s1, t1), corner(q, s1, t1), corner(q, s0, t0), col)
      }
      return g
    },
    // camera-facing quad at p (axes from the renderer: r.right, r.up)
    sprite(p, right, up, sx, sy, col = [1, 1, 1], uv) {
      const c = (s, t) => [p[0] + right[0] * sx * s + up[0] * sy * t, p[1] + right[1] * sx * s + up[1] * sy * t, p[2] + right[2] * sx * s + up[2] * sy * t]
      return g.quad(c(-1, -1), c(1, -1), c(1, 1), c(-1, 1), col, uv)
    },
    // y = fn(x, z) height field over a w × d grid of n × n cells, centred on (x, z)
    field({ x = 0, z = 0, w = 10, d = 10, n = 10, fn = () => 0, col = () => [1, 1, 1] }) {
      const P = (i, j) => {
        const px = x - w / 2 + (i / n) * w
        const pz = z - d / 2 + (j / n) * d
        return [px, fn(px, pz), pz]
      }
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const a = P(i, j + 1)
          const b = P(i + 1, j + 1)
          const c = P(i + 1, j)
          const e = P(i, j)
          g.quad(a, b, c, e, col((a[0] + c[0]) / 2, (a[2] + c[2]) / 2))
        }
      }
      return g
    },
  }
  return g
}

// '#rrggbb' → [r, g, b] in 0..1
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
