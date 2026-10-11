import { useEffect, useRef, useState } from 'react'
import PortalHeader from './components/PortalHeader.jsx'
import AgreementGate from './components/AgreementGate.jsx'
import BrowserNotice from './components/BrowserNotice.jsx'
import IosBlock from './components/IosBlock.jsx'
import AfricaBlock from './components/AfricaBlock.jsx'
import DevPanel from './components/DevPanel.jsx'
import FpsMeter from './components/FpsMeter.jsx'
import Taskbar from './components/Taskbar.jsx'
import { schemeSound } from './sound/scheme.js'
import { detectBrowser } from '../../appraisal/devices.js'
import MainPage from './pages/MainPage.jsx'
import { useProbes } from '../../probes/useProbes.js'
import { setSound } from './fx/sfx.js'
import { consumeBatteryReload, devFromUrl, setDevInUrl } from './session.js'
import { DEFAULT_KNOBS, DEFAULT_SKIPS } from './devDefaults.js'
import { AFRICA_COUNTRY_NAMES, isAfricaRegion } from '../../geo/africa.js'
import { detectVisitorCountry } from '../../geo/detector.js'

const IOS = detectBrowser().ios
// Region block (feat/geo-blockade): test with ?country=XX or ?test_country=XX.
const TEST_COUNTRY = (new URLSearchParams(location.search).get('country') || new URLSearchParams(location.search).get('test_country') || '').trim().toUpperCase()

function initialGeo() {
  if (TEST_COUNTRY) return { isAfrica: isAfricaRegion(TEST_COUNTRY), countryName: AFRICA_COUNTRY_NAMES[TEST_COUNTRY] || TEST_COUNTRY }
  try {
    const cached = JSON.parse(sessionStorage.getItem('ileak_geo_info') || 'null')
    if (cached) return cached
  } catch { /* storage blocked */ }
  return { isAfrica: false, countryName: '' }
}
// Read once per page load (not in a state initializer: StrictMode would run it twice).
const START_DEV = devFromUrl()
const SKIP_GATE_ONCE = consumeBatteryReload()

// The High-quality tree (see quality/QualityRouter.jsx).
export default function App({ quality, onQualityChange, onOpenQualityGate }) {
  // Dev mode: the DEV tickbox (top right) or ?dev. Its panel holds the skips,
  // the knobs and the stress tests; everything dev-only is ignored when it's off.
  const [dev, setDev] = useState(START_DEV)
  const [panel, setPanel] = useState(START_DEV)
  const [skips, setSkips] = useState(DEFAULT_SKIPS)
  const [knobs, setKnobs] = useState(DEFAULT_KNOBS)
  const [info, setInfo] = useState(null) // live numbers reported by the main page
  const main = useRef(null) // { fire, sequence, stop, replay } from the main page
  const randomTimer = useRef(null)

  // The agreement is never persisted: it shows on every load (except right after
  // a battery re-check reload, which the user triggered after agreeing).
  const [agreed, setAgreed] = useState(SKIP_GATE_ONCE)
  const [sound, setSoundState] = useState(true)
  const [overlay, setOverlay] = useState(false)
  const [geo, setGeo] = useState(initialGeo)
  // Probes live at the app root so open ports/streams survive overlays.
  const { cards, tap, refresh } = useProbes()

  useEffect(() => setSound(sound), [sound])
  useEffect(() => {
    if (TEST_COUNTRY) return
    let active = true
    detectVisitorCountry().then((info) => {
      if (active && info) setGeo({ isAfrica: Boolean(info.isAfrica), countryName: info.countryName || info.country })
    })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => () => clearInterval(randomTimer.current), [])

  const toggleDev = (on) => {
    setDev(on)
    setPanel(on)
    setDevInUrl(on)
  }

  const stopRandom = () => {
    clearInterval(randomTimer.current)
    randomTimer.current = null
  }
  // Stress: a new random wattage (5 W … 1e42 W, log-uniform) every 0.35 s for 10 s.
  const randomWatts = () => {
    stopRandom()
    const end = Date.now() + 10000
    randomTimer.current = setInterval(() => {
      if (Date.now() > end) return stopRandom()
      setKnobs((k) => ({ ...k, watts: Math.round(5 * 10 ** (Math.random() * 41.3)) }))
    }, 350)
  }
  const maxChaos = () => {
    stopRandom()
    setKnobs((k) => ({ ...k, watts: 1e42, fake: 30, power: 'on' }))
    setTimeout(() => main.current?.fire(null), 150) // let the new knobs render first
  }
  const stopAll = () => {
    stopRandom()
    main.current?.stop()
  }

  // iOS can't report charging (or anything else we need): joke screen, no way through
  // except the dev skip.
  const geoBlocked = geo.isAfrica && !(dev && skips.geo)
  const iosBlocked = !geoBlocked && IOS && !(dev && skips.ios)
  const showGate = !geoBlocked && !iosBlocked && !agreed && !(dev && skips.gate)
  const desktopReady = !geoBlocked && !iosBlocked && !showGate
  useEffect(() => {
    if (desktopReady) return schemeSound('startup')
  }, [desktopReady])
  useEffect(() => {
    if (geoBlocked || iosBlocked) return schemeSound('critical')
  }, [geoBlocked, iosBlocked])

  return (
    <div className="app">
      <PortalHeader
        dev={dev}
        onDev={toggleDev}
        panel={panel}
        onPanel={() => setPanel(!panel)}
      >
        {dev && panel && (
          <DevPanel
            skips={skips}
            setSkips={setSkips}
            knobs={knobs}
            setKnobs={setKnobs}
            info={info}
            main={main}
            onRandomWatts={randomWatts}
            onMaxChaos={maxChaos}
            onStop={stopAll}
            onShowGate={() => {
              setSkips((s) => ({ ...s, gate: false }))
              setAgreed(false)
            }}
            onClose={() => setPanel(false)}
          />
        )}
      </PortalHeader>

      {geoBlocked ? (
        <AfricaBlock country={geo.countryName} />
      ) : iosBlocked ? (
        <IosBlock />
      ) : showGate ? (
        <AgreementGate onAccept={() => setAgreed(true)} dev={dev} />
      ) : (
        <MainPage
          cards={cards}
          tap={tap}
          refresh={refresh}
          dev={dev}
          skips={skips}
          knobs={knobs}
          apiRef={main}
          onInfo={setInfo}
          onOverlayChange={setOverlay}
        />
      )}
      <Taskbar
        key={showGate || overlay ? 'covered' : 'desktop'}
        sound={sound}
        onSound={() => setSoundState((value) => !value)}
        quality={quality}
        onQualityChange={onQualityChange}
        onOpenQualityGate={onOpenQualityGate}
        cards={cards}
        active={desktopReady}
        covered={showGate || overlay}
      />
      {!geoBlocked && !iosBlocked && <BrowserNotice />}
      {dev && knobs.fps && <FpsMeter />}
    </div>
  )
}
