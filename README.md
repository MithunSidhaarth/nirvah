# Nirvah

Nirvah connects people who have surplus food, clothing or supplies with
verified NGOs nearby. A giver lists what they have, a nearby NGO claims it,
and the giver sees the handoff through. Free for both sides.

This repo has two parts:

```
nirvah/
  frontend/   React + Vite site: landing page, login, signup, donor
              dashboard, NGO dashboard, browse and detail pages
  backend/    Express + SQLite API: auth, donations, dashboard stats
```

## Quick start

Open two terminals.

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # then edit JWT_SECRET to something random
npm run dev                # starts on http://localhost:4000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env       # already points at localhost:4000 by default
npm run dev                # starts on http://localhost:5173
```

Visit `http://localhost:5173`. Create a giver account and an NGO account
(two different browsers or an incognito window works well) to see a
donation get listed, claimed and delivered end to end.

## What is already wired up

- Sign up and log in for both roles, with a JWT session
- Donors can post a listing with a category, quantity, pickup window and
  an optional expiry countdown for perishable items
- NGOs get a live browse page and can claim a listing in a single tap
- Both dashboards pull real numbers from the API once it is running.
  Until then they show clearly labelled demo data so the app is never
  blank while you finish wiring things up
- A shared `frontend/src/lib/api.js` file is the single place that talks
  to the backend, so pointing the app at a hosted API later is a one
  line change to `VITE_API_BASE_URL`

## What you still need to add

- A production database. SQLite works out of the box and is free, but
  swap it for Postgres or another managed database once you deploy
- File or photo uploads for listings, this version accepts text only
- Email or push notifications when a listing is claimed
- Real location based matching. Places are stored as plain text for now

## Deploying for free

- Frontend: Vercel, Netlify or Cloudflare Pages all have free tiers that
  work well with a Vite build (`npm run build` outputs to `frontend/dist`)
- Backend: Render or Railway both have free tiers for small Node services.
  Because this uses SQLite, pick a host with a persistent disk, or swap
  in a free managed Postgres instance (Neon and Supabase both have one)
  if you want the database to survive redeploys

## Design system

The look is built around a "full circle giving" idea: a spark travels a
closed ring rather than a straight line, echoed in the hero graphic and
in the radial progress rings on both dashboards. Warm ember tones mark
the giver side of the product, a calmer sage green marks the NGO side,
so the two roles always feel visually distinct even inside the same app.
Colors, type and spacing all live in `frontend/src/styles/tokens.css`.
