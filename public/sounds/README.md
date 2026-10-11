# Replaceable desktop sounds

Drop your own audio here, using the names below. The app tries `.mp3`, then `.wav`, then `.ogg`. Reload after adding or replacing a file. If no playable file exists, an original synthesized sound plays instead. The taskbar speaker mutes both desktop sounds and result-scene audio.

| Event | Filename stem | Trigger |
| --- | --- | --- |
| Startup | `xp-startup` | Main app opens after the agreement or DEV skip |
| Exclamation | `xp-exclamation` | Each of the five agreement warning popups opens |
| Critical | `xp-critical` | Platform/region block, or attempted dismissal of the required agreement |
| Ding | `xp-ding` | Final consent popup, login information or helper action |
| Notify | `xp-notify` | Helper speaks |
| Device connect | `xp-device-connect` | Device becomes live; Found New Hardware balloon |
| Device disconnect | `xp-device-disconnect` | Device stops being live |
| Start | `xp-start` | Start menu opens |
| Shutdown | `xp-shutdown` | User confirms the restart parody |

Example: `public/sounds/xp-device-connect.wav`. No Windows sound files are bundled. Browsers may wait for the first click or key press before allowing audio.
