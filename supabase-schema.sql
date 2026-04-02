-- ─────────────────────────────────────────────────────────────────────────────
-- BLRRealty — Supabase SQL Schema
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop table for a fresh setup (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS properties;

CREATE TABLE IF NOT EXISTS properties (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core listing fields
  property_type    TEXT         NOT NULL
                   CHECK (property_type IN (
                     'Apartment', 'Villa', 'Plot', 'Commercial', 'Penthouse', 'Studio'
                   )),
  project_name     TEXT         NOT NULL,
  developer        TEXT         NOT NULL,
  location         TEXT         NOT NULL,

  -- Timeline
  launch_date      DATE,
  possession_date  DATE,

  -- Pricing
  current_price    BIGINT,           -- stored in INR (e.g. 8500000 for ₹85 L)
  price_per_sqft   INTEGER,

  -- Size
  area             NUMERIC(10, 2),   -- in sqft
  bedrooms         SMALLINT,

  -- Details
  description      TEXT,

  -- Source / agent info
  source_name      TEXT,
  source_contact   TEXT,

  -- Metadata
  posted_date      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  status           TEXT         NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Up to 5 comparable properties stored as a JSON array.
  -- Each element shape:
  --   { "projectName": "...", "developer": "...", "price": "...", "location": "..." }
  similar_properties JSONB      NOT NULL DEFAULT '[]'::JSONB
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_status     ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_type       ON properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location   ON properties (location);
CREATE INDEX IF NOT EXISTS idx_properties_posted     ON properties (posted_date DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: anyone (including unauthenticated users) can read ALL rows.
-- This lets the admin panel (which uses only the anon key + in-app password)
-- fetch pending/rejected listings. In a production app replace this with a
-- proper service-role / JWT-based policy.
CREATE POLICY "public_select_all"
  ON properties FOR SELECT
  USING (true);

-- Policy: anyone can insert a new listing (arrives with status='pending').
CREATE POLICY "public_insert"
  ON properties FOR INSERT
  WITH CHECK (status = 'pending');

-- Policy: anyone can update status (admin gate is enforced in the React Native
-- app with the hardcoded password). Replace with proper auth in production.
CREATE POLICY "public_update_status"
  ON properties FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ── Seed data (optional — remove before going to production) ──────────────────
INSERT INTO properties (
  property_type, project_name, developer, location,
  launch_date, possession_date,
  current_price, price_per_sqft, area, bedrooms,
  description, source_name, source_contact,
  status, similar_properties
) VALUES
(
  'Apartment',
  'Prestige Lakeside Habitat',
  'Prestige Group',
  'Whitefield',
  '2023-06-01', '2026-12-31',
  9500000, 8200, 1158, 2,
  'Stunning lakeside project with world-class amenities including Olympic-size pool, '
  || 'clubhouse, and landscaped gardens. Located minutes from ITPL and Phoenix Market City.',
  'Akshay Joe',
  '+91 98765 43210',
  'approved',
  '[
    {"projectName":"Prestige Sunrise Park","developer":"Prestige Group","price":"₹72 L","location":"Whitefield"},
    {"projectName":"Sobha Dream Acres","developer":"Sobha Ltd","price":"₹68 L","location":"Panathur"},
    {"projectName":"Godrej Splendour","developer":"Godrej Properties","price":"₹80 L","location":"Whitefield"}
  ]'::JSONB
),
(
  'Villa',
  'Brigade Orchards',
  'Brigade Group',
  'Devanahalli',
  '2022-01-15', '2025-06-30',
  18500000, 6500, 2850, 4,
  'Exclusive gated villa community spread over 135 acres. Close to Kempegowda '
  || 'International Airport. Features private pool option, home automation, and lush greens.',
  'Ramesh Nair',
  'ramesh@brigadeagents.in',
  'approved',
  '[
    {"projectName":"Nandi Hills Villas","developer":"RMZ Corp","price":"₹1.6 Cr","location":"Nandi Hills"},
    {"projectName":"Adarsh Palm Retreat","developer":"Adarsh Developers","price":"₹2.1 Cr","location":"Devanahalli"}
  ]'::JSONB
),
(
  'Apartment',
  'Sobha City',
  'Sobha Ltd',
  'Thanisandra, Hebbal',
  '2024-03-01', '2027-09-30',
  7800000, 9100, 857, 2,
  'Premium high-rise apartments with panoramic city views. Meticulously crafted by Sobha''s '
  || 'own construction team. Connected to Outer Ring Road via the new Hebbal flyover.',
  'Akshay Joe',
  '+91 98765 43210',
  'approved',
  '[
    {"projectName":"Godrej Air","developer":"Godrej Properties","price":"₹70 L","location":"Hebbal"},
    {"projectName":"Salarpuria Sattva Divinity","developer":"Salarpuria Sattva","price":"₹65 L","location":"Thanisandra"}
  ]'::JSONB
),
(
  'Plot',
  'Adarsh Palm Acres',
  'Adarsh Developers',
  'Sarjapur Road',
  '2024-01-10', '2025-03-31',
  4200000, 3800, 1200, NULL,
  'Plotted development in a fast-appreciating micro-market. BDA-approved layouts with '
  || '24/7 security, underground utilities, and wide internal roads.',
  'Priya Sharma',
  '+91 99001 23456',
  'approved',
  '[]'::JSONB
),
(
  'Commercial',
  'Manyata Tech Park Phase 3',
  'Embassy Group',
  'Nagawara, Hebbal',
  '2023-09-01', '2026-06-30',
  55000000, 12000, 4580, NULL,
  'Grade-A office space in Bangalore''s premier IT destination. LEED Platinum certified. '
  || 'On-campus amenities include food court, gym, concierge, and EV charging.',
  'Vikram Anand',
  'vikram@embassygroup.in',
  'pending',
  '[
    {"projectName":"RMZ Ecoworld","developer":"RMZ Corp","price":"₹4.5 Cr","location":"Devarabeesanahalli"}
  ]'::JSONB
);
