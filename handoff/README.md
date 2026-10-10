# Agent handoffs

Start here when resuming work. This directory records changes made while another agent was unavailable, so multiple tasks can be picked up without replaying the conversation.

## Work log

| Date | Task | State when recorded |
| --- | --- | --- |
| 2026-10-10 | [L7 black hole result-card orbit and dragging](2026-10-10-l7-black-hole.md) | Completed and verified, with two follow-up fixes; committed and pushed 2026-10-10 |
| 2026-10-10 | [L7 cinematic shot: top-right framing, roll, fade from black, stars](2026-10-10-l7-cinematic-shot.md) | Completed and verified; committed and pushed 2026-10-10 |

## Adding notes

Use one file per task, named `YYYY-MM-DD-topic.md`, and add it to the work log. Record the user's request, inherited work, changes and affected files, checks performed, limitations, and any remaining work. Include untracked files or temporary artifacts the next agent needs to know about.

Update an existing task's note when its implementation changes. Keep completed notes available, and record commit or deployment status when it changes. Check the current working tree before relying on an older note's status.
