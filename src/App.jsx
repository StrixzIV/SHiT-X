import { useEffect, useState } from 'react'
import PortalHeader from './components/PortalHeader.jsx'
import AgreementGate from './components/AgreementGate.jsx'
import MainPage from './pages/MainPage.jsx'
import { useProbes } from './probes/useProbes.js'
import { setSound } from './fx/sfx.js'

// ?dev skips the agreement and the appraisal ceremony and shows the dev panel.
const DEV = new URLSearchParams(location.search).has('dev')

export default function App() {
  const [agreed, setAgreed] = useState(DEV) // never persisted: read it every time
  const [sound, setSoundState] = useState(true)
  // Probes live at the app root so open ports/streams survive overlays.
  const { cards, tap, refresh } = useProbes()

  useEffect(() => setSound(sound), [sound])

  return (
    <div className="app">
      <PortalHeader sound={sound} onSound={() => setSoundState(!sound)} />
      {agreed ? (
        <MainPage cards={cards} tap={tap} refresh={refresh} dev={DEV} onShowGate={() => setAgreed(false)} />
      ) : (
        <AgreementGate onAccept={() => setAgreed(true)} dev={DEV} />
      )}
    </div>
  )
}
