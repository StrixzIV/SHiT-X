# Tier card contrast and per-tier backdrops

Date: 2026-10-11. Done; uncommitted.

**Request:** after the XP restyle, the Ω tier's text could not be read, and the user wanted every tier "absurdly fancy".

**Cause:** the XP block in `src/index.css` (around line 617) gives every `.tier-card` a pale blue-white gradient. That overrode Ω's black background while its text stayed white.

**Change:** `src/quality/high/components/tier.css` is new and is imported by `Appraisal.jsx`.
- It uses two-class selectors (`.tier-card.tier-x`), so it wins over the XP rules without `!important`.
- The card is `isolation: isolate; overflow: hidden`. `::before` (z 0) and `::after` (z 1) carry the effects, and the letter and info sit on z 2.
- Light tiers:
  - A: darker silver.
  - S: gold foil with a sheen.
  - SS/SSS: holographic conic foil; SSS twinkles.
- SSSS and up are dark set pieces with white text and a dark text-shadow, `p` #eef3ff and the eyebrow #ffd76a:
  - SSSS: rainbow border and confetti; its letter is slightly smaller so it doesn't crowd the title.
  - kW: hazard stripes.
  - MW: water.
  - GW: lightning.
  - TW: sun and rays. Its text gets a heavier shadow and a pale eyebrow, and the letter is outlined.
  - K-I: planet and moon.
  - K-II: Dyson ring.
  - Ω: nebula, galaxy and stars.
- The existing letter styles and animations in `index.css` (spin, jitter, pulse) are unchanged. The K-II letter still spins, by design.

**Checks:**
- `pnpm -s lint` and `pnpm -s build` pass.
- Screenshots of A through Ω at 1280×900 through the DEV tier buttons; text is readable on every card.
- SSSS, TW and Ω also checked at 390×844, where the card stacks vertically; all readable. On phones the TW sun sits to the left of the letter, not behind it.
