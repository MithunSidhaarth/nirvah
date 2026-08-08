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

CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_claimed_by ON donations(claimed_by);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_category ON donations(category);

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
