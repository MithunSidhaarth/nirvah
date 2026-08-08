# Nirvah

Nirvah connects people who have surplus food, clothing or supplies with
verified NGOs nearby. A giver lists what they have, a nearby NGO claims it,
and the giver sees the handoff through. Free for both sides.

This repo has two parts:

```
nirvah/
  frontend/   React + Vite site: landing page, login, signup, donor
              dashboard, NGO dashboard, browse and detail pages
  backend/    Express + PostgreSQL API: auth, donations, dashboard stats
  docker-compose.yml   local Postgres for development
```

## Quick start

Open three terminals.

**Database** (skip this if you already have a Postgres instance and just
want to point `DATABASE_URL` at it)
```bash
docker compose up -d       # starts Postgres on localhost:5432
```

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # then edit JWT_SECRET to something random
npm run migrate            # creates all tables (safe to re-run)
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
- Email verification is required before login: signing up sends a
  verification link and shows a "check your email" screen; the frontend
  has real pages for `/verify-email`, `/forgot-password`, and
  `/reset-password`, all backed by working API endpoints
- If a login attempt hits an unverified account, the login page offers a
  one-click "resend verification email" inline
- Verification and password-reset tokens are hashed at rest and expire
  (24h / 1h) in the `auth_tokens` table
- Email sending goes through Resend once you set `RESEND_API_KEY` and
  `EMAIL_FROM` in `backend/.env` — until then every email is printed to
  the backend console instead, so the links are still usable locally
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

- A Resend account and a verified sending domain — the integration code
  is ready in `backend/lib/email.js`, it just needs real credentials
- File or photo uploads for listings, this version accepts text only
- Real location based matching. Places are stored as plain text for now
- An actual admin role. NGO verification and document review currently
  gate on an `ADMIN_EMAILS` allowlist (see `backend/middleware/admin.js`)
  rather than a real role in the `users` table — fine for a small team,
  worth migrating to a proper role once more than a couple of people need
  reviewer access
- Cloud file storage. Uploaded documents/photos are written to local disk
  (`backend/uploads/`, served from `/uploads`) — that's fine for a single
  instance but won't survive a redeploy on Render/Railway. Swap
  `backend/lib/uploads.js` for S3/Cloudinary/R2 before you rely on this in
  production; every route already just calls `fileUrlFor()`, so that's the
  only file that needs to change

## Security

- CORS is an allowlist (`FRONTEND_URL` + optional `ALLOWED_ORIGINS`), not
  wide open
- Helmet sets standard security headers
- Rate limiting: 300 req/15min baseline on `/api`, a tighter 15 req/15min
  on signup/login/password-reset/verification endpoints, and 60 req/15min
  on donation/document/impact writes (`backend/middleware/rateLimit.js`)
- All request bodies are validated with `zod` (`backend/lib/schemas.js`)
  instead of hand-rolled `if (!field)` checks, and route `:id` params are
  checked as integers before touching the database
- JSON bodies are capped at 100kb; uploaded files are capped at 8MB and
  restricted to PDF/JPEG/PNG/WEBP
- `express-async-errors` is loaded in `server.js` so a rejected DB query
  (or any thrown error) inside a route handler returns a clean 500 instead
  of crashing the whole process — worth knowing about if you write new
  routes with `pool.query(...)` calls that aren't wrapped in try/catch

## NGO verification, documents, and impact (sections 6-7, 9, 12)

- NGOs self-report registration/12AB/80G numbers via
  `PATCH /api/ngos/me`; submitting details moves a `pending` profile to
  `under_review`
- NGOs upload supporting documents via
  `POST /api/ngos/me/documents` (multipart, field name `file`, `type` one
  of `ngo_verification`/`form_12ab`/`form_80g`/`other`)
- Donors and the claiming NGO can attach documents to a specific donation
  via `POST /api/donations/:id/documents` (receipts, delivery proof, CSR
  evidence, etc.)
- An admin (see `ADMIN_EMAILS` above) reviews pending NGOs at
  `GET /api/ngos/pending` and decides with
  `POST /api/ngos/:id/verify { status, notes }`; `verified` only turns on
  `csr_eligible` if an 80G number is on file
- An admin approves/rejects any uploaded document with
  `PATCH /api/documents/:id { status, notes }`
- Once a donation is delivered, the claiming NGO logs impact via
  `POST /api/donations/:id/impact` (multipart, up to 5 `photos`, plus
  `beneficiaryCount`/`location`/`itemsDelivered`/`notes`); anyone can read
  it back with `GET /api/donations/:id/impact`

## Donation lifecycle & audit trail (section 8)

