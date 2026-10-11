# Agent handoffs

Start here when resuming work. This directory records changes made while another agent was unavailable, so multiple tasks can be picked up without replaying the conversation.

## Work log

The pending 2026-10-11 work below was reviewed together and included in the integration commit. See [review fixes, verification and the friend's deployment steps](2026-10-11-integration-review.md). Older task notes retain their original status as historical records.

| Date | Task | State when recorded |
| --- | --- | --- |
| 2026-10-10 | [L7 black hole result-card orbit and dragging](2026-10-10-l7-black-hole.md) | Completed and verified, with two follow-up fixes; committed and pushed 2026-10-10 |
| 2026-10-10 | [L7 cinematic shot: top-right framing, roll, fade from black, stars](2026-10-10-l7-cinematic-shot.md) | Completed and verified; committed and pushed 2026-10-10 |
| 2026-10-10 | [XP UI, sound scheme and gags (brief and completion notes for GPT)](2026-10-10-xp-ui-for-gpt.md) | Done 2026-10-11; verified, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-10 | [Retro result scenes: PS1/PS2, low-poly L2–L4, Codec L6, PS2 loading (Claude)](2026-10-10-retro-scenes.md) | Done 2026-10-11; committed and pushed 2026-10-11 |
| 2026-10-11 | [XP warning agreement and varied Thai READ FIRST errors](2026-10-11-xp-warning-sequence.md) | Done, including Close-button follow-up; verified, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-11 | [L7 smaller orbit, no hover/click assistance, idle swallow and spit-out](2026-10-11-l7-annoying-orbit.md) | Done, including removal of click-to-stick; verified, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-11 | [L7 shader bends the live result UI](2026-10-11-l7-ui-lensing.md) | Done; verified, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-11 | [L7 black-hole shader lenses UI light around its rim](2026-10-11-l7-ui-light-ring.md) | User's clarified scope; done, verified, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-11 | [L0 underwater, L5 Hoenn/RSE battle and L6 Metal Gear Codec audio](2026-10-11-scene-audio.md) | L0/L5 invented melodies rejected and superseded below; L6 retained, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-11 | [Correct L0/L5 to openings of the original NES Mario and Hoenn battle themes](2026-10-11-original-theme-correction.md) | Done; reference/render/scene checks passed, committed and pushed 2026-10-11 (7c207c8) |
| 2026-10-11 | [Replaceable music, sound and graphics filenames](2026-10-11-replaceable-assets.md) | Audited; full list in `public/fx/README.md`, uncommitted |
| 2026-10-11 | [Tier card contrast and per-tier backdrops (Claude)](2026-10-11-tier-cards.md) | Done; screenshots checked, uncommitted |
| 2026-10-11 | [น้องปลั๊ก companion: DeepSeek lines, Paxa voice, L7 stowaway (Claude)](2026-10-11-companion.md) | Done; replaces GPT's PlugAssistant; mock-API and browser checks, real keys untested, uncommitted |
| 2026-10-11 | [Persistent MSN bubbles grouped by message time](2026-10-11-msn-persistent-bubbles.md) | Done; speech, grouping, phone layout, L7 and fallback browser checks passed; lint/build passed, uncommitted |
| 2026-10-11 | [L7 independent companion window and floating MSN bubble pile](2026-10-11-l7-companion-debris.md) | Done; functional, real-shader desktop/phone, reduced-motion controls and desktop regressions passed; lint/build passed, uncommitted |
| 2026-10-11 | [Result-scene awareness and shouts from the black hole](2026-10-11-companion-surroundings.md) | Done; mocked policy, middleware, browser and speech checks passed, uncommitted |
| 2026-10-11 | [Low and Medium quality trees implemented](2026-10-11-low-medium-trees.md) | Done; lint/build/browser checks passed, uncommitted |
| 2026-10-11 | [Combined-agent review and Firebase companion demo API](2026-10-11-integration-review.md) | Reviewed and verified; included in this integration commit; deployment is on the friend's machine |

## Adding notes

Use one file per task, named `YYYY-MM-DD-topic.md`, and add it to the work log. Record the user's request, inherited work, changes and affected files, checks performed, limitations, and any remaining work. Include untracked files or temporary artifacts the next agent needs to know about.

Update an existing task's note when its implementation changes. Keep completed notes available, and record commit or deployment status when it changes. Check the current working tree before relying on an older note's status.
