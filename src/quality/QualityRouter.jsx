import { lazy, Suspense } from 'react'

const HIGH = lazy(() => import('./high/App.jsx'))
const MEDIUM = lazy(() => import('./medium/App.jsx'))
const LOW = lazy(() => import('./low/App.jsx'))

const MAP = {
  high: HIGH,
  medium: MEDIUM,
  low: LOW,
}

export default function QualityRouter({ quality, onQualityChange, onOpenQualityGate }) {
  const Tree = MAP[quality] ?? HIGH

  return (
    <Suspense fallback={null}>
      <Tree
        quality={quality}
        onQualityChange={onQualityChange}
        onOpenQualityGate={onOpenQualityGate}
      />
    </Suspense>
  )
}
