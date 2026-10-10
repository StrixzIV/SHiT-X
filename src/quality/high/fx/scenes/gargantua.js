// The L7 shot: Gargantua framed from its top-right, camera rolled a little. The
// shader (L7Gargantua.jsx) and the result card's orbit (orbit.js) both place the
// hole with this, so the card passes behind the same shadow the shader draws.

export const ROLL = 0.15 // camera roll, radians (counter-clockwise on screen)

// Shadow radius on screen per unit of focal length (uv units, height = 1): from
// ~19 Rs out, the shadow plus its photon ring spans about 7.9°.
const SHADOW_PER_FOCAL = 0.138

// Hole centre and shadow radius in CSS px, inside a w × h scene.
export function shot(w, h) {
  const r = Math.min(0.36 * h, 0.6 * w)
  return { x: 0.2 * w, y: h - 0.15 * r, r }
}

// The same shot as shader uniforms: hole centre in uv units (y up), focal length, roll.
export function shotUniforms(w, h) {
  const s = shot(w, h)
  return [(s.x - w / 2) / h, (h / 2 - s.y) / h, s.r / h / SHADOW_PER_FOCAL, ROLL]
}
