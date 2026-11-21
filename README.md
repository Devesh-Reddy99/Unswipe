# Unswipe: less scroll, more stroll

A dating app for verified early-career graduates (the eLitmus 2020–2023 batches). Instead of an endless swipe deck, you get **5 well-matched intros a day**. When interest is mutual you have **72 hours to agree on a real date** at a partner café, and afterwards you check in privately on how it went.

**Live app: https://unswipe-app.vercel.app** (demo logins are just below)

> Built for the eLitmus product assignment "Reinvent the Dating App".
> The reasoning behind every decision is in **[docs/PRODUCT.md](docs/PRODUCT.md)**, and in the app at `/why`.

## Try it

| Account | Email | Password | What you'll see |
|---|---|---|---|
| Aarav (man, Bengaluru) | `aarav@unswipe.test` | `unswipe123` | Daily intros, a date suggestion to accept, a confirmed date with Diya, a past date to review, an expired match |
| Diya (woman, Bengaluru) | `diya@unswipe.test` | `unswipe123` | The other side of the date with Aarav, plus her own matches |
| Admin (sign in at **/admin/login**) | `admin@unswipe.test` | `admin123` | North-star metric, funnel, revenue, venue billing, moderation queue, grievances, waitlist |

The member login page (`/login`) has one-click buttons for Aarav and Diya; the team sign-in page (`/admin/login`) has one for the admin. Each page refuses the other kind of account. You can also **sign up as a new user**: any 7-digit number works as the eLitmus ID in this demo.

**Demo personas.** Seeded profiles are marked "Demo persona". They reply on their own, so one person can try the whole loop alone: match → chat → plan → date → check-in. On a confirmed date there is a "Skip to after the date" demo control so you can try the post-date check-in without waiting.

The shared demo world resets every night, around 3:30–4:30 AM IST (Vercel Cron), or from the admin dashboard. Accounts you create yourself are kept.

It runs on free hosting, so the first page after a few idle minutes can take a few seconds while the server and database wake up. After that it is quick.

## What's in the product

- **eLitmus verification + one person, one profile.** A hash of the candidate ID is stored, never the ID itself, and never any test scores.
- **DPDP-style consent.** A standalone, plain-language notice with versioned consent. Data download, profile editing and two-tap account deletion are self-serve.
- **Daily intros** with compatibility reasons, built from 8 weighted values questions, intent, date style, availability and language.
- **Fair exposure.** Each profile appears in at most 6 batches a day, and people with many pending likes are shown less.
- **72-hour plan window** with one mutual 48-hour extension. Matches expire quietly if no date is agreed.
- **Date planner.** Partner venues near both people, suggested slots from shared availability, accept/decline, calendar file (.ics), directions, cancel.
- **Safety.**
  - Phone numbers, emails, links and handles are masked before saving, until a date is confirmed.
  - A share-my-date link for a friend.
  - Report and block.
  - "Hide me from my company" is on by default.
  - A work-email badge.
- **Private post-date check-in.**
  - No-shows lower your exposure.
  - "Felt unsafe" creates an urgent report.
  - When both people say "meet again", a second date is unlocked.
- **Socials** with equal seats for women and men, plus a demo checkout.
- **Unswipe Plus** (convenience only, never visibility). In the demo it's a toggle; no money is charged.
- **Admin:**
  - KPIs and funnel.
  - Venue billing.
  - Moderation (dismiss/suspend).
  - Grievances (IT Rules 2021 timelines).
  - Waitlist by city and gender.
  - Demo reset.
- **Legal pages:** privacy notice, terms, safety centre, grievance officer. It is also an installable PWA.

## Tech stack and why

| Choice | Why |
|---|---|
| **Next.js 15 (App Router) + React 19 + TypeScript** | One codebase for pages, server logic (Server Actions) and API routes; free hosting on Vercel |
| **PostgreSQL (Neon) + Drizzle ORM** | Relational data (users, matches, plans) fits SQL; Drizzle is plain TypeScript with readable SQL migrations |
| **Custom auth** (bcrypt + database sessions in an httpOnly cookie) | Simple to explain, no third-party lock-in; tokens are stored hashed |
| **Tailwind CSS v4** | Fast, consistent styling with a small design-token set |
| **Polling for chat** (every 3 s) | Works on any free host without websockets; fine at this scale |
| **Zod** | Server-side validation of every form |

### Project structure

