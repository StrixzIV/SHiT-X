import { isAfricaRegion, AFRICA_COUNTRY_NAMES } from './africa.js'

const CACHE_KEY = 'ileak_geo_info'

/**
 * Detects visitor country code using free public IP geolocation APIs.
 * Works 100% on Firebase Free (Spark) tier with zero backend or billing setup.
 *
 * @returns {Promise<{ country: string, countryName: string, isAfrica: boolean }>}
 */
export async function detectVisitorCountry() {
  // 1. Manual query override for testing (?country=EG or ?test_country=NG)
  try {
    const params = new URLSearchParams(window.location.search)
    const testCountry = (params.get('country') || params.get('test_country') || '').trim().toUpperCase()
    if (testCountry) {
      const isAfrica = isAfricaRegion(testCountry)
      return {
        country: testCountry,
        countryName: AFRICA_COUNTRY_NAMES[testCountry] || testCountry,
        isAfrica,
      }
    }
  } catch {
    // ignore
  }

  // 2. Check session storage cache so we don't spam the API on page refreshes
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.country) {
        return parsed
      }
    }
  } catch {
    // sessionStorage might be disabled in private mode
  }

  // 3. Fast primary lookup: api.country.is (fastest, CORS enabled, no API key)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch('https://api.country.is/', { signal: controller.signal })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      const country = (data.country || '').trim().toUpperCase()
      const isAfrica = isAfricaRegion(country)
      const result = {
        country,
        countryName: AFRICA_COUNTRY_NAMES[country] || country || 'Unknown',
        isAfrica,
      }
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(result))
      } catch {}
      return result
    }
  } catch {
    // fallback to secondary provider
  }

  // 4. Secondary lookup: ipwho.is (includes continent_code and country name)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch('https://ipwho.is/', { signal: controller.signal })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      const country = (data.country_code || '').trim().toUpperCase()
      const isAfrica = data.continent_code === 'AF' || isAfricaRegion(country)
      const result = {
        country,
        countryName: data.country || AFRICA_COUNTRY_NAMES[country] || country || 'Unknown',
        isAfrica,
      }
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(result))
      } catch {}
      return result
    }
  } catch {
    // offline or network failure
  }

  // Fallback: If network is completely unreachable, default to allowed
  return {
    country: 'UNKNOWN',
    countryName: 'Unknown',
    isAfrica: false,
  }
}
