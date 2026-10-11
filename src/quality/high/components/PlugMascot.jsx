import { useId } from 'react'

export default function PlugMascot({ className = '' }) {
  const gradient = useId()
  return (
    <svg className={className} viewBox="0 0 100 112" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="25" y1="35" x2="75" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b9edff" /><stop offset=".45" stopColor="#429bfa" /><stop offset="1" stopColor="#1156bb" />
        </linearGradient>
      </defs>
      <ellipse cx="51" cy="105" rx="29" ry="5" fill="#153c71" opacity=".16" />
      <path d="M51 87v10c0 7 16 1 20 6" stroke="#284969" strokeWidth="5" strokeLinecap="round" />
      <rect x="33" y="13" width="10" height="29" rx="3" fill="#e2edf4" stroke="#628096" strokeWidth="2" />
      <rect x="58" y="13" width="10" height="29" rx="3" fill="#e2edf4" stroke="#628096" strokeWidth="2" />
      <path d="M25 50c-11 0-17 12-10 18M77 49c13-9 16-3 13 4" stroke="#1757a4" strokeWidth="6" strokeLinecap="round" />
      <rect x="24" y="34" width="53" height="54" rx="17" fill={`url(#${gradient})`} stroke="#124b91" strokeWidth="2.5" />
      <path d="M34 42h31" stroke="#fff" strokeWidth="4" opacity=".7" strokeLinecap="round" />
      <ellipse cx="41" cy="57" rx="7" ry="9" fill="white" /><ellipse cx="62" cy="57" rx="7" ry="9" fill="white" />
      <ellipse cx="43" cy="59" rx="3" ry="4" fill="#17325b" /><ellipse cx="60" cy="59" rx="3" ry="4" fill="#17325b" />
      <path d="M43 74q9 8 17-1" stroke="#17325b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="33" cy="69" r="4" fill="#ffbb86" opacity=".75" /><circle cx="69" cy="69" r="4" fill="#ffbb86" opacity=".75" />
      <path d="m19 17 3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffcf47" />
    </svg>
  )
}
