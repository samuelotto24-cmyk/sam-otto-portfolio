# Mockup Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive quiz-to-mockup sales tool that generates personalized creator platform previews from Instagram data + AI copy.

**Architecture:** Full-screen quiz overlay on the portfolio site collects creator info in 6 steps, scrapes their Instagram for profile data + colors, generates niche-specific copy via Claude API, injects everything into the existing creator template, saves to Vercel Blob, and serves at a temporary preview URL with email-gated sharing. Neon Postgres stores leads and analytics.

**Tech Stack:** Vanilla HTML/CSS/JS (quiz UI), Vercel serverless functions (API), Neon Postgres (leads DB), Vercel Blob (mockup storage), Resend (email), Anthropic Claude Sonnet (AI copy), sharp (color extraction)

---

### Task 1: Database Setup (Neon Postgres)

**Files:**
- Create: `api/lib/db.mjs`
- Create: `scripts/init-db.sql`

- [ ] **Step 1: Install Neon via Vercel Marketplace**

Run in terminal (requires user action):
```bash
# User must run this manually — requires interactive terms acceptance
vercel integration add neon
```
Then pull env vars:
```bash
vercel env pull .env.local
```
This provisions `DATABASE_URL` automatically.

- [ ] **Step 2: Create the SQL schema file**

Create `scripts/init-db.sql`:
```sql
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
```

- [ ] **Step 3: Run the schema against Neon**

```bash
psql "$DATABASE_URL" -f scripts/init-db.sql
```
Expected: `CREATE TABLE` x3, `CREATE INDEX` x4.

- [ ] **Step 4: Create the database helper module**

Create `api/lib/db.mjs`:
```javascript
import { neon } from '@neondatabase/serverless';

let _sql;

export function sql() {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/samotto/portfolio-template
npm init -y
npm install @neondatabase/serverless
```

- [ ] **Step 6: Commit**

```bash
git add scripts/init-db.sql api/lib/db.mjs package.json package-lock.json
git commit -m "feat: add Neon Postgres schema and db helper"
```

---

### Task 2: Instagram Scraper API

**Files:**
- Create: `api/scrape-ig.mjs`

- [ ] **Step 1: Install sharp for color extraction**

```bash
npm install sharp
```

- [ ] **Step 2: Create the scrape endpoint**

Create `api/scrape-ig.mjs`:
```javascript
import sharp from 'sharp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { handle } = req.body || {};
  if (!handle) {
    return res.status(400).json({ success: false, error: 'Handle is required' });
  }

  const cleanHandle = handle.replace(/^@/, '').trim();

  // Primary: Instagram web profile API
  let profileData = null;
  try {
    profileData = await fetchProfileApi(cleanHandle);
  } catch (e) {
    console.error('Primary scrape failed:', e.message);
  }

  // Fallback: scrape profile page HTML
  if (!profileData) {
    try {
      profileData = await fetchProfileHtml(cleanHandle);
    } catch (e) {
      console.error('Fallback scrape failed:', e.message);
    }
  }

  if (!profileData) {
    return res.status(200).json({ success: false });
  }

  // Extract colors from profile photo
  let colors = [];
  if (profileData.photo) {
    try {
      colors = await extractColors(profileData.photo);
    } catch (e) {
      console.error('Color extraction failed:', e.message);
      colors = [
        { hex: '#B76E79', rgb: { r: 183, g: 110, b: 121 }, weight: 0.4 },
        { hex: '#FAF7F2', rgb: { r: 250, g: 247, b: 242 }, weight: 0.3 },
        { hex: '#2D1810', rgb: { r: 45, g: 24, b: 16 }, weight: 0.3 },
      ];
    }
  }

  return res.status(200).json({
    success: true,
    name: profileData.name,
    photo: profileData.photo,
    followers: profileData.followers,
    bio: profileData.bio,
    category: profileData.category,
    colors,
  });
}

async function fetchProfileApi(handle) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'X-IG-App-ID': '936619743392459',
    },
  });

  if (!resp.ok) throw new Error(`API returned ${resp.status}`);

  const data = await resp.json();
  const user = data?.data?.user;
  if (!user) throw new Error('No user data in response');

  return {
    name: user.full_name || handle,
    photo: user.profile_pic_url_hd || user.profile_pic_url || '',
    followers: user.edge_followed_by?.count || 0,
    bio: user.biography || '',
    category: user.category_name || detectNicheFromBio(user.biography || ''),
  };
}

async function fetchProfileHtml(handle) {
  const resp = await fetch(`https://www.instagram.com/${handle}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!resp.ok) throw new Error(`HTML fetch returned ${resp.status}`);
  const html = await resp.text();

  // Extract from meta tags
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || '';
  const description = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || '';

  // Parse follower count from description (e.g., "1.2M Followers, 500 Following...")
  let followers = 0;
  const followerMatch = description.match(/([\d,.]+[KMkm]?)\s*Followers/i);
  if (followerMatch) {
    followers = parseFollowerCount(followerMatch[1]);
  }

  // Extract name from description
  const nameMatch = description.match(/^([^-]+)\s*-/);
  const name = nameMatch ? nameMatch[1].trim() : handle;

  return {
    name,
    photo: ogImage,
    followers,
    bio: description,
    category: detectNicheFromBio(description),
  };
}

function parseFollowerCount(str) {
  const num = parseFloat(str.replace(/,/g, ''));
  if (/[Mm]/.test(str)) return Math.round(num * 1000000);
  if (/[Kk]/.test(str)) return Math.round(num * 1000);
  return Math.round(num);
}

function detectNicheFromBio(bio) {
  const lower = bio.toLowerCase();
  const niches = [
    { keywords: ['fitness', 'gym', 'workout', 'train', 'muscle', 'strength', 'coach'], niche: 'Fitness' },
    { keywords: ['beauty', 'makeup', 'skincare', 'cosmetic', 'glam'], niche: 'Beauty' },
    { keywords: ['food', 'recipe', 'cook', 'chef', 'eat', 'nutrition'], niche: 'Food' },
    { keywords: ['fashion', 'style', 'outfit', 'model', 'wear'], niche: 'Fashion' },
    { keywords: ['travel', 'adventure', 'explore', 'wander'], niche: 'Lifestyle' },
    { keywords: ['tech', 'code', 'develop', 'software', 'digital'], niche: 'Education' },
    { keywords: ['business', 'entrepreneur', 'startup', 'ceo', 'founder'], niche: 'Business' },
  ];
  for (const { keywords, niche } of niches) {
    if (keywords.some(k => lower.includes(k))) return niche;
  }
  return 'Lifestyle';
}

