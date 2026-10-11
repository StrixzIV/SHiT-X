// Read the scene that is on screen now, rather than the screen on which an
// earlier click/LLM request started. The floating window and result card are
// separate objects; the card disappearing does not mean she disappeared.
export function readSurroundings(inSpace = false) {
  const overlay = document.querySelector('.calc')
  const card = overlay?.querySelector('.result')
  const buddy = document.querySelector('.cp-float-buddy')
  const onCard = !!document.querySelector('.stowaway')
  const phase = overlay
    ? ['loading', 'scene', 'result'].find((p) => overlay.classList.contains(`phase-${p}`)) || 'scene'
    : null
  const motion = inSpace
    ? buddy?.dataset.flight || buddy?.dataset.motion || (buddy?.hasAttribute('data-gone') || (onCard && card?.hasAttribute('data-gone')) ? 'gone' : 'orbit')
    : 'docked'
  return {
    screen: overlay ? 'calculation' : document.querySelector('.gate') ? 'agreement' : document.querySelector('.ios-block, .africa-block') ? 'blocked' : 'main',
    phase,
    level: overlay?.dataset.level ? Number(overlay.dataset.level) : null,
    scene: overlay?.dataset.scene || null,
    verdict: overlay?.dataset.verdict || null,
    volts: overlay?.dataset.volts || null,
    self: {
      location: inSpace ? onCard ? 'on-result-card' : 'independent-window-in-space' : 'desktop-corner',
      motion,
      visible: motion !== 'gone' && !buddy?.inert,
    },
    resultCard: card ? { motion: card.hasAttribute('data-gone') ? 'swallowed' : card.hasAttribute('data-held') ? 'held' : card.hasAttribute('data-orbit') ? 'orbiting' : 'docked', certificate: !!card.querySelector('.cert') } : null,
    tabVisible: !document.hidden,
  }
}

// Certificates and drifting animations do not invalidate unrelated remarks.
// A new scene or leaving it does. In L7 she can keep shouting as her window
// passes into/out of the hole; invisibility does not make her inaudible.
export const surroundingsKey = (s) => [s.screen, s.phase, s.level, s.self.location, s.resultCard?.motion === 'swallowed' ? 'swallowed' : 'visible'].join(':')

export function canReact(event, s) {
  if (!s.tabVisible) return false
  if (!s.self.visible && !(s.phase === 'result' && s.level === 7)) return false
  if (event === 'l7:released' || event === 'again') return s.screen === 'main'
  if (event.startsWith('l7:')) return s.phase === 'result' && s.level === 7
  if (s.screen !== 'calculation') return !['calc', 'scene', 'result', 'cert'].includes(event)
  if (s.phase === 'loading') return event === 'calc'
  if (s.phase === 'scene') return ['scene', 'poke', 'return'].includes(event)
  if (event === 'cert' && s.resultCard?.motion === 'swallowed') return false
  return ['result', 'cert', 'poke', 'return'].includes(event)
}
