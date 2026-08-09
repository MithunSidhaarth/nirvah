-- Nirvah — PostgreSQL schema
-- Run via `npm run migrate` (see db/migrate.js). Safe to re-run: every
-- statement is guarded so this can execute against a fresh database or one
-- that already has some of these objects.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- Postgres has no `CREATE TYPE IF NOT EXISTS`, so guard each one manually.
-- Adding a role later (e.g. 'company', 'ca') is a one-line
-- `ALTER TYPE user_role ADD VALUE` migration, not a rewrite of this file.

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('donor', 'ngo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 'admin' = full sudo access (site settings, NGO verification decisions,
-- document approval). 'manager' = read-only staff access to the donations,
-- claims, and NGO-verification queue, but no write/edit rights anywhere —
-- see requireStaff vs requireAdmin in backend/middleware/admin.js. Neither
-- role can be created via /api/auth/signup (see lib/schemas.js); accounts
-- are provisioned directly with `npm run seed:staff` (backend/db/seed-staff.js).
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

DO $$ BEGIN
  CREATE TYPE ngo_verification_status AS ENUM ('pending', 'under_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- The full lifecycle from TODO section 8. The current API only drives a
-- listing through listed -> claimed -> delivered; the remaining stages
-- exist here so later work (section 8) doesn't need another migration.
DO $$ BEGIN
  CREATE TYPE donation_status AS ENUM (
    'listed',
    'matched',
    'claimed',
    'accepted',
    'pickup',
    'delivered',
    'acknowledged',
    'impact_recorded',
    'documentation_complete',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE auth_token_type AS ENUM ('email_verify', 'password_reset');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'ngo_verification',
    'form_12ab',
    'form_80g',
    'donation_receipt',
    'payment_record',
    'ngo_acknowledgement',
    'delivery_proof',
    'impact_proof',
    'tax_document',
    'csr_evidence',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role user_role NOT NULL,
  name TEXT NOT NULL,
  org TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  city TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- banned_at: an admin suspended the account (see routes/adminUsers.js) —
-- reversible, shows up as "banned" in the admin Users page.
-- deleted_at: an admin removed the account. This is a soft delete, not a
-- real SQL DELETE — donations, documents, and audit_logs all reference
-- users.id with no ON DELETE CASCADE, so a hard delete would fail (or
-- silently break history) for any user with even one donation on record.
-- Both are checked on every authenticated request (see requireAuth in
-- middleware/auth.js), so a ban/removal takes effect immediately rather
-- than waiting for the user's existing 30-day token to expire.
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Verification / password-reset tokens live in their own table (not columns
-- on users) so a user can have a history of tokens, resends don't clobber
-- state, and expiry/usage tracking (TODO section 3) is just a row each time.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type auth_token_type NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_lookup ON auth_tokens(type, token_hash);

-- ---------------------------------------------------------------------------
-- ngos — NGO-specific profile, one row per NGO user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ngos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  registration_number TEXT,
  form_12ab_number TEXT,
  form_12ab_valid_until DATE,
  form_80g_number TEXT,
  form_80g_valid_until DATE,
  csr_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status ngo_verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS ngos_set_updated_at ON ngos;
CREATE TRIGGER ngos_set_updated_at
  BEFORE UPDATE ON ngos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ngos_verification_status ON ngos(verification_status);

-- ---------------------------------------------------------------------------
-- donations — one timestamp column per lifecycle stage (TODO section 8)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES users(id),
  claimed_by INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity TEXT,
  description TEXT,
  place TEXT NOT NULL,
  status donation_status NOT NULL DEFAULT 'listed',

  -- photo_url: set via POST /donations/:id/photo after the listing is
  -- created (same "create text first, attach the file after" pattern as
  -- ngo/donation documents in lib/uploads.js). Nullable — a listing without
  -- a photo is still valid.
  photo_url TEXT,

  -- latitude/longitude: captured client-side (browser geolocation, see
  -- NewListing.jsx) at listing time, nullable since a donor can decline
  -- location access and just type a place name. Distance-based sorting on
  -- GET /donations only kicks in when both the listing and the viewer have
  -- coordinates — see the Haversine calculation in routes/donations.js.
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  listed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  pickup_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  impact_recorded_at TIMESTAMPTZ,
  documentation_complete_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS donations_set_updated_at ON donations;
CREATE TRIGGER donations_set_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Guarded ALTERs so this file stays safe to re-run against a database that
-- already has the donations table from before photo_url/latitude/longitude
-- existed (see the CREATE TABLE IF NOT EXISTS above — it won't add columns
-- to a table that already exists).
ALTER TABLE donations ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;


CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_claimed_by ON donations(claimed_by);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_category ON donations(category);

-- ---------------------------------------------------------------------------
-- ngo_team_members — volunteers/staff an NGO adds so claims move faster
-- during busy hours. Not a login of their own yet (no user_id, no auth) —
-- just a roster the NGO's own account manages. Wiring these up to real
-- accounts with their own sign-in is a later migration, not a rewrite of
-- this table.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE ngo_team_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ngo_team_members (
  id SERIAL PRIMARY KEY,
  ngo_id INTEGER NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role ngo_team_role NOT NULL DEFAULT 'member',
  added_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ngo_team_members_ngo ON ngo_team_members(ngo_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ngo_team_members_unique_email ON ngo_team_members(ngo_id, email);

-- ---------------------------------------------------------------------------
-- documents — Giving Vault (TODO section 9) + NGO verification uploads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER REFERENCES donations(id) ON DELETE CASCADE,
  ngo_id INTEGER REFERENCES ngos(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  status document_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_owner_check CHECK (donation_id IS NOT NULL OR ngo_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_documents_donation ON documents(donation_id);
CREATE INDEX IF NOT EXISTS idx_documents_ngo ON documents(ngo_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- ---------------------------------------------------------------------------
-- impact_records (TODO section 12)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS impact_records (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  ngo_id INTEGER NOT NULL REFERENCES ngos(id),
  beneficiary_count INTEGER,
  location TEXT,
  items_delivered TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ngo_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impact_records_donation ON impact_records(donation_id);

-- ---------------------------------------------------------------------------
-- audit_logs — permanent trail (TODO section 8)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ---------------------------------------------------------------------------
-- site_settings — small fixed key/value store, admin-only (routes/siteSettings.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
