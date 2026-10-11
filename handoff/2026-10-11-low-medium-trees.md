# 2026-10-11 — Low and Medium quality trees implemented

## Request
The friend who was assigned the low and medium quality versions did not deliver, so the user asked Fumika to make both:

- **Low** — pure HTML, "university student who just learned HTML in class", no CSS or barely any.
- **Medium** — someone using the most obnoxious premium UI library: hedonistically fancy colours, high quality, zero consistency.

## Inherited state
`src/quality/low/App.jsx` and `src/quality/medium/App.jsx` were placeholder components returning `null`; the quality gate (`QualitySelectGate.jsx`) described both as "Blank layout (ยังไม่เปิดใช้งาน)". `QualityRouter.jsx` already lazy-loaded them and passed `quality`, `onQualityChange`, `onOpenQualityGate`.

## Changes
- `src/quality/low/App.jsx` — a Thai student assignment: `<h1>` "โปรเจคจบ … (v.2 final_FINAL)", `border="1" cellPadding="4"` tables for the device specs and the result, a `<select>` for wattage, radio buttons when the Battery API is missing, a `<ul>` of peripheral buttons, one `<marquee>` for verdicts at level ≥ 3, a `<center>` footer ("Best viewed in Internet Explorer 6"). Body styles are reset to plain white/black via a cleanup effect. Uses shared `readSpecs`/`estimateWatts`/`specBonus`/`tierFor`/`computeScore`/`useProbes`.
- `src/quality/medium/App.jsx` — six clashing blocks: (1) gold serif glassmorphism hero, (2) neon-cyber `SYSTEM_SCAN.EXE` specs panel in monospace, (3) corporate SaaS watt slider card + green gradient power card, (4) rainbow-hued peripheral grid where each card has a different border-radius, (5) gradient-border rocket CTA, (6) a gold "certificate" result card in Playfair-style serif. Fonts deliberately mismatched (Playfair/serif, Comic Sans, Segoe UI, Courier New). Also resets `document.body` styles in a cleanup effect.
- `src/quality/components/QualitySelectGate.jsx` — replaced the two "Blank layout" subtitles with real descriptions.
- `ARCHITECTURE.md` line 12 — the placeholder note replaced with what both trees now are.

## Gotchas found
- `computeScore` does **not** return the `tier` it was given (only `mult1`), so both trees keep the tier from `tierFor()` in their own state instead of reading `result.tier` (the High tree passes it as a separate prop to `CalcOverlay`).
- Both files live directly in `quality/<name>/`, so shared imports are `../../appraisal/…`, not `../../../…` (that depth only applies under `pages/`/`components/`).

## Checks
- `pnpm run lint`: passes (only the pre-existing `Companion.jsx` set-state-in-effect warning).
- `pnpm run build`: passes.
- Verified in the browser against `pnpm dev` on port 5199:
  - `?q=low`: specs table fills from real probes, dip produces a result table (699 chips / tier S / total 5,592 on the test machine), verdict line renders.
  - `?q=medium`: all six blocks render, dip produces the certificate with the correct tier and remark.

## Remaining work
- Nothing blocking. The low tree's `<marquee>` verdict only appears when the total crosses level 3; fine to test by picking a bigger wattage.
