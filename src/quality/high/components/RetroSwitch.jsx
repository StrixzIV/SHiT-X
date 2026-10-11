import { setRetro, useRetro } from '../retro.js'

// PS1 / PS2 look for the result scenes (retro.js). Every load starts on PS2.
export default function RetroSwitch() {
  const mode = useRetro()
  return (
    <div className="retro-switch" role="group" aria-label="กราฟิกฉากผลลัพธ์" title="กราฟิกฉากผลลัพธ์: PS1 หรือ PS2">
      {['ps1', 'ps2'].map((m) => (
        <button key={m} type="button" className={mode === m ? 'on' : ''} aria-pressed={mode === m} onClick={() => setRetro(m)}>
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
