import { useSyncExternalStore } from 'react'

// How the result scenes render: like a PS2 (the default on every load) or a PS1.
// The switch sits at the top right of the header (components/RetroSwitch.jsx);
// scenes read it with useRetro() and re-render when it flips.
export const LOOK = {
  // lines: internal render height, upscaled with hard pixels
  ps1: { lines: 240, dither: true, snap: true, affine: true, bloom: false },
  ps2: { lines: 448, dither: false, snap: false, affine: false, bloom: true },
}

// For 2D-canvas scenes (useCanvas `size`): the mode's line count, as wide as the box.
export const CONSOLE_SIZE = Object.fromEntries(Object.entries(LOOK).map(([m, l]) => [m, (cw, ch) => {
  const h = Math.min(l.lines, ch)
  return [Math.max(1, Math.round((h * cw) / ch)), h]
}]))

let mode = 'ps2'
const subs = new Set()

export const getRetro = () => mode

export function setRetro(next) {
  if (next === mode || !LOOK[next]) return
  mode = next
  subs.forEach((fn) => fn())
}

function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const useRetro = () => useSyncExternalStore(subscribe, getRetro)
