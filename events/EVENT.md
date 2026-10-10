# Stupid Hackathon X (SHiT X) — Event Context

Background for agents working in this repo. Facts gathered from public sources; the schedule and rules were not published in the sources checked, so treat those as unknown.

## Event basics

- **Name:** Stupid Hackathon X (shtX), the 10th Stupid Hackathon in Thailand. "SHiT" is the event's abbreviation.
- **Dates:** 10–11 October 2026
- **Venue:** Cleverse, Rama 9, Bangkok
- **Organizer:** Creatorsgarten community; the GitHub org is [StupidHackTH](https://github.com/StupidHackTH)
- **Registration:** via Eventpop (linked from the event site's `registration.url`)
- **Format:** a 2-day, non-competitive, free-to-attend collaborative hackathon. Goal: makers build together, have fun, and learn. Not commercial; no emphasis on business value.
- **Rewards:** past editions distributed rewards by randomization rather than 1st/2nd place prizes.
- **Code of conduct:** the site has a Code of Conduct window; reports go to the Creatorsgarten Facebook page.

## Official event site

[StupidHackTH/x](https://github.com/StupidHackTH/x) is the official site for this edition:

- Windows XP–themed retro desktop: boot screen, draggable windows, taskbar. Optional Mac OS X Leopard, iOS 4, and Android 2.3 shells.
- Features: Photo Booth camera, acoustic phone-to-phone networking icebreaker (SHTX-NET), sponsor "Logo Hunt" game, live Network Operations Center (NOC) display for the stage.
- Draft agenda lives in `src/data/event.ts`; unconfirmed details are marked TBD.
- Stack: Astro + Tailwind CSS v4 (frontend); optional Bun + Elysia + SQLite + WebSocket server for NOC/networking; custom FSK acoustic modem with CRC-16; printable key cards as PDFs.
- Hosting: GitHub Pages at stupid.hackathon.in.th/x/, deployed on push to `main`.

## Past editions (context)

- Edition 2: July 14–15, 2018, LINK Collaboration Space, ~68–80 participants, 27 teams.
- Repos exist for editions 5–9 under the StupidHackTH org (e.g., 5 = Stupid-Hackathon-5-Webpage, 7 = 7th-Stupid-Hackathon-Bot).

## What this means for this repo

This repo (`SHiT-X`) is the team's project space for the event. Projects here are satirical and deliberately useless ("crazy ideas nobody needs, made with code") — the tone is joke-first, and the spirit is fun over polish. See `README.md` (project template) and `IMPLEMENTATIONS.md` (current build brief, "HydroCharge Sentinel").

## Sources

- [What is The Stupid Hackathon? (Creatorsgarten sponsor page)](https://creatorsgarten.notion.site/Calling-for-Sponsors-Stipud-Honkatack-in-Thailand-888-646e5ec3a7764566a539f56aa5e6c377) — found via search; page body was not retrievable
- [Retrospective of StupidHackTH2](https://gitlab.com/StupidHackTH/3/issues/1) — found via search, not opened
- [StupidHackTH GitHub org](https://www.github.com/StupidHackTH)
- [StupidHackTH/x README](https://github.com/StupidHackTH/x) — primary source for the 2026 edition details

## Unknowns

- Full schedule, rules, team size limits, and judging/randomization method for SHiT X
- Exact participant count for this edition
- The Engineering blog for SHT6 (rayriffy.com) returned HTTP 526 and was not read