```
src/
  app/            pages (landing, onboarding, /app/*, /admin, legal) and API routes
  app/actions/    server actions: auth, onboarding, dating, account, admin, public
  components/     UI components (IntroCard, Planner, Ticket, Avatar, …)
  db/             Drizzle schema + client
  lib/            product logic: compat.ts (scoring), matching.ts (daily batches),
                  safety.ts (contact masking), slots.ts, personas.ts (demo), seed.ts
drizzle/          SQL migrations
scripts/          migrate.ts (runs on deploy, seeds an empty DB), seed.ts (reset)
tests/            unit tests for scoring, fairness, masking and time logic
docs/PRODUCT.md   product thinking: problem, decisions, monetisation, GTM, legal
```

## Run it locally

Requirements: Node.js 20+ and a PostgreSQL database (local, or a free Neon project).

```bash
git clone https://github.com/Devesh-Reddy99/Unswipe.git
cd Unswipe
npm install
cp .env.example .env            # then set DATABASE_URL
npm run db:migrate              # creates tables and seeds demo data
npm run dev                     # http://localhost:3000
```

Other commands:

```bash
npm test             # unit tests (compatibility, fair exposure, masking, IST time, slots)
npm run db:seed      # reset the demo world
npm run build        # migrate + production build (what Vercel runs)
```

## Deploy (free)

1. Import the GitHub repo in Vercel.
2. In the Vercel project, open **Storage → Create → Neon (Postgres)** and connect it. This adds `DATABASE_URL` automatically.
3. Add an environment variable `CRON_SECRET` (any long random string) for the nightly demo reset.
4. Deploy. The build applies migrations and seeds the demo data on the first run.

## How I tested it

- **Unit tests** (`npm test`) for the core rules: compatibility scoring, fair exposure, contact masking, IST day boundaries and date-slot suggestions.
- **Full flows by hand** on the live site, on both phone and laptop: sign up and onboarding, intros, matching, chat, planning and accepting a date, the post-date check-in, reporting, data download, account deletion and the admin dashboard.
- Problems I found this way were fixed in their own pull requests (see below).

## How it was built

| Day | What changed |
|---|---|
| 17 Nov | First working version: onboarding, daily intros, matching, chat, date planner, safety features, admin dashboard. Deployed to Vercel with a Neon database. |
| 18 Nov | Testing the live site showed only 1 intro instead of 5 on the first day and a list overflowing on phones. Fixed both (PR #1). |
| 20 Nov | Renamed the app to Unswipe, added a separate admin sign-in, limited grad years to 2020–2023, made demo replies match the stage of the date (PR #2). Made switching tabs feel instant after noticing slow taps (PR #3). |
| 21 Nov | Added the live link to this README and fixed the demo chat naming the wrong day for the date (PR #4). |

## What I'd build next (and why it isn't in this version)

- **Real "Sign in with eLitmus"** instead of the simulated ID check. This needs eLitmus's own login system, so it can only be built with eLitmus.
- **Reminders on WhatsApp** before the 72-hour window closes and on the day of the date. WhatsApp only allows this for verified businesses and charges per message, so it isn't possible in a demo.
- **A selfie check** that compares a live photo with the profile photo. It needs a paid face-matching service, and face data is sensitive personal data under the DPDP Act, so it shouldn't be collected in a demo.
- **A self-serve dashboard for venues** to see bookings and pay their bill. It is a second product for café owners; the admin dashboard already shows what each venue would be billed.
- **Live chat over websockets** instead of checking every 3 seconds. Free hosting on Vercel doesn't support it, and polling works fine at this size.

## Disclosures (third-party code and assets)

- **Open-source libraries:** Next.js, React, Drizzle ORM, postgres.js, bcryptjs, Zod, Tailwind CSS. The fonts are Bricolage Grotesque and Hanken Grotesk (SIL Open Font License, via Fontsource). No UI templates or starter projects were used.
- **AI assistance:** I took help from an AI coding assistant while building this.
- **Fictional data:** all demo people, companies and venues are fictional. Avatars are generated illustrations, not photos of real people.
- **Simulated in this demo:**
  - eLitmus verification (would be "Sign in with eLitmus" / OAuth).
  - The work-email code (shown on screen instead of emailed).
  - Payments for socials and Plus (no money is charged).
- **Market data** cited in the product doc and landing page comes from public reports (Juleo × YouGov 2024, the Woo survey via Quartz, McAfee India 2026). Sources are listed in `docs/PRODUCT.md`.
