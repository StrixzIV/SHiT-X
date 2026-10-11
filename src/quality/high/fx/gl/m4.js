// Just enough 4×4 matrix maths for the low-poly scenes. Column-major, like WebGL.

export const ident = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])

export function mul(a, b) {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
    }
  }
  return o
}

// mul(a, b, c, ...) left to right
export const chain = (...ms) => ms.reduce((a, b) => mul(a, b))

export function move(x, y, z) {
  const m = ident()
  m[12] = x
  m[13] = y
  m[14] = z
  return m
}

export function size(x, y = x, z = x) {
  const m = ident()
  m[0] = x
  m[5] = y
  m[10] = z
  return m
}

export function turnX(a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])
}

export function turnY(a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])
}

export function turnZ(a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}

export function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2)
  const nf = 1 / (near - far)
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0])
}

export function lookAt(eye, at, up = [0, 1, 0]) {
  let zx = eye[0] - at[0]
  let zy = eye[1] - at[1]
  let zz = eye[2] - at[2]
  let l = Math.hypot(zx, zy, zz) || 1
  zx /= l
  zy /= l
  zz /= l
  let xx = up[1] * zz - up[2] * zy
  let xy = up[2] * zx - up[0] * zz
  let xz = up[0] * zy - up[1] * zx
  l = Math.hypot(xx, xy, xz) || 1
  xx /= l
  xy /= l
  xz /= l
  const yx = zy * xz - zz * xy
  const yy = zz * xx - zx * xz
  const yz = zx * xy - zy * xx
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ])
}

// Apply m to a point (w = 1) or a direction (w = 0).
export function apply(m, x, y, z, w = 1) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w, m[2] * x + m[6] * y + m[10] * z + m[14] * w]
}
