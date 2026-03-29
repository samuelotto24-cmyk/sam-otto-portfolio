CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram_handle TEXT,
  follower_count INTEGER,
  niche TEXT,
  sells TEXT[],
  colors JSONB,
  photo_url TEXT,
  preview_hash TEXT UNIQUE NOT NULL,
  blob_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'expired'))
);

CREATE TABLE IF NOT EXISTS preview_views (
  id SERIAL PRIMARY KEY,
  preview_hash TEXT NOT NULL REFERENCES leads(preview_hash),
  viewer_email TEXT,
  is_owner BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_captures (
  id SERIAL PRIMARY KEY,
  preview_hash TEXT NOT NULL REFERENCES leads(preview_hash),
  email TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_hash ON leads(preview_hash);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_preview_views_hash ON preview_views(preview_hash);
CREATE INDEX IF NOT EXISTS idx_share_captures_hash ON share_captures(preview_hash);
