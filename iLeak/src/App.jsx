import { useEffect, useState } from 'react'
import PortalHeader from './components/PortalHeader.jsx'
import ProbePage from './pages/ProbePage.jsx'
import BriefingPage from './pages/BriefingPage.jsx'
import { useProbes } from './probes/useProbes.js'
import { setSound } from './fx/sfx.js'

export default function App() {
  const [hash, setHash] = useState(location.hash)
  const [sound, setSoundState] = useState(true)
  const [voucher, setVoucher] = useState(false)
  // Probes live at the app root so open ports/streams survive page switches.
  const { cards, tap } = useProbes()

  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])

  useEffect(() => setSound(sound), [sound])

  const page = hash.startsWith('#/briefing') ? 'briefing' : 'probe'

  return (
    <div className={`app page-${page}`}>
      <PortalHeader page={page} sound={sound} onSound={() => setSoundState(!sound)} dark={page === 'probe'} />
      {page === 'probe' ? (
        <ProbePage cards={cards} tap={tap} voucher={voucher} />
      ) : (
        <BriefingPage voucher={voucher} setVoucher={setVoucher} />
      )}
    </div>
  )
}
