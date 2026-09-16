# Campfire — Build Plan

Social web app where people sit around a realistic nighttime campfire and talk.

## Design direction (locked)

**Luminous forest glass**, restructured as a **Swiss editorial grid with oversized type**.

- Palette: ice `#eef4ff`, mist `#c9d9f2`, sage `#d9e6d3`, bark `#3c3a35` (ink), moss `#4c6b52`, ember `#f2a65a`, soft warm-glow whites. Light, luminous, frosted-glass surfaces.
- Type: Fraunces (serif display, oversized — hero headlines up to ~clamp 4–7rem) + Manrope (body/UI). Loaded via `<link>` in `src/routes/__root.tsx`.
- Layout: Swiss editorial grid — hairline rules, numbered section indices, wide margins, asymmetric column splits, big numerals for stats. Frosted glass cards (white/45 + ring + soft shadow) over a luminous gradient backdrop.
- Imagery: photorealistic, cinematic nighttime forest campfire photos as hero/room backgrounds. No cartoon illustrations, no emoji people — emoji from the prototype are replaced with icons/real imagery.
- Motion: restrained — soft firelight glow pulses, gentle ember drift, quiet status pulses.

## Screens

1. `/` — Landing: oversized Fraunces hero ("Come sit by the fire"), photorealistic campfire hero image, editorial numbered sections (how it works, tonight's fires preview), CTA to auth.
2. `/auth` — Login/register: split editorial layout, form card in frosted glass, tab between sign in / create account.
3. `/dashboard` — active campfire rooms (cards with live seat counts), friends-nearby rail, "start a fire" action.
4. `/campfire/$roomId` — the centerpiece: full-bleed photorealistic campfire environment, designated seating positions arranged around the fire where real user avatars render dynamically (filled seats show profile photos, empty seats show dashed "take a seat" affordance), speaking indicator, mic/talk controls, room chat panel.
5. `/friends` — friends grid with online/at-fire status, search, add-friend.
6. `/profile` — big-numeral stats (nights, fires, friends), avatar, bio, recent fires list.

All routes responsive: desktop multi-column editorial grid, mobile single column with bottom tab bar.

## Technical approach

- TanStack Start + React 19 + TypeScript + Tailwind v4 (already scaffolded). Routes in `src/routes/`, each with its own `head()` metadata.
- Design tokens in `src/styles.css` (`@theme inline` mapping + `:root` values in oklch/hex per existing format); shadcn components re-themed to the luminous palette.
- **Lovable Cloud** for: auth (email login/register), profiles, rooms, seats, friendships, room chat. Tables with RLS + grants; seeded with demo rooms, demo users with realistic photo avatars, and sample chat so the campfire room is alive on first visit.
- Avatar images: generated photorealistic warm-firelit portraits; room/hero backgrounds: generated cinematic night-forest campfire photography, saved under `src/assets/`.
- Campfire room seating: data-driven seat positions (array of x/y % coordinates around the fire) rendered over the background image, responsive on mobile.

## Order of work

1. Tokens, fonts, root layout, shared chrome (desktop nav + mobile tab bar).
2. Landing page with generated hero imagery.
3. Enable Lovable Cloud → schema + RLS + grants + demo seed.
4. Auth route (sign in / register) wired to Cloud auth; protect app routes.
5. Dashboard, campfire room (seating over fire environment), friends, profile.
6. Polish pass: responsive checks, motion restraint, metadata per route.