A donation now moves through all ten stages from the `donation_status`
enum, not just `listed -> claimed -> delivered`:

```
listed -> matched -> claimed -> accepted -> pickup -> delivered
        -> acknowledged -> impact_recorded -> documentation_complete -> closed
```

- `backend/lib/lifecycle.js` is the single place that knows which
  transitions are legal (`canTransition`) and performs them
  (`advanceDonation`) — every move locks the row, checks the edge is
  allowed, stamps that stage's `*_at` timestamp column, and writes one row
  to `audit_logs` (who did it, from what status, to what status), all in
  one transaction. Routes never write `status` directly.
- `matched` is reserved for the automated location-matching feature (see
  "What you still need to add" below) — the flow currently skips straight
  from `listed` to `claimed`, same as before.
- `POST /api/donations/:id/{claim,accept,pickup,complete,acknowledge}`
  drive a donation forward one stage at a time, each restricted to the
  right party (the giver, or the NGO that claimed it). `complete` still
  means "mark delivered", matching the existing frontend call.
- Logging impact (`POST /api/donations/:id/impact`) also advances the
  donation to `impact_recorded` on its own — the giver acknowledging
  delivery first is optional, not required.
- `documentation_complete` is a deliberate `POST
  /api/donations/:id/documentation-complete` admin action for now; there's
  no automatic "every required document is approved" check yet, since
  which documents are required isn't defined anywhere in the app.
- `POST /api/donations/:id/close` (giver, claiming NGO, or admin) is the
  final stage.
- `GET /api/donations/:id/history` returns the full audit trail for one
  donation — every lifecycle move plus document reviews and impact logging
  recorded against it, oldest first.
- The frontend donation detail page (`frontend/src/pages/DonationDetail.jsx`)
  is wired to all of this: it shows every stage's real timestamp and
  whichever action button applies to the signed-in viewer (giver or
  claiming NGO) for the donation's current stage. `documentation-complete`
  has no frontend button — it's admin-only and there's no admin UI in this
  app yet. Impact logging (`POST /api/donations/:id/impact`) and the
  donation-level document vault now have frontend forms on the same page
  (`frontend/src/components/DonationVault.jsx`,
  `frontend/src/components/DonationImpact.jsx`).

## Tax and CSR summaries (sections 10-11)

Donations on Nirvah are in-kind (food, clothing, supplies) — nothing in the
schema puts a rupee value on one, so these aren't deduction calculators.
They're read-only rollups over the `donations`, `ngos`, and `documents`
tables that already exist, aimed at the record a donor's CA or an NGO's CSR
report actually needs:

- `GET /api/donors/me/tax-summary` (donor only) — every donation that's
  reached at least `delivered`, which NGO it went to, whether that NGO's
  80G is on file and verified, and any `tax_document` uploaded against it
  via the existing `POST /api/donations/:id/documents` route.
- `GET /api/ngos/me/csr-summary` (NGO only, requires `csr_eligible`) — the
  same idea from the NGO's side: donations received, grouped by category,
  with a unique-donor count and any `csr_evidence` documents attached.
  Returns 403 with an explanatory message if the NGO isn't CSR-eligible
  yet (see the verification flow above).
- Both live in `backend/routes/tax.js` and `backend/routes/csr.js`, and
  have frontend pages at `/dashboard/donor/tax` and `/dashboard/ngo/csr`
  (`frontend/src/pages/TaxSummary.jsx`, `CsrSummary.jsx`). Uploading the
  underlying `tax_document`/`csr_evidence` files still happens through the
  same donation vault UI as any other document — these pages are the
  read side, not a separate upload flow.
- No new tables or columns; if a real rupee value per donation or a CA-
  ready PDF export is needed later, that's a schema change and a
  generation step on top of this, not a rewrite of it.

## Deploying for free

- Frontend: Vercel, Netlify or Cloudflare Pages all have free tiers that
  work well with a Vite build (`npm run build` outputs to `frontend/dist`)
- Backend: Render or Railway both have free tiers for small Node services.
  Add a managed Postgres instance (Render's own Postgres, or Neon/Supabase's
  free tiers) and point `DATABASE_URL` at it, then run `npm run migrate`
  once against that database before the app takes traffic

## Design system

The look is built around a "full circle giving" idea: a spark travels a
closed ring rather than a straight line, echoed in the hero graphic and
in the radial progress rings on both dashboards. Warm ember tones mark
the giver side of the product, a calmer sage green marks the NGO side,
so the two roles always feel visually distinct even inside the same app.
Colors, type and spacing all live in `frontend/src/styles/tokens.css`.
