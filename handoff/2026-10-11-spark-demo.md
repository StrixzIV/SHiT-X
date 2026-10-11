# Free Firebase Hosting demo

The friend reported that `make deploy` failed while enabling Artifact Registry and Cloud Build because `ileak-test` uses Firebase's free Spark plan. The user chose to keep the demo on the free plan. They had already explicitly approved committing and publishing the throwaway DeepSeek/Paxa credentials. Deployment must still happen on the friend's machine.

This supersedes the default deployment instructions in [the integration review](2026-10-11-integration-review.md), which was committed and pushed as `6a3f77d`.

## Changes

- `npm run build` now uses Vite's `demo` mode. `vite.config.js` embeds only the DeepSeek/Paxa provider configuration from `functions/.env`, with root `.env.local` overrides. These approved demo keys are visible in the generated browser assets.
- `src/quality/high/companion/api.js` calls DeepSeek chat completions and Paxa TTS directly in that build. It never probes `/api/companion`. Repeated voice phrases reuse cached audio, with a separate buffer for each `decodeAudioData` call; failed requests can retry. The existing brain retains prewritten fallback dialogue, mute, scene awareness and cancellation.
- `functions/companion-protocol.js` shares the existing persona, scene context, chat request and reply validation between browser and server. `functions/companion.js` retains the backend middleware through this shared module.
- `firebase.json` contains static Hosting only. `make deploy` builds the demo and runs `firebase-tools deploy --only hosting`, without deploying Functions or requiring Blaze.
- `npm run build:backend` retains the server build and copies its HTML into `functions/dist`. `make deploy-blaze` installs function dependencies, uses this build and deploys the optional companion API and server region gate through `firebase.blaze.json`. Its browser bundle does not contain provider keys. Development still uses the Vite proxy.
- README, environment template, architecture and review notes now describe both modes. The default demo retains the client region gate.

## Verification

- `npm test`: all eight tests passed. The four added client tests cover direct scene-aware requests, voice settings and cache-buffer ownership, retry after failure, and the retained proxy/static fallback.
- `npm run lint`, `npm run build`, `npm run build:backend` and `git diff --check` passed.
- `/tmp/ileak-build-key-check.mjs` verified both build modes: the demo contains the approved provider keys, the backend browser bundle contains neither key, unrelated credentials are excluded, and backend HTML is copied correctly. It also checks that the default Firebase config has only static Hosting.
- `make -n deploy` prints only the demo build and Hosting deployment. No Functions install or deployment occurs in this target.
- `/tmp/ileak-free-cors-check.mjs`: real DeepSeek/Paxa preflight requests accept the Firebase origin and required POST/authorization headers.
- `/tmp/ileak-spark-demo-browser.mjs`: Playwright served the compiled local demo at the Firebase origin without deploying it. Real DeepSeek/Paxa calls returned Thai dialogue and audio; playback started successfully. No `/api/companion` request was made. Mocked provider failures retained prewritten dialogue without uncaught errors.
- `/tmp/ileak-surroundings-browser.mjs`: existing scene/result context, stale reply cancellation, generic chatter suppression, inside-hole shouts, reappearance, card/window identity and tab-return checks passed through the development proxy.
- `/tmp/ileak-review-companion-cleanup.mjs`: switching quality stopped active speech and prevented late model replies from starting TTS.

## Friend's deployment

With Node 22.12 or newer (Node 22 recommended):

```sh
git pull --ff-only
npm ci
npm test
npm run lint
npx firebase-tools login
make deploy
```

Open High quality, click the page to unlock audio, enable sound and poke น้องปลั๊ก to check her reply and voice. Do not use `/api/companion/health` as a check for this static build. No Firebase deployment or billing change was performed here.
