export const QUALITIES = ['low', 'medium', 'high']
export const DEFAULT_QUALITY = 'high'

export function getQualityFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q')
  if (!q) return null // indicates not explicitly specified in URL yet
  if (QUALITIES.includes(q)) return q
  return DEFAULT_QUALITY
}

export function updateQualityUrl(q, replace = false) {
  const url = new URL(window.location.href)
  if (q === DEFAULT_QUALITY) {
    url.searchParams.set('q', 'high')
  } else {
    url.searchParams.set('q', q)
  }
  if (replace) {
    window.history.replaceState({}, '', url.toString())
  } else {
    window.history.pushState({}, '', url.toString())
  }
}
