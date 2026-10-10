import { useEffect, useState } from 'react'
import QualityRouter from './quality/QualityRouter.jsx'
import QualitySelectGate from './quality/components/QualitySelectGate.jsx'
import { getQualityFromUrl, updateQualityUrl, DEFAULT_QUALITY } from './quality/qualityUrl.js'

export default function App() {
  const [quality, setQuality] = useState(() => getQualityFromUrl() || DEFAULT_QUALITY)
  // Show gate on initial landing if no ?q is provided in the URL (dev links go straight to High)
  const [showGate, setShowGate] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    return !p.has('q') && !p.has('dev')
  })

  useEffect(() => {
    const handlePopState = () => {
      const q = getQualityFromUrl() || DEFAULT_QUALITY
      setQuality(q)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleSelectQuality = (nextQuality) => {
    updateQualityUrl(nextQuality)
    setQuality(nextQuality)
    setShowGate(false)
  }

  if (showGate) {
    return (
      <QualitySelectGate
        currentQuality={quality}
        onSelect={handleSelectQuality}
      />
    )
  }

  return (
    <QualityRouter
      quality={quality}
      onQualityChange={handleSelectQuality}
      onOpenQualityGate={() => setShowGate(true)}
    />
  )
}