async function extractColors(photoUrl) {
  const resp = await fetch(photoUrl);
  if (!resp.ok) throw new Error('Failed to fetch photo');
  const buffer = Buffer.from(await resp.arrayBuffer());

  // Resize to small image and get raw pixel data
  const { data, info } = await sharp(buffer)
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Simple k-means-ish: bucket pixels into 5 clusters
  const pixels = [];
  for (let i = 0; i < data.length; i += 3) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  // Sort by brightness, split into 5 buckets
  pixels.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
  const bucketSize = Math.floor(pixels.length / 5);
  const colors = [];
  for (let i = 0; i < 5; i++) {
    const bucket = pixels.slice(i * bucketSize, (i + 1) * bucketSize);
    const avg = {
      r: Math.round(bucket.reduce((s, p) => s + p.r, 0) / bucket.length),
      g: Math.round(bucket.reduce((s, p) => s + p.g, 0) / bucket.length),
      b: Math.round(bucket.reduce((s, p) => s + p.b, 0) / bucket.length),
    };
    const hex = '#' + [avg.r, avg.g, avg.b].map(c => c.toString(16).padStart(2, '0')).join('');
    colors.push({ hex, rgb: avg, weight: 1 / 5 });
  }

  return colors;
}
```

- [ ] **Step 3: Test locally**

```bash
vercel dev
```
Then in another terminal:
```bash
curl -X POST http://localhost:3000/api/scrape-ig \
  -H "Content-Type: application/json" \
  -d '{"handle": "mandibagley"}'
```
Expected: JSON with `success: true`, name, photo URL, follower count, colors array.

- [ ] **Step 4: Commit**

```bash
git add api/scrape-ig.mjs package.json package-lock.json
git commit -m "feat: add Instagram scraper with color extraction"
```

---

### Task 3: AI Copy Generation API

**Files:**
- Create: `api/generate-copy.mjs`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Create the copy generation endpoint**

Create `api/generate-copy.mjs`:
```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, niche, sells, followers } = req.body || {};
  if (!name || !niche) {
    return res.status(400).json({ error: 'Name and niche required' });
  }

  const followerLabel = formatFollowers(followers || 0);
  const sellsList = (sells || []).join(', ') || 'content and brand partnerships';

  const prompt = `You are writing website copy for a ${niche.toLowerCase()} creator named ${name} who has ${followerLabel} followers. They sell/offer: ${sellsList}.

Generate the following in JSON format. All copy should be warm, confident, and specific to their niche — NOT generic template language. Write as if you deeply understand their world.

{
  "heroTagline": "A tagline for their niche (e.g., 'Fitness · Faith · Food')",
  "heroGreeting": "A casual greeting headline (e.g., 'Hey, I'm ${name}')",
  "aboutBody": "2-3 sentences about who they are and what they do. Warm and personal.",
  "aboutStats": [
    {"value": "realistic stat", "label": "label"},
    {"value": "realistic stat", "label": "label"},
    {"value": "realistic stat", "label": "label"}
  ],
  "programsHeadline": "Headline for their programs/offerings section",
  "programsSubheadline": "One-line subtitle",
  "programs": [
    {"title": "Program name", "description": "1-2 sentence description", "price": "$XX/mo"},
    {"title": "Program name", "description": "1-2 sentence description", "price": "$XX"}
  ],
  "partnersHeadline": "Headline for brand codes section",
  "partnersSubheadline": "One-line subtitle",
  "aiRecommendation": "A specific, actionable AI strategist recommendation for this creator based on their niche. 2-3 sentences. Reference specific content types and timing.",
  "briefingActions": [
    {"headline": "Action item 1 — specific to their niche", "dataPoint": "Supporting data point"},
    {"headline": "Action item 2 — specific to their niche", "dataPoint": "Supporting data point"}
  ]
}

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text;
    const copy = JSON.parse(text);

    return res.status(200).json({ success: true, copy });
  } catch (e) {
    console.error('AI copy generation failed:', e.message);
    return res.status(500).json({ success: false, error: 'Copy generation failed' });
  }
}

function formatFollowers(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(count);
}
```

- [ ] **Step 3: Add ANTHROPIC_API_KEY to Vercel**

```bash
vercel env add ANTHROPIC_API_KEY
```
Paste your Anthropic API key when prompted. Select all environments (production, preview, development).

Then pull to local:
```bash
vercel env pull .env.local
```

- [ ] **Step 4: Test locally**

```bash
curl -X POST http://localhost:3000/api/generate-copy \
  -H "Content-Type: application/json" \
  -d '{"name":"Mandi Bagley","niche":"Fitness","sells":["Programs & Courses","Affiliate Codes","Brand Deals"],"followers":1000000}'
```
Expected: JSON with `success: true` and a `copy` object containing all generated fields.

- [ ] **Step 5: Commit**

```bash
git add api/generate-copy.mjs package.json package-lock.json
git commit -m "feat: add AI copy generation endpoint"
```

---

### Task 4: Mockup Generation & Blob Storage

**Files:**
- Create: `api/generate-mockup.mjs`
- Create: `api/lib/build-mockup-html.mjs`
- Create: `api/lib/scale-analytics.mjs`

- [ ] **Step 1: Install Vercel Blob**

```bash
npm install @vercel/blob
```

Add Blob storage in Vercel dashboard (Settings → Storage → Create → Blob) or:
```bash
vercel blob create mockup-previews
vercel env pull .env.local
```
This provisions `BLOB_READ_WRITE_TOKEN`.

- [ ] **Step 2: Create the analytics scaler**

Create `api/lib/scale-analytics.mjs`:
```javascript
export function scaleAnalytics(followers) {
  const f = followers || 10000;

  // Scale views to 20-60% of followers
  const viewsRatio = 0.2 + Math.random() * 0.4;
  const views = Math.round(f * viewsRatio);

  // Engagement 3-8%
  const engagement = (3 + Math.random() * 5).toFixed(1);

  // Revenue scales with follower tier
  let revenue;
  if (f >= 1000000) revenue = 3000 + Math.round(Math.random() * 5000);
  else if (f >= 100000) revenue = 1500 + Math.round(Math.random() * 3000);
  else if (f >= 10000) revenue = 500 + Math.round(Math.random() * 1500);
  else revenue = 100 + Math.round(Math.random() * 400);

  // Week-over-week trends
  const viewsTrend = (5 + Math.random() * 20).toFixed(0);
  const followerGrowth = Math.round(f * (0.005 + Math.random() * 0.02));

  return {
    followers: f,
    views,
    engagement: parseFloat(engagement),
    revenue,
    viewsTrend: `+${viewsTrend}%`,
    followerGrowth: `+${followerGrowth.toLocaleString()}`,
    topSource: 'Instagram',
    topCountry: 'USA',
  };
}

export function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
```

- [ ] **Step 3: Create the mockup HTML builder**

