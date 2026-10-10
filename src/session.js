// Small bits of state that must survive a reload or live in the URL.

const RELOAD_KEY = 'ileak:battery-reload'

// Chromium only re-reads the OS battery (UPower on Linux) when a page subscribes
// with no other subscribers left, so a reload is the real "re-check". The user has
// already agreed this session, so skip the gate once for that reload only.
export function reloadForBattery() {
  try {
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch { /* storage blocked: the gate will just show again */ }
  location.reload()
}

export function consumeBatteryReload() {
  try {
    const hit = sessionStorage.getItem(RELOAD_KEY) === '1'
    sessionStorage.removeItem(RELOAD_KEY)
    return hit
  } catch {
    return false
  }
}

// Dev mode lives in the URL (?dev) so it survives reloads and can be shared.
export const devFromUrl = () => new URLSearchParams(location.search).has('dev')

export function setDevInUrl(on) {
  const u = new URL(location.href)
  if (on) u.searchParams.set('dev', '1')
  else u.searchParams.delete('dev')
  history.replaceState(history.state, '', u)
}
