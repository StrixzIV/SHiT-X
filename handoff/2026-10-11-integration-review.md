# Integration review and Firebase demo preparation

The user requested review and verification of the three agents' combined work before committing and pushing. They then explicitly authorized committing the throwaway API credentials and clarified that their friend will deploy the Firebase website from another machine. No Firebase deployment was performed here.

## Review fixes

- Low and Medium now include their actual estimated wattage in the controls, even when it is absent from the shared preset list (for example, an 18 W Android estimate). Medium keeps the slider indexes stable when changing away from that estimate. Both wait for the spec scan before allowing a result.
- Low restores native HTML heading/list/form styles beneath the shared CSS reset. Both quality trees restore the preceding body style on unmount.
- Medium's grids, headings, large wattage values, action button and result table fit 320 px phones, including the highest wattage.
- Unmounting the High companion stops playing speech and cancels delayed model/voice delivery; completed notifications remain available when returning.
- The shared API now lives in `functions/companion.js`, with a compatibility export in `server/companion.js`. Firebase's `companion` HTTP function uses the same middleware as Vite. Both Hosting configs route `/api/companion/**` before their fallback.
- The middleware handles Firebase's already-parsed JSON instead of waiting for an ended request stream. It also handles streamed UTF-8 safely and rejects invalid/oversized bodies with 400/413 responses.
- A live API check found DeepSeek returning empty content with the inherited thinking/output settings. Thinking is now disabled for short remarks and the JSON output allowance is 400 tokens. A follow-up real request returned a valid Thai line; Paxa returned MP3 audio with HTTP 200.
- The user's throwaway credentials are included in `functions/.env`. Root `.env.local` remains a local override. A build scan confirmed neither API key appears in frontend assets.
- Added four persistent backend regression tests, a Functions lockfile, deployment instructions in README and a deployment Makefile target. The Firebase runtime is Node 22.

## Verification

- `npm test`: four backend tests passed, covering parsed/streamed JSON equivalence, split Thai UTF-8 bytes, invalid and oversized input, missing-key fallback, TTS forwarding and caching.
- `npm run lint`, `npm run build`, and `git diff --check`: passed.
- Existing agent browser checks were independently rerun: logo assets and layouts across 320–1280 px, agreement/certificate/print branding, persistent MSN grouping and voice cancellation, result-scene awareness and stale-reply cancellation, independent L7 window and 32-bubble pile, dragging/dismissal, desktop restoration, reduced motion, and real WebGL desktop/phone rendering. No uncaught browser errors.
- Additional browser checks verified Low/Medium estimated wattage and scoring, native Low styles, phone widths, largest-wattage Medium results, quality-gate body cleanup, and active/late speech cancellation across quality switches.
- Real DeepSeek and Paxa requests both returned HTTP 200 after the DeepSeek fix. Live service wording and availability can still vary.

Browser review scripts are in `/tmp/ileak-review-layouts.mjs`, `/tmp/ileak-review-companion-cleanup.mjs`, and the previously recorded `/tmp/ileak-*` agent harnesses on this machine; the backend tests are in the repository.

## Friend's deployment

Follow README's Firebase demo deployment steps. Install the root and Functions dependencies, build, log in to Firebase, then deploy **both** `functions:companion,hosting` to `ileak-test`. The project must already have Blaze enabled; this review does not enable billing. The default config retains the client-side region gate. The optional `firebase.blaze.json` config retains the server-side gate when deploying all functions.

After deployment, `/api/companion/health` should report `{"llm":true,"tts":true}`. Actual cloud deployment and site verification remain for the friend's machine.
