import { useEffect, useState } from 'react'
import PortalHeader from './components/PortalHeader.jsx'
import AgreementGate from './components/AgreementGate.jsx'
import BrowserNotice from './components/BrowserNotice.jsx'
import IosBlock from './components/IosBlock.jsx'
import { detectBrowser } from './appraisal/devices.js'
import MainPage from './pages/MainPage.jsx'
import { useProbes } from './probes/useProbes.js'
import { setSound } from './fx/sfx.js'

// ?dev skips the agreement and the appraisal ceremony and shows the dev panel.
const DEV = new URLSearchParams(location.search).has('dev')
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
      {IOS_BLOCKED ? (
        <IosBlock />
      ) : agreed ? (
        <MainPage cards={cards} tap={tap} refresh={refresh} dev={DEV} onShowGate={() => setAgreed(false)} />
      ) : (
        <AgreementGate onAccept={() => setAgreed(true)} dev={DEV} />
      )}
      {!IOS_BLOCKED && <BrowserNotice />}
    </div>
  )
}
