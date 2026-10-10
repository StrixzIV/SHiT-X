import L0Underwater from './L0Underwater.jsx'
import L1XpBsod from './L1XpBsod.jsx'
import L2Heaven from './L2Heaven.jsx'
import L3Thunder from './L3Thunder.jsx'
import L4Skeleton from './L4Skeleton.jsx'
import L5Battle from './L5Battle.jsx'
import L6Molam from './L6Molam.jsx'
import L7Gargantua from './L7Gargantua.jsx'

// One full-screen scene per FX level (see game/score.js levelFor).
export const SCENES = [L0Underwater, L1XpBsod, L2Heaven, L3Thunder, L4Skeleton, L5Battle, L6Molam, L7Gargantua]

// How long each scene plays (ms at 1×) before the result sheet slides up over it.
export const SCENE_MS = [5000, 5000, 5500, 6500, 4500, 12500, 9500, 9000]