Create `api/lib/build-mockup-html.mjs`:
```javascript
import { scaleAnalytics, formatNum } from './scale-analytics.mjs';

export function buildMockupHtml(data) {
  const { name, niche, photo, colors, sells, followers, copy } = data;
  const analytics = scaleAnalytics(followers);

  // Pick accent color (most vibrant from extracted colors)
  const accent = pickAccentColor(colors);
  const bg = pickBgColor(colors);
  const textColor = isLight(bg) ? '#2D1810' : '#F5EBE6';
  const mutedColor = isLight(bg) ? '#8B7B74' : 'rgba(245,235,230,0.5)';
  const surfaceColor = isLight(bg) ? '#FFFFFF' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight(bg) ? '#E8DDD7' : 'rgba(255,255,255,0.08)';

  // Build sections based on what they sell
  const sellsSet = new Set(sells || []);
  const showPrograms = sellsSet.has('Programs & Courses') || sellsSet.has('Coaching') || sellsSet.has('Digital Products');
  const showCodes = sellsSet.has('Affiliate Codes') || sellsSet.has('Brand Deals');
  const showRecipes = sellsSet.has('Recipes');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --bg: ${bg};
      --accent: ${accent};
      --text: ${textColor};
      --muted: ${mutedColor};
      --surface: ${surfaceColor};
      --border: ${borderColor};
      --serif: 'Cormorant Garamond', Georgia, serif;
      --sans: 'DM Sans', system-ui, sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--sans); }
    .preview-section { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 60px 24px; position: relative; }
    .preview-inner { max-width: 800px; width: 100%; margin: 0 auto; }

    /* ── Intro ── */
    .intro-photo { width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--accent); object-fit: cover; margin-bottom: 20px; }
    .intro-title { font-family: var(--serif); font-size: clamp(28px, 5vw, 48px); font-weight: 500; line-height: 1.15; margin-bottom: 12px; }
    .intro-title em { color: var(--accent); font-style: italic; }
    .intro-disclaimer { font-size: 11px; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; margin-top: 24px; line-height: 1.5; }

    /* ── Website preview ── */
    .site-frame { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
    .site-chrome { display: flex; gap: 5px; padding: 10px 14px; background: var(--bg); border-bottom: 1px solid var(--border); }
    .site-chrome span { width: 8px; height: 8px; border-radius: 50%; }
    .site-body { padding: 40px 32px; text-align: center; }
    .site-name { font-family: var(--serif); font-size: 36px; font-weight: 500; margin-bottom: 8px; }
    .site-tagline { font-size: 14px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px; }
    .site-avatar { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--accent); margin: 0 auto 16px; object-fit: cover; }
    .site-bio { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 500px; margin: 0 auto 24px; }
    .site-stats { display: flex; justify-content: center; gap: 32px; margin-bottom: 32px; }
    .site-stat-val { font-family: var(--serif); font-size: 24px; font-weight: 600; }
    .site-stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
    .site-section-title { font-family: var(--serif); font-size: 24px; margin: 32px 0 16px; }
    .site-program-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: left; }
    .site-program-name { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .site-program-desc { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
    .site-program-price { font-size: 14px; font-weight: 600; color: var(--accent); }
    .site-code-card { display: flex; justify-content: space-between; align-items: center; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; margin-bottom: 8px; }
    .site-code-brand { font-weight: 500; font-size: 14px; }
    .site-code-value { font-size: 13px; color: var(--accent); font-weight: 600; letter-spacing: 0.06em; }
    .layer-label { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }

    /* ── Analytics ── */
    .analytics-frame { background: ${isLight(bg) ? '#0C0809' : 'rgba(0,0,0,0.3)'}; border-radius: 16px; padding: 32px; color: #F5EBE6; }
    .analytics-frame .layer-label { color: var(--accent); }
    .analytics-title { font-family: var(--serif); font-size: 28px; font-weight: 500; color: #F5EBE6; margin-bottom: 24px; }
    .analytics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .analytics-stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; text-align: center; }
    .analytics-stat-val { font-family: var(--serif); font-size: 22px; font-weight: 600; color: #F5EBE6; }
    .analytics-stat-label { font-size: 9px; color: rgba(245,235,230,0.45); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
    .analytics-stat-trend { font-size: 10px; color: #4ade80; margin-top: 2px; }
    .sim-label { font-size: 10px; color: rgba(245,235,230,0.3); text-align: center; margin-top: 16px; letter-spacing: 0.04em; }

    /* ── AI Strategist ── */
    .ai-chat { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .ai-chat-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
    .ai-chat-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
    .ai-chat-title { font-size: 16px; font-weight: 600; }
    .ai-chat-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .ai-msg { max-width: 85%; padding: 12px 16px; border-radius: 14px; font-size: 14px; line-height: 1.6; }
    .ai-msg-user { align-self: flex-end; background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
    .ai-msg-bot { align-self: flex-start; background: var(--bg); border: 1px solid var(--border); border-bottom-left-radius: 4px; }

    /* ── Briefing ── */
    .briefing-email { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .briefing-email-header { padding: 16px 20px; border-bottom: 1px solid var(--border); }
    .briefing-from { font-size: 14px; font-weight: 600; }
    .briefing-subj { font-size: 13px; color: var(--muted); margin-top: 2px; }
    .briefing-email-body { padding: 20px; }
    .briefing-metrics { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .briefing-metric { font-size: 12px; color: var(--muted); }
    .briefing-metric strong { color: var(--text); }
    .briefing-action { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 8px; }
    .briefing-action-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .briefing-action-data { font-size: 12px; color: var(--muted); }

    /* ── CTA ── */
    .cta-section { text-align: center; }
    .cta-title { font-family: var(--serif); font-size: clamp(28px, 5vw, 44px); font-weight: 500; margin-bottom: 12px; }
    .cta-sub { font-size: 14px; color: var(--muted); margin-bottom: 32px; }
    .cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .cta-primary { padding: 14px 32px; background: var(--accent); color: #fff; border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; transition: transform 0.2s; }
    .cta-primary:hover { transform: translateY(-2px); }
    .cta-secondary { padding: 14px 32px; background: transparent; color: var(--text); border: 1px solid var(--border); border-radius: 12px; font-size: 15px; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .cta-secondary:hover { border-color: var(--accent); color: var(--accent); }
    .cta-expiry { font-size: 12px; color: var(--muted); margin-top: 20px; }

    /* ── Blur gate ── */
    .blur-gate { position: fixed; inset: 0; z-index: 1000; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
    .blur-gate-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px; max-width: 400px; text-align: center; }
    .blur-gate-title { font-family: var(--serif); font-size: 24px; margin-bottom: 8px; }
    .blur-gate-sub { font-size: 14px; color: var(--muted); margin-bottom: 24px; }
    .blur-gate-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; background: var(--bg); color: var(--text); margin-bottom: 12px; font-family: var(--sans); }
    .blur-gate-btn { width: 100%; padding: 12px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--sans); }

    @media (max-width: 640px) {
      .analytics-grid { grid-template-columns: repeat(2, 1fr); }
      .site-stats { gap: 20px; }
      .preview-section { padding: 40px 16px; }
    }
  </style>
</head>
<body>

  <!-- Section 1: Intro -->
  <div class="preview-section">
    <div class="preview-inner" style="text-align:center">
      <img class="intro-photo" src="${photo || ''}" alt="${name}" onerror="this.style.display='none'">
      <h1 class="intro-title">Based on your profile, here's what I'd build for you, <em>${name}</em>.</h1>
      <div class="intro-disclaimer">This is a preview built from your public profile. All data is illustrative — your real analytics will be connected once we build your platform.</div>
    </div>
  </div>

  <!-- Section 2: Website Preview -->
  <div class="preview-section">
    <div class="preview-inner">
      <div class="layer-label">Layer 01 — Your Website</div>
      <div class="site-frame">
        <div class="site-chrome">
          <span style="background:#ff5f57"></span>
          <span style="background:#febc2e"></span>
          <span style="background:#28c840"></span>
        </div>
        <div class="site-body">
          <img class="site-avatar" src="${photo || ''}" alt="${name}" onerror="this.style.display='none'">
          <div class="site-name">${name}</div>
          <div class="site-tagline">${copy.heroTagline || niche}</div>
          <div class="site-bio">${copy.aboutBody || ''}</div>
          <div class="site-stats">
            ${(copy.aboutStats || []).map(s => `<div><div class="site-stat-val">${s.value}</div><div class="site-stat-label">${s.label}</div></div>`).join('')}
          </div>
          ${showPrograms ? `
          <div class="site-section-title">${copy.programsHeadline || 'My Programs'}</div>
          ${(copy.programs || []).map(p => `
            <div class="site-program-card">
              <div class="site-program-name">${p.title}</div>
              <div class="site-program-desc">${p.description}</div>
              <div class="site-program-price">${p.price}</div>
            </div>
          `).join('')}` : ''}
          ${showCodes ? `
          <div class="site-section-title">${copy.partnersHeadline || 'My Favorites'}</div>
          <div class="site-code-card"><span class="site-code-brand">Brand Partner</span><span class="site-code-value">CODE15</span></div>
          <div class="site-code-card"><span class="site-code-brand">Brand Partner</span><span class="site-code-value">SAVE20</span></div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- Section 3: Analytics -->
  <div class="preview-section">
    <div class="preview-inner">
      <div class="layer-label">Layer 02 — Your Analytics</div>
      <div class="analytics-frame">
        <div class="analytics-title">Growth Overview</div>
        <div class="analytics-grid">
          <div class="analytics-stat">
            <div class="analytics-stat-val">${formatNum(analytics.followers)}</div>
            <div class="analytics-stat-label">Followers</div>
            <div class="analytics-stat-trend">${analytics.followerGrowth} this month</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat-val">${formatNum(analytics.views)}</div>
            <div class="analytics-stat-label">Total Views</div>
            <div class="analytics-stat-trend">${analytics.viewsTrend}</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat-val">${analytics.engagement}%</div>
            <div class="analytics-stat-label">Engagement</div>
            <div class="analytics-stat-trend">+2.1%</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat-val">$${analytics.revenue.toLocaleString()}</div>
            <div class="analytics-stat-label">Link Revenue</div>
            <div class="analytics-stat-trend">+34%</div>
          </div>
        </div>
        <div class="sim-label">Simulated data · Based on your public profile</div>
      </div>
    </div>
  </div>

  <!-- Section 4: AI Strategist -->
  <div class="preview-section">
    <div class="preview-inner">
      <div class="layer-label">Layer 03 — Your AI Strategist</div>
      <div class="ai-chat">
        <div class="ai-chat-header">
          <div class="ai-chat-icon"><i class="fa-solid fa-brain"></i></div>
          <div><div class="ai-chat-title">Your AI Strategist</div></div>
        </div>
        <div class="ai-chat-body">
          <div class="ai-msg ai-msg-user">When should I post this week?</div>
          <div class="ai-msg ai-msg-bot">${copy.aiRecommendation || 'Based on your engagement patterns, Tuesday at 7pm and Thursday at 12pm are your highest-performing windows this month.'}</div>
        </div>
      </div>
      <div class="sim-label" style="color:var(--muted);margin-top:16px">Sample recommendation · Your real AI will use your actual data</div>
    </div>
  </div>

  <!-- Section 5: Weekly Briefing -->
  <div class="preview-section">
    <div class="preview-inner">
      <div class="layer-label">Layer 04 — Your Weekly Briefing</div>
      <div class="briefing-email">
        <div class="briefing-email-header">
          <div class="briefing-from">Your AI Strategist</div>
          <div class="briefing-subj">Your Monday Briefing — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <div class="briefing-email-body">
          <div class="briefing-metrics">
            <span class="briefing-metric"><i class="fa-brands fa-youtube" style="color:#FF0000"></i> <strong>${formatNum(analytics.views)}</strong> views ${analytics.viewsTrend}</span>
            <span class="briefing-metric"><i class="fa-brands fa-instagram" style="color:#E1306C"></i> <strong>${analytics.engagement}%</strong> engagement</span>
            <span class="briefing-metric"><i class="fa-brands fa-tiktok"></i> <strong>${formatNum(Math.round(analytics.views * 0.8))}</strong> views</span>
          </div>
          ${(copy.briefingActions || []).map(a => `
          <div class="briefing-action">
            <div class="briefing-action-title">${a.headline}</div>
            <div class="briefing-action-data">${a.dataPoint}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="sim-label" style="color:var(--muted);margin-top:16px">Simulated · Your real briefings use your actual data</div>
    </div>
  </div>

  <!-- Section 6: CTA -->
  <div class="preview-section">
    <div class="preview-inner cta-section">
      <h2 class="cta-title">Ready to make it real?</h2>
      <p class="cta-sub">I'll fully customize this to your brand and have it live within 72 hours.</p>
      <div class="cta-buttons">
        <a class="cta-primary" href="https://bysamotto.com/#contact">Build mine <i class="fa-solid fa-arrow-right"></i></a>
        <a class="cta-secondary" href="https://bysamotto.com/#contact">Book a call <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="cta-expiry">This preview expires in 7 days</div>
    </div>
  </div>

  <!-- Blur gate (injected by server for non-owners) -->
  <div class="blur-gate" id="blurGate" style="display:none">
    <div class="blur-gate-card">
      <h3 class="blur-gate-title">See this mockup</h3>
      <p class="blur-gate-sub">Enter your email to view this personalized creator platform preview.</p>
      <input class="blur-gate-input" type="email" id="gateEmail" placeholder="your@email.com">
      <button class="blur-gate-btn" onclick="unlockPreview()">View mockup</button>
    </div>
  </div>

  <script>
    // Check if this is the owner or needs gate
    var isOwner = document.cookie.includes('preview_owner=HASH_PLACEHOLDER');
    var isGated = document.body.dataset.gated === 'true';
    if (isGated && !isOwner) {
      document.getElementById('blurGate').style.display = 'flex';
    }

    function unlockPreview() {
      var email = document.getElementById('gateEmail').value;
      if (!email) return;
      fetch('/api/preview-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: 'HASH_PLACEHOLDER', email: email })
      }).then(function(r) { return r.json(); }).then(function() {
        document.getElementById('blurGate').style.display = 'none';
      });
    }
  </script>

</body>
</html>`;
}

function pickAccentColor(colors) {
  if (!colors || !colors.length) return '#B76E79';
  // Pick the most saturated color
  let best = colors[0];
  let bestSat = 0;
  for (const c of colors) {
    const { r, g, b } = c.rgb;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat > bestSat) { bestSat = sat; best = c; }
  }
  return best.hex;
}

