import { useEffect, useState } from 'react'
import PortalHeader from './components/PortalHeader.jsx'
import AgreementGate from './components/AgreementGate.jsx'
import BrowserNotice from './components/BrowserNotice.jsx'
import IosBlock from './components/IosBlock.jsx'
import AfricaBlock from './components/AfricaBlock.jsx'
import { detectBrowser } from './appraisal/devices.js'
import MainPage from './pages/MainPage.jsx'
import { useProbes } from './probes/useProbes.js'
import { setSound } from './fx/sfx.js'
import { isAfricaRegion, AFRICA_COUNTRY_NAMES } from './geo/africa.js'
import { detectVisitorCountry } from './geo/detector.js'

const searchParams = new URLSearchParams(location.search)
// ?dev skips the agreement and the appraisal ceremony and shows the dev panel.
const DEV = searchParams.has('dev')
// Support testing country blocking via URL param ?country=XX or ?test_country=XX
const TEST_COUNTRY = (searchParams.get('country') || searchParams.get('test_country') || '').trim().toUpperCase()
const IOS_BLOCKED = detectBrowser().ios && !DEV

function getInitialGeo() {
  if (TEST_COUNTRY) {
    return {
      isAfrica: isAfricaRegion(TEST_COUNTRY),
      countryName: AFRICA_COUNTRY_NAMES[TEST_COUNTRY] || TEST_COUNTRY,
    }
  }
  try {
    const cached = sessionStorage.getItem('ileak_geo_info')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed) return parsed
    }
  } catch {}
  return { isAfrica: false, countryName: '' }
}

export default function App() {
  const [agreed, setAgreed] = useState(DEV) // never persisted: read it every time
  const [sound, setSoundState] = useState(true)
  const [geoState, setGeoState] = useState(getInitialGeo)
  // Probes live at the app root so open ports/streams survive overlays.
  const { cards, tap, refresh } = useProbes()

  useEffect(() => setSound(sound), [sound])

  useEffect(() => {
    if (TEST_COUNTRY) return
    let active = true
    detectVisitorCountry().then((info) => {
      if (active && info) {
        setGeoState({
          isAfrica: Boolean(info.isAfrica),
          countryName: info.countryName || info.country,
        })
      }
    })
    return () => { active = false }
  }, [])

  return (
    <div className="app">
      <PortalHeader sound={sound} onSound={() => setSoundState(!sound)} />
      {geoState.isAfrica ? (
        <AfricaBlock country={geoState.countryName} />
      ) : IOS_BLOCKED ? (
        <IosBlock />
      ) : agreed ? (
        <MainPage cards={cards} tap={tap} refresh={refresh} dev={DEV} onShowGate={() => setAgreed(false)} />
      ) : (
        <AgreementGate onAccept={() => setAgreed(true)} dev={DEV} />
      )}
      {!IOS_BLOCKED && !geoState.isAfrica && <BrowserNotice />}
    </div>
  )
}
