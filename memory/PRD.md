# Practical Poker Plus (PPP) — Product Requirements Doc

## Original Problem Statement
Brand-continuity web app for "Practical Poker Plus", an educational poker content brand with 4 coaches. Two core needs:
1. **Content auto lay-up** — coaches supply RAW lecture material (upload .pptx/.docx/.txt or paste text); the app uses AI to lay it into the PPP branded slide template, choosing an appropriate branded page design per slide, with the ability to switch to an alternate layout afterward. Export to PPTX + PDF.
2. **PT4-style hand replayer** — replicate Poker Tracker 4 animated hand replays using PPP branded assets (table/chips/cards), so coaches can build and export animated poker replay scenarios as GIF/MP4.

## User Choices
- AI-powered layup (Claude Sonnet 4.6 via Emergent Universal Key)
- JWT email/password login for the 4 coaches
- Replayer v1: step-by-step hand builder with playback + GIF/MP4 export
- Exports: slides → PDF + PPTX; animations → MP4/GIF

## Architecture
- **Frontend**: React (CRA + craco), Tailwind, shadcn/ui, framer-motion, sonner. Brand: dark #0d0d0d hex-textured bg, neon lime green #9EE60F accents, Outfit/Inter/JetBrains Mono type, "PRACTICAL POKER +" wordmark. Branded slides & poker table are CSS/SVG (not raster assets) so they scale + animate crisply.
- **Backend**: FastAPI + Motor/MongoDB. Modules: `auth.py` (JWT bearer+cookie, bcrypt), `ai_layup.py` (Claude Sonnet 4.6 → structured slide JSON), `exporters.py` (python-pptx + reportlab), `poker_render.py` (Pillow frame render → imageio GIF/MP4, ffmpeg bundled via imageio-ffmpeg).
- **AI layup**: fixed set of 10 layout families; AI returns every field per slide so layout switching is instant client-side and persisted server-side.

## Brand source
Extracted from the client's official PowerPoint template (Dropbox) — 50 branded layouts analyzed; V05 PDF rendered to lock exact colors/logo.

## Personas
- 4 PPP coaches (Alex Vance, Elena Rostova, Marcus Brody, David Chen) + a brand admin.

## Implemented (2026-06 / iteration 2 — BRAND ASSET INTEGRATION)
Corrected course: removed all self-created brand approximations and integrated the CLIENT's real assets from the working PowerPoint template + supplied packages:
- **Real logo** (`logo-primary.png`) everywhere (nav, login, loading). No recreated wordmark.
- **Real fonts**: Ethnocentric (hero/headings), Bebas Neue (subheads/labels), Inter + Sora + Poppins (body) via @font-face.
- **Authentic slide plates** from the template as slide backgrounds (dark hex + green footer + vertical logo for content, cards+footer for title, full-green for section) — logo & footer are the client's baked-in art. Titles clamp so text never exceeds the page or runs over the footer/logo.
- **Replayer** now renders on the real `table.png`, with branded avatars (Spencer, Will + roster) in the PPP green circle, real name-tag frames, dealer button, both card decks (4-Colour default + Standard toggle) + branded card back, and real chips.
- **Exports rebuilt**: `poker_render.py` composites the real table/cards/chips/avatars/fonts so GIF + MP4 match the on-screen branded table. PPTX/PDF slide exports retained.

## Known follow-ups after iteration 2
- Coach *display names* are still the design placeholders (Alex/Elena/Marcus/David) while avatars are now real; confirm real coach identities (Spencer, Will, +2) to finalise.
- Action/control button PNGs (Fold/Flop/Turn/River/Play/Pause…) are currently styled in-brand (Ethnocentric + green) rather than the supplied graphics due to a download naming issue — can wire the exact PNGs on request.
- PPTX export still uses a branded reconstruction, not the client's exact .pptx masters; deeper master-slide matching is a follow-up.

## Implemented (2026-06 / iteration 1 — MVP)
- JWT auth, 4 seeded coaches + admin, branded login with quick-demo logins.
- Dashboard: lists decks + replays, coach filter, create/delete.
- Content Studio: paste/upload → AI branded deck; slide thumbnails; large branded preview; per-slide layout switcher (10 layouts); inline content editor + save; PPTX + PDF export.
- 10 branded slide layouts: title, section, bullets, two_column, subheader_box, table_felt, image_text, stats, takeaways, quote.
- PT Replayer: 2–9 seats, stacks, blinds, dealer button, hole cards + board via 52-card picker (used-card locking), street-by-street action builder (fold/check/call/bet/raise + deal flop/turn/river), animated branded table, timeline play/pause/step/scrub + speed, save, GIF + MP4 export.
- Verified: testing agent 100% backend (17/17) + all frontend flows.

## Backlog
- **P1**: Real branded raster assets (chips/cards/avatars/logo PNGs from client Dropbox) swapped into slides + table; match client PPTX master exactly on PPTX export; slide reordering (drag).
- **P1**: Reveal-at-showdown sequencing; all-in / side-pot math; pot display rounding for split contributions.
- **P2**: Brute-force lockout + password reset (playbook), refresh tokens; per-coach roles/permissions.
- **P2**: Social-clip aspect presets (9:16 / 1:1) for both slides and replays; watermark toggle.
- **P2**: Regenerate-from-source and AI "rewrite this slide" actions.

## Next Tasks
1. Import client's real branded assets and wire into slide motifs + poker table.
2. Add drag-to-reorder slides and 9:16 export presets for social.
3. Add showdown reveal timing + all-in handling to the replayer.
