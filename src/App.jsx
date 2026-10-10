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

const searchParams = new URLSearchParams(location.search)
// ?dev skips the agreement and the appraisal ceremony and shows the dev panel.
const DEV = searchParams.has('dev')
// Support testing country blocking in dev via ?country=XX or ?test_country=XX
const TEST_COUNTRY = (searchParams.get('country') || searchParams.get('test_country') || '').toUpperCase()
const AFRICA_BLOCKED = isAfricaRegion(TEST_COUNTRY)
// iOS can't report anything we need, so it gets a joke screen instead (?dev still bypasses it).
const IOS_BLOCKED = detectBrowser().ios && !DEV

export default function App() {
  const [agreed, setAgreed] = useState(DEV) // never persisted: read it every time
  const [sound, setSoundState] = useState(true)
  // Probes live at the app root so open ports/streams survive overlays.
  const { cards, tap, refresh } = useProbes()

  useEffect(() => setSound(sound), [sound])

  return (
    <div className="app">
      <PortalHeader sound={sound} onSound={() => setSoundState(!sound)} />
      {AFRICA_BLOCKED ? (
        <AfricaBlock country={AFRICA_COUNTRY_NAMES[TEST_COUNTRY] || TEST_COUNTRY} />
      ) : IOS_BLOCKED ? (
        <IosBlock />
      ) : agreed ? (
        <MainPage cards={cards} tap={tap} refresh={refresh} dev={DEV} onShowGate={() => setAgreed(false)} />
      ) : (
        <AgreementGate onAccept={() => setAgreed(true)} dev={DEV} />
      )}
      {!IOS_BLOCKED && !AFRICA_BLOCKED && <BrowserNotice />}
    </div>
  )
}