function pickBgColor(colors) {
  if (!colors || !colors.length) return '#FAF7F2';
  // Pick the lightest or darkest color for background
  const sorted = [...colors].sort((a, b) => {
    const la = a.rgb.r + a.rgb.g + a.rgb.b;
    const lb = b.rgb.r + b.rgb.g + b.rgb.b;
    return lb - la;
  });
  return sorted[0].hex;
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
```

Note: `formatNum` is imported from `scale-analytics.mjs`.

- [ ] **Step 4: Create the generate-mockup endpoint**

Create `api/generate-mockup.mjs`:
```javascript
import { put } from '@vercel/blob';
import { sql } from './lib/db.mjs';
import { buildMockupHtml } from './lib/build-mockup-html.mjs';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, handle, followers, niche, sells, colors, photo, copy } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Generate unique hash
  const hash = crypto.randomBytes(8).toString('hex');

  // Build the mockup HTML
  const html = buildMockupHtml({ name, niche, photo, colors, sells, followers, copy });

  // Replace hash placeholder in HTML
  const finalHtml = html.replace(/HASH_PLACEHOLDER/g, hash);

  // Upload to Vercel Blob
  const blob = await put(`previews/${hash}.html`, finalHtml, {
    access: 'public',
    contentType: 'text/html',
  });

  // Save lead to database
  const db = sql();
  await db`
    INSERT INTO leads (name, email, instagram_handle, follower_count, niche, sells, colors, photo_url, preview_hash, blob_url)
    VALUES (${name}, ${email}, ${handle || null}, ${followers || null}, ${niche || null}, ${sells || []}, ${JSON.stringify(colors || [])}, ${photo || null}, ${hash}, ${blob.url})
  `;

  // Send email with preview link via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (resendKey && fromEmail) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Your platform preview is ready, ${name}!`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px">
            <h2 style="margin-bottom:8px">Hey ${name},</h2>
            <p style="color:#666;line-height:1.6">Your personalized platform preview is ready. Here's a glimpse of what your custom creator platform could look like.</p>
            <a href="https://bysamotto.com/preview/${hash}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#B76E79;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">View Your Preview</a>
            <p style="color:#999;font-size:13px">This preview expires in 7 days. Want to make it real? Reply to this email or book a call.</p>
            <p style="color:#999;font-size:13px;margin-top:24px">— Sam Otto</p>
          </div>
        `,
      }),
    });

    // Also notify Sam
    const toEmail = process.env.CONTACT_TO_EMAIL;
    if (toEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: `New mockup lead: ${name} (@${handle || 'no handle'})`,
          html: `
            <h2>New mockup generated</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Instagram:</strong> @${handle || 'N/A'}</p>
            <p><strong>Followers:</strong> ${followers ? followers.toLocaleString() : 'N/A'}</p>
            <p><strong>Niche:</strong> ${niche || 'N/A'}</p>
            <p><strong>Sells:</strong> ${(sells || []).join(', ') || 'N/A'}</p>
            <p><a href="https://bysamotto.com/preview/${hash}">View their preview</a></p>
          `,
        }),
      });
    }
  }

  // Set owner cookie
  res.setHeader('Set-Cookie', `preview_owner=${hash}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

  return res.status(200).json({
    success: true,
    previewUrl: `/preview/${hash}`,
    hash,
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add api/generate-mockup.mjs api/lib/build-mockup-html.mjs api/lib/scale-analytics.mjs package.json package-lock.json
git commit -m "feat: add mockup generation with Blob storage, DB, and email"
```

---

### Task 5: Preview Serving & Email Gate

**Files:**
- Create: `api/preview/[hash].mjs`
- Create: `api/preview-unlock.mjs`

- [ ] **Step 1: Create the preview serving endpoint**

Create `api/preview/[hash].mjs`:
```javascript
import { sql } from '../lib/db.mjs';

export default async function handler(req, res) {
  const hash = req.query.hash;
  if (!hash) return res.status(400).send('Missing hash');

  const db = sql();

  // Look up preview
  const rows = await db`SELECT * FROM leads WHERE preview_hash = ${hash}`;
  if (!rows.length) {
    return res.status(404).send(expiredPage());
  }

  const lead = rows[0];

  // Check expiry
  if (new Date(lead.expires_at) < new Date()) {
    return res.status(410).send(expiredPage());
  }

  // Check if owner via cookie
  const cookies = parseCookies(req.headers.cookie || '');
  const isOwner = cookies.preview_owner === hash || cookies[`preview_unlocked_${hash}`] === 'true';

  // Log the view
  await db`INSERT INTO preview_views (preview_hash, viewer_email, is_owner) VALUES (${hash}, ${isOwner ? lead.email : null}, ${isOwner})`;

  // Fetch the HTML from Blob
  const blobResp = await fetch(lead.blob_url);
  if (!blobResp.ok) {
    return res.status(500).send('Preview not found in storage');
  }
  let html = await blobResp.text();

  // If not owner, inject gated flag
  if (!isOwner) {
    html = html.replace('<body>', '<body data-gated="true">');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
}

function parseCookies(str) {
  const cookies = {};
  str.split(';').forEach(pair => {
    const [key, val] = pair.trim().split('=');
    if (key) cookies[key] = val || '';
  });
  return cookies;
}

function expiredPage() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview Expired</title>
<style>body{font-family:system-ui;background:#0C0809;color:#F5EBE6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}
a{color:#B76E79;text-decoration:none;border:1px solid #B76E79;padding:12px 28px;border-radius:10px;margin-top:20px;display:inline-block;font-weight:600}</style>
</head><body><div><h1>This preview has expired</h1><p style="color:rgba(245,235,230,0.5)">Previews are available for 7 days.</p><a href="https://bysamotto.com">Build a new one</a></div></body></html>`;
}
```

- [ ] **Step 2: Create the unlock endpoint**

Create `api/preview-unlock.mjs`:
```javascript
import { sql } from './lib/db.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hash, email } = req.body || {};
  if (!hash || !email) {
    return res.status(400).json({ error: 'Hash and email required' });
  }

  const db = sql();

  // Verify the preview exists
  const rows = await db`SELECT preview_hash FROM leads WHERE preview_hash = ${hash}`;
  if (!rows.length) {
    return res.status(404).json({ error: 'Preview not found' });
  }

  // Store the captured email
  await db`INSERT INTO share_captures (preview_hash, email) VALUES (${hash}, ${email})`;

  // Notify Sam of the share capture
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (resendKey && fromEmail && toEmail) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Shared preview lead: ${email}`,
        html: `<p>Someone unlocked a shared preview.</p><p><strong>Email:</strong> ${email}</p><p><strong>Preview:</strong> <a href="https://bysamotto.com/preview/${hash}">View</a></p>`,
      }),
    });
  }

  // Set cookie so they don't get gated again
  res.setHeader('Set-Cookie', `preview_unlocked_${hash}=true; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

  return res.status(200).json({ success: true });
}
```

- [ ] **Step 3: Update vercel.json to route preview URLs**

Update `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/preview/:hash", "destination": "/api/preview/:hash" },
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add api/preview/ api/preview-unlock.mjs vercel.json
git commit -m "feat: add preview serving with email gate and share tracking"
```

---

### Task 6: Cleanup Cron

**Files:**
- Create: `api/cron/cleanup-previews.mjs`
- Modify: `vercel.json`

- [ ] **Step 1: Create the cleanup endpoint**

Create `api/cron/cleanup-previews.mjs`:
```javascript
import { sql } from '../lib/db.mjs';
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  // Verify cron secret in production
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = sql();

  // Find expired previews
  const expired = await db`
    SELECT preview_hash, blob_url FROM leads
    WHERE expires_at < NOW() AND status != 'expired'
  `;

  let deleted = 0;
  for (const row of expired) {
    // Delete from Blob
    if (row.blob_url) {
      try {
        await del(row.blob_url);
      } catch (e) {
        console.error(`Failed to delete blob for ${row.preview_hash}:`, e.message);
      }
    }

    // Mark as expired in DB (soft delete)
    await db`UPDATE leads SET status = 'expired' WHERE preview_hash = ${row.preview_hash}`;
    deleted++;
  }

  return res.status(200).json({ success: true, deleted });
}
```

- [ ] **Step 2: Add cron to vercel.json**

Update `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/preview/:hash", "destination": "/api/preview/:hash" },
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "crons": [
    { "path": "/api/cron/cleanup-previews", "schedule": "0 4 * * *" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add api/cron/cleanup-previews.mjs vercel.json
git commit -m "feat: add daily cleanup cron for expired previews"
```

---

### Task 7: Quiz UI — Full-Screen Overlay

**Files:**
- Modify: `/Users/samotto/portfolio-template/index.html` (add quiz overlay HTML + CSS + JS)

- [ ] **Step 1: Add quiz CSS to the style block**

Add before `</style>` in `index.html`:
```css
/* ══════════════════════════════════════════
   QUIZ OVERLAY
   ══════════════════════════════════════════ */
.quiz-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: var(--black);
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.quiz-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.quiz-progress {
  height: 3px;
  background: rgba(255,255,255,0.06);
  position: relative;
}
.quiz-progress-fill {
  height: 100%;
  background: var(--rose);
  transition: width 0.4s ease;
  border-radius: 0 2px 2px 0;
}

.quiz-close {
  position: absolute;
  top: 20px;
  right: 24px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  z-index: 2;
  transition: color 0.2s;
}
.quiz-close:hover { color: var(--text); }

.quiz-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.quiz-step {
  display: none;
  text-align: center;
  max-width: 500px;
  width: 100%;
  animation: quizFadeIn 0.4s ease;
}
.quiz-step.active { display: block; }

@keyframes quizFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.quiz-question {
  font-family: var(--serif);
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 500;
  color: var(--text);
  margin-bottom: 32px;
  line-height: 1.15;
}

.quiz-input {
  width: 100%;
  max-width: 360px;
  padding: 16px 20px;
  background: var(--dark-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text);
  font-size: 16px;
  font-family: var(--sans);
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}
.quiz-input:focus { border-color: var(--rose); }
.quiz-input::placeholder { color: var(--text-muted); }

.quiz-next {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 14px 36px;
  background: var(--rose);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--sans);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.quiz-next:hover { background: var(--rose-light); transform: translateY(-1px); }
.quiz-next:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

/* Profile card (step 2 result) */
.quiz-profile {
  display: none;
  background: var(--dark-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin: 24px auto;
  max-width: 320px;
  text-align: center;
  animation: quizFadeIn 0.5s ease;
}
.quiz-profile.show { display: block; }
.quiz-profile-photo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--rose);
  object-fit: cover;
  margin-bottom: 12px;
}
.quiz-profile-name { font-family: var(--serif); font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.quiz-profile-followers { font-size: 13px; color: var(--text-muted); }
.quiz-profile-confirm { margin-top: 16px; display: flex; gap: 10px; justify-content: center; }
.quiz-profile-yes, .quiz-profile-no {
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--sans);
  border: none;
}
.quiz-profile-yes { background: var(--rose); color: #fff; }
.quiz-profile-no { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }

/* Multi-select pills (step 4) */
.quiz-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 440px;
  margin: 0 auto;
}
.quiz-pill {
  padding: 10px 20px;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-sub);
  font-size: 14px;
  font-family: var(--sans);
  cursor: pointer;
  transition: all 0.2s;
}
.quiz-pill.selected {
  background: rgba(16,185,129,0.12);
  border-color: var(--rose);
  color: var(--rose-light);
}

/* Color palette display (step 5) */
.quiz-palette {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 24px 0;
}
.quiz-color-swatch {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid var(--border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Niche confirm (step 3) */
.quiz-niche-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: 360px;
  margin: 0 auto;
}
.quiz-niche-btn {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-sub);
  font-size: 13px;
  font-family: var(--sans);
  cursor: pointer;
  transition: all 0.2s;
}
.quiz-niche-btn.selected {
  background: rgba(16,185,129,0.12);
  border-color: var(--rose);
  color: var(--rose-light);
}

/* Loading animation */
.quiz-loading {
  display: none;
  text-align: center;
}
.quiz-loading.show { display: block; }
.quiz-loading-text {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 16px;
  transition: opacity 0.3s;
}
.quiz-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--rose);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Cinematic loading (post-quiz) */
.quiz-generating {
  display: none;
  text-align: center;
  max-width: 400px;
}
.quiz-generating.show { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }
.gen-step {
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 16px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease, color 0.3s ease;
}
.gen-step.active {
  opacity: 1;
  transform: translateY(0);
  color: var(--text);
}
.gen-step.done { color: var(--rose); }

@media (max-width: 480px) {
  .quiz-niche-grid { grid-template-columns: repeat(2, 1fr); }
  .quiz-question { font-size: clamp(22px, 6vw, 32px); }
}
```

- [ ] **Step 2: Add quiz HTML before `</body>`**

Add before the closing `</body>` tag in `index.html`:
```html
<!-- QUIZ OVERLAY -->
<div class="quiz-overlay" id="quizOverlay">
  <div class="quiz-progress"><div class="quiz-progress-fill" id="quizProgress" style="width:16.6%"></div></div>
  <button class="quiz-close" onclick="closeQuiz()">&times;</button>

  <div class="quiz-body">

    <!-- Step 1: Name -->
    <div class="quiz-step active" data-step="1">
      <div class="quiz-question">What's your name?</div>
      <input class="quiz-input" id="qName" placeholder="Your name" autofocus>
      <br>
      <button class="quiz-next" onclick="quizNext(2)">Next <i class="fa-solid fa-arrow-right"></i></button>
    </div>

    <!-- Step 2: Instagram -->
    <div class="quiz-step" data-step="2">
      <div class="quiz-question">What's your Instagram?</div>
      <input class="quiz-input" id="qHandle" placeholder="@yourhandle">
      <br>
      <button class="quiz-next" id="qHandleBtn" onclick="scrapeProfile()">Find my profile <i class="fa-solid fa-search"></i></button>
      <div class="quiz-loading" id="qScrapeLoading">
        <div class="quiz-spinner"></div>
        <div class="quiz-loading-text" id="qScrapeText">Finding your profile...</div>
      </div>
      <div class="quiz-profile" id="qProfile">
        <img class="quiz-profile-photo" id="qProfilePhoto" src="" alt="">
        <div class="quiz-profile-name" id="qProfileName"></div>
        <div class="quiz-profile-followers" id="qProfileFollowers"></div>
        <div class="quiz-profile-confirm">
          <button class="quiz-profile-yes" onclick="confirmProfile(true)">That's me!</button>
          <button class="quiz-profile-no" onclick="confirmProfile(false)">Not me</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Niche -->
    <div class="quiz-step" data-step="3">
      <div class="quiz-question" id="qNicheQuestion">What's your niche?</div>
      <div class="quiz-niche-grid" id="qNicheGrid">
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Fitness</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Beauty</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Lifestyle</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Food</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Education</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Entertainment</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Fashion</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Business</button>
        <button class="quiz-niche-btn" onclick="selectNiche(this)">Other</button>
      </div>
      <button class="quiz-next" id="qNicheNext" onclick="quizNext(4)" disabled>Next <i class="fa-solid fa-arrow-right"></i></button>
    </div>

    <!-- Step 4: What they sell -->
    <div class="quiz-step" data-step="4">
      <div class="quiz-question">What do you offer?</div>
      <div class="quiz-pills" id="qPills">
        <button class="quiz-pill" onclick="togglePill(this)">Programs & Courses</button>
        <button class="quiz-pill" onclick="togglePill(this)">Affiliate Codes</button>
        <button class="quiz-pill" onclick="togglePill(this)">Brand Deals</button>
        <button class="quiz-pill" onclick="togglePill(this)">Merch</button>
        <button class="quiz-pill" onclick="togglePill(this)">Coaching</button>
        <button class="quiz-pill" onclick="togglePill(this)">Digital Products</button>
        <button class="quiz-pill" onclick="togglePill(this)">Recipes</button>
        <button class="quiz-pill" onclick="togglePill(this)">Content/Tutorials</button>
      </div>
      <button class="quiz-next" onclick="quizNext(5)">Next <i class="fa-solid fa-arrow-right"></i></button>
    </div>

    <!-- Step 5: Colors -->
    <div class="quiz-step" data-step="5">
      <div class="quiz-question">We pulled these from your brand</div>
      <div class="quiz-palette" id="qPalette"></div>
      <button class="quiz-next" onclick="quizNext(6)">Looks right <i class="fa-solid fa-check"></i></button>
    </div>

    <!-- Step 6: Email -->
    <div class="quiz-step" data-step="6">
      <div class="quiz-question">Where should we send your mockup?</div>
      <input class="quiz-input" id="qEmail" type="email" placeholder="your@email.com">
      <br>
      <button class="quiz-next" onclick="submitQuiz()">Build my preview <i class="fa-solid fa-wand-magic-sparkles"></i></button>
    </div>

    <!-- Cinematic loading -->
    <div class="quiz-generating" id="quizGenerating">
      <div class="gen-step" data-gen="1">Building your website...</div>
      <div class="gen-step" data-gen="2">Scaling your analytics...</div>
      <div class="gen-step" data-gen="3">Training your AI strategist...</div>
      <div class="gen-step" data-gen="4">Writing your first briefing...</div>
    </div>

  </div>
</div>
```

- [ ] **Step 3: Add quiz JavaScript before `</body>`**

Add the quiz controller script:
```html
<script>
// ── Quiz Controller ──
var quizData = { name: '', handle: '', followers: 0, niche: '', sells: [], colors: [], photo: '', email: '' };

function openQuiz() {
  document.getElementById('quizOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  var nameInput = document.getElementById('qName');
  if (nameInput) setTimeout(function() { nameInput.focus(); }, 400);
}

function closeQuiz() {
  document.getElementById('quizOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function quizNext(step) {
  // Collect data from current step
  if (step === 2) {
    var name = document.getElementById('qName').value.trim();
    if (!name) return;
    quizData.name = name;
  }

  // Hide all steps, show target
  document.querySelectorAll('.quiz-step').forEach(function(s) { s.classList.remove('active'); });
  var target = document.querySelector('.quiz-step[data-step="' + step + '"]');
  if (target) target.classList.add('active');

  // Update progress bar
  document.getElementById('quizProgress').style.width = (step / 6 * 100) + '%';

  // Pre-populate niche if detected
  if (step === 3 && quizData.niche) {
    document.getElementById('qNicheQuestion').textContent = "Looks like you're in " + quizData.niche + ". Is that right?";
    document.querySelectorAll('.quiz-niche-btn').forEach(function(btn) {
      if (btn.textContent === quizData.niche) {
        btn.classList.add('selected');
        document.getElementById('qNicheNext').disabled = false;
      }
    });
  }

  // Show color palette
  if (step === 5) {
    var palette = document.getElementById('qPalette');
    palette.innerHTML = '';
    (quizData.colors || []).forEach(function(c) {
      var swatch = document.createElement('div');
      swatch.className = 'quiz-color-swatch';
      swatch.style.background = c.hex;
      palette.appendChild(swatch);
    });
    if (!quizData.colors.length) {
      palette.innerHTML = '<div style="color:var(--text-muted);font-size:14px">Default palette will be applied</div>';
    }
  }
}

function scrapeProfile() {
  var handle = document.getElementById('qHandle').value.trim().replace(/^@/, '');
  if (!handle) return;
  quizData.handle = handle;

  // Show loading
  document.getElementById('qHandleBtn').style.display = 'none';
  document.getElementById('qScrapeLoading').classList.add('show');

  fetch('/api/scrape-ig', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle: handle })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    document.getElementById('qScrapeLoading').classList.remove('show');

    if (data.success) {
      // Show profile card
      document.getElementById('qProfilePhoto').src = data.photo;
      document.getElementById('qProfileName').textContent = data.name;
      document.getElementById('qProfileFollowers').textContent = formatFollowers(data.followers) + ' followers';
      document.getElementById('qProfile').classList.add('show');

      quizData.photo = data.photo;
      quizData.followers = data.followers;
      quizData.niche = data.category || '';
      quizData.colors = data.colors || [];
      if (!quizData.name || quizData.name === '') quizData.name = data.name;
    } else {
      // Fallback: just advance to niche step manually
      document.getElementById('qHandleBtn').style.display = '';
      quizNext(3);
    }
  })
  .catch(function() {
    document.getElementById('qScrapeLoading').classList.remove('show');
    document.getElementById('qHandleBtn').style.display = '';
    quizNext(3);
  });
}

function confirmProfile(isCorrect) {
  if (isCorrect) {
    quizNext(3);
  } else {
    document.getElementById('qProfile').classList.remove('show');
    document.getElementById('qHandleBtn').style.display = '';
    quizNext(3);
  }
}

function selectNiche(btn) {
  document.querySelectorAll('.quiz-niche-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  quizData.niche = btn.textContent;
  document.getElementById('qNicheNext').disabled = false;
}

function togglePill(btn) {
  btn.classList.toggle('selected');
}

function submitQuiz() {
  var email = document.getElementById('qEmail').value.trim();
  if (!email) return;
  quizData.email = email;

  // Collect sells
  quizData.sells = [];
  document.querySelectorAll('.quiz-pill.selected').forEach(function(p) {
    quizData.sells.push(p.textContent);
  });

  // Hide steps, show cinematic loading
  document.querySelectorAll('.quiz-step').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById('quizProgress').style.width = '100%';
  var gen = document.getElementById('quizGenerating');
  gen.classList.add('show');

  // Animate generation steps
  var steps = gen.querySelectorAll('.gen-step');
  var delay = 0;
  steps.forEach(function(s, i) {
    setTimeout(function() {
      s.classList.add('active');
      if (i > 0) steps[i - 1].classList.add('done');
    }, delay);
    delay += 2500;
  });

  // First: generate AI copy
  fetch('/api/generate-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: quizData.name,
      niche: quizData.niche,
      sells: quizData.sells,
      followers: quizData.followers
    })
  })
  .then(function(r) { return r.json(); })
  .then(function(copyResult) {
    // Then: generate mockup with the copy
    return fetch('/api/generate-mockup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: quizData.name,
        email: quizData.email,
        handle: quizData.handle,
        followers: quizData.followers,
        niche: quizData.niche,
        sells: quizData.sells,
        colors: quizData.colors,
        photo: quizData.photo,
        copy: copyResult.success ? copyResult.copy : {}
      })
    });
  })
  .then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.success) {
      // Wait for animation to finish, then redirect
      var remaining = Math.max(0, 10000 - Date.now());
      setTimeout(function() {
        window.location.href = result.previewUrl;
      }, 2000);
    }
  })
  .catch(function(err) {
    console.error('Quiz submission failed:', err);
    alert('Something went wrong. Please try again.');
    closeQuiz();
  });
}

function formatFollowers(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// Enter key advances on input steps
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var overlay = document.getElementById('quizOverlay');
  if (!overlay.classList.contains('open')) return;

  var active = overlay.querySelector('.quiz-step.active');
  if (!active) return;
  var step = parseInt(active.dataset.step);

  if (step === 1) quizNext(2);
  else if (step === 2) scrapeProfile();
  else if (step === 6) submitQuiz();
});
</script>
```

- [ ] **Step 4: Add "Build my demo" buttons to the portfolio**

Add `onclick="openQuiz()"` to the existing CTA buttons throughout the page. Find and update these locations:

In the hero actions area, add a second button:
```html
<a href="javascript:void(0)" class="btn-ghost" onclick="openQuiz()"><i class="fa-solid fa-wand-magic-sparkles"></i> Build My Demo</a>
```

- [ ] **Step 5: Test the full quiz flow locally**

```bash
vercel dev
```
Open `http://localhost:3000`, click "Build My Demo", complete the quiz. Verify:
- Each step advances correctly
- Instagram scrape returns profile data
- Colors display in step 5
- Cinematic loading plays
- Mockup generates and redirects to preview URL

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add full-screen quiz overlay with 6-step flow"
```

---

### Task 8: Add Vercel Blob Storage Token

**Files:**
- None (Vercel dashboard action)

- [ ] **Step 1: Create Blob store in Vercel**

```bash
vercel blob create mockup-previews
```
Or in Vercel Dashboard: Settings → Storage → Create Store → Blob.

- [ ] **Step 2: Pull updated env vars**

```bash
vercel env pull .env.local
```
This should now include `BLOB_READ_WRITE_TOKEN`.

- [ ] **Step 3: Verify .env.local has all required vars**

Check that `.env.local` contains:
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `ANTHROPIC_API_KEY`

---

### Task 9: End-to-End Testing & Deploy

**Files:**
- None (testing + deployment)

- [ ] **Step 1: Run full local test**

```bash
vercel dev
```

Test the complete flow:
1. Click "Build My Demo" on portfolio
2. Enter name
3. Enter Instagram handle → verify scrape + profile card
4. Confirm niche
5. Select what you sell
6. Confirm colors
7. Enter email
8. Watch cinematic loading
9. Land on preview page
10. Verify all 6 sections render correctly
11. Open preview in incognito → verify blur gate appears
12. Enter email in blur gate → verify unlock works

- [ ] **Step 2: Check email delivery**

Verify two emails were sent:
1. To the quiz taker (preview link)
2. To Sam (lead notification)

- [ ] **Step 3: Check database**

```bash
psql "$DATABASE_URL" -c "SELECT name, email, instagram_handle, niche, status FROM leads ORDER BY created_at DESC LIMIT 5;"
```
Verify the lead was recorded.

- [ ] **Step 4: Deploy to production**

```bash
git add -A
git commit -m "feat: complete mockup generator — quiz, scrape, AI copy, preview, email"
git push origin main
```

Vercel auto-deploys from main. Verify on `bysamotto.com`:
1. Quiz opens and completes
2. Preview URL works
3. Emails send
4. Share gate works

- [ ] **Step 5: Test the cleanup cron**

After deploy, verify the cron is registered:
```bash
vercel crons ls
```
Expected: `/api/cron/cleanup-previews` at `0 4 * * *`.
