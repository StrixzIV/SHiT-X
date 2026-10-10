import { useCallback, useEffect, useState } from 'react'
import { ADAPTER_FACTORIES } from './index.js'

// Each adapter: { id, name, label, port, mult|xmult, support(), start?(update) → stop,
//                 arm?(update) (needs a user gesture), tap?(update, state), refresh?(update) }
// update(patch) merges into { supported, armed, live, reading, detail, port?, mult?, xmult? }
const adapters = ADAPTER_FACTORIES.map((f) => f())

function initial(a) {
  const s = a.support()
  return { supported: s.ok, armed: !a.arm, live: false, reading: 0, detail: s.ok ? a.hint ?? 'กำลังฟัง…' : s.why }
}

export function useProbes() {
  const [states, setStates] = useState(() => Object.fromEntries(adapters.map((a) => [a.id, initial(a)])))

  const updater = useCallback(
    (id) => (patch) => setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } })),
    [],
  )

  useEffect(() => {
    const stops = adapters.filter((a) => a.support().ok && a.start).map((a) => a.start(updater(a.id)))
    return () => stops.forEach((stop) => stop?.())
  }, [updater])

  const tap = useCallback(
    async (id) => {
      const a = adapters.find((x) => x.id === id)
      const state = states[id]
      if (!state.supported) return
      try {
        if (a.tap) a.tap(updater(id), state)
        else if (a.arm) await a.arm(updater(id))
      } catch (e) {
        updater(id)({ detail: e.name === 'NotFoundError' ? 'ไม่ได้เลือกอุปกรณ์' : e.name === 'NotAllowedError' ? 'ไม่ได้รับอนุญาต' : e.message })
      }
    },
    [states, updater],
  )

  const refresh = useCallback(async (id) => {
    const a = adapters.find((x) => x.id === id)
    if (a?.support().ok) await a.refresh?.(updater(id))
  }, [updater])

  const cards = adapters.map((a) => {
    const s = states[a.id]
    return { ...a, ...s, port: s.port ?? a.port, mult: 'mult' in s ? s.mult : a.mult, xmult: 'xmult' in s ? s.xmult : a.xmult }
  })
  return { cards, tap, refresh }
}
