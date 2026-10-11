const LOGOS = {
  mark: { src: '/brand/ileak-mark.webp', width: 128, height: 128 },
  wordmark: { src: '/brand/ileak-wordmark.webp', width: 720, height: 268 },
  stacked: { src: '/brand/ileak-stacked.webp', width: 360, height: 445 },
}

export default function BrandLogo({ variant = 'mark', className = '', decorative = false }) {
  return (
    <img
      {...LOGOS[variant]}
      className={`brand-logo brand-logo-${variant} ${className}`}
      alt={decorative ? '' : 'iLeak'}
      decoding="async"
      draggable="false"
    />
  )
}
