# Mockup Generator — Design Spec

Interactive quiz-to-mockup sales tool for bysamotto.com. A full-screen quiz overlay collects creator info, scrapes their Instagram, generates AI copy, and produces a personalized preview of their complete platform — website, analytics, AI strategist, and weekly briefing.

## Quiz Flow

Full-screen overlay triggered by "Build my demo" buttons throughout the portfolio site. The existing contact form stays as-is for simple reach-outs. Progress bar at top, one question per screen, 6 steps total.

### Step 1 — Name
- Text input: "What's your name?"
- Auto-focuses on overlay open
- Enter or "Next" button advances

### Step 2 — Instagram Handle
- Text input with `@` prefix: "What's your Instagram?"
- On submit: triggers `/api/scrape-ig`
- Loading animation: "Finding your profile..." with a spinner/pulse
- On success: profile card slides in showing their photo, display name, follower count
- Confirmation: "Is this you?" — Yes continues, No opens manual fallback
- Manual fallback: name, approximate followers (dropdown), niche (dropdown)
- Color extraction happens during this step (from profile photo)

### Step 3 — Niche Confirmation
- Auto-detected from Instagram bio/category
- Shows: "Looks like you're in [detected niche]. Is that right?"
- Confirm button (one tap) or pick from list: Fitness, Beauty, Lifestyle, Food, Education, Entertainment, Fashion, Business, Other
- One tap for most users

### Step 4 — What They Sell
- Multi-select pill buttons, tap all that apply:
  - Programs & Courses
  - Affiliate Codes
  - Brand Deals
  - Merch
  - Coaching
  - Digital Products
  - Recipes
  - Content/Tutorials
- These determine which sections appear in the mockup

### Step 5 — Colors
- Auto-extracted palette from their Instagram profile photo
- Shows 3-5 dominant colors: "We pulled these from your brand"
- Confirm button to accept
- No manual color picker — auto-detect only

### Step 6 — Email
- Email input: "Where should we send your mockup link?"
- This is the lead capture — positioned last so they're already invested (5 steps in)
- Submit triggers mockup generation

### Post-Quiz Loading Screen
- Full-screen cinematic animation over their detected brand colors
- Staged progress steps that animate in sequentially:
  1. "Building your website..."
  2. "Scaling your analytics..."
  3. "Training your AI strategist..."
  4. "Writing your first briefing..."
- Duration: 10-15 seconds (actual generation time)
- On complete: redirects to preview URL

## Preview Page

Lives at `bysamotto.com/preview/[hash]`. Scrolling reveal — each section is roughly one viewport.

### Section 1 — Personalized Intro
- Their profile photo (from Instagram scrape)
- "Based on your profile, here's what I'd build for you, [Name]."
- Disclaimer banner: "This is a preview built from your public profile. All data is illustrative — your real analytics will be connected once we build your platform."

### Section 2 — Layer 1: Their Website
- Full creator template preview injected with:
  - Their name, photo, detected colors
  - AI-generated niche-specific copy for each section
  - Sections matching their step 4 selections (programs, codes, etc.)
  - Sections not selected are omitted
- Uses the existing creator template at `/Users/samotto/creator-template/` as the base

### Section 3 — Layer 2: Their Analytics
- Dashboard mockup (similar to Mandi's hub dashboard design)
- Numbers scaled to their real follower count:
  - Followers: their actual count
  - Views: 20-60% of follower count (realistic range)
  - Engagement: 3-8% (realistic range)
  - Revenue: scaled estimate based on follower tier
- Label: "Simulated data · Based on your public profile"

### Section 4 — Layer 3: Their AI Strategist
- AI-generated sample recommendation tailored to their niche
- Chat mockup showing a sample exchange:
  - User: "When should I post this week?"
  - AI: niche-specific recommendation with simulated data points
- Label: "Sample recommendation · Your real AI will use your actual data"

### Section 5 — Layer 4: Weekly Briefing
- Monday briefing email mockup with:
  - Their name as recipient
  - Simulated platform metrics scaled to their follower count
  - AI-generated action item for their niche
- Label: "Simulated · Your real briefings use your actual data"

### Section 6 — CTA (The Close)
- Two buttons side by side:
  - "Build mine" — primary CTA, links to booking/contact
  - "Book a call" — secondary, for people who need to talk first
- "This preview expires in 7 days" — soft urgency
- No pricing displayed anywhere

### Sharing & Email Gate
- Preview URL is shareable — works for anyone
- Original creator (identified by email cookie) sees the full preview
- Non-original visitors see a blurred/frosted preview with:
  - Enough visible to intrigue (name, general layout)
  - Email input overlay: "Enter your email to view this mockup"
  - On submit: email stored in `share_captures` table, blur removed, full preview shown
- Every shared view that captures an email is a new lead

## Technical Architecture

### Stack
- **Quiz UI:** Vanilla HTML/CSS/JS, built into portfolio site as a full-screen overlay
- **API:** Vercel serverless functions in `/api/`
- **Instagram scrape:** Public profile data (no auth required)
- **AI copy:** LLM API call for niche-specific section text and recommendations
- **Color extraction:** Server-side dominant color analysis from profile photo
- **Template engine:** Server-side HTML generation from creator template
- **Mockup storage:** Vercel Blob (generated HTML files)
- **Database:** Neon Postgres via Vercel Marketplace
- **Email:** Resend (already configured in portfolio project)
- **Preview serving:** Thin route that fetches from Blob + handles email gate

### API Endpoints

#### `POST /api/scrape-ig`
- Input: `{ handle: "mandibagley" }`
- Primary method: fetch `https://www.instagram.com/api/v1/users/web_profile_info/?username={handle}` with browser-like headers (User-Agent, etc.). This is Instagram's internal API used by the web app — no auth required for public profiles. Returns JSON with profile data.
- If primary fails: try scraping the profile page HTML for og:image, description meta tags, and embedded JSON-LD data.
- If both fail: return `{ success: false }` — quiz shows manual entry fallback.
- Extracts: profile photo URL, display name, follower count, bio text, account category
- Color extraction: download profile photo, use `sharp` (npm) to resize to 64x64 and extract dominant colors via k-means clustering (quantize to 5 colors). Sharp is already Vercel-compatible.
- Returns: `{ name, photo, followers, bio, category, colors: [{hex, rgb, weight}...], success: true }`

#### `POST /api/generate-mockup`
- Input: all quiz data `{ name, email, handle, followers, niche, sells: [...], colors: {...}, photo }`
- Calls LLM API to generate niche-specific copy for each section
- Injects all data into creator template HTML
- Generates analytics dashboard with scaled numbers
- Generates AI strategist sample recommendation
- Generates weekly briefing preview
- Saves complete mockup HTML to Vercel Blob
- Creates lead record in Neon database
- Sends email via Resend with preview link
- Returns: `{ previewUrl: "/preview/[hash]", hash }`

#### `GET /api/preview/[hash]`
- Looks up preview in database
- Checks if expired (7 days)
- If owner (email cookie match): serves full mockup from Blob
- If non-owner: serves blurred version with email gate overlay
- If expired: shows "This preview has expired" with CTA to build a new one

#### `POST /api/preview-unlock`
- Input: `{ hash, email }`
- Stores email in `share_captures` table
- Sets cookie identifying this viewer
- Returns success — client removes blur

#### `GET /api/cron/cleanup-previews`
- Runs daily via Vercel cron
- Finds all previews where `expires_at < now()`
- Deletes Blob files
- Marks DB records as expired (soft delete for analytics)

### Database Schema (Neon Postgres)

```sql
CREATE TABLE leads (
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

CREATE TABLE preview_views (
  id SERIAL PRIMARY KEY,
  preview_hash TEXT NOT NULL REFERENCES leads(preview_hash),
  viewer_email TEXT,
  is_owner BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE share_captures (
  id SERIAL PRIMARY KEY,
  preview_hash TEXT NOT NULL REFERENCES leads(preview_hash),
  email TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Vercel Configuration Additions

```json
{
  "crons": [
    { "path": "/api/cron/cleanup-previews", "schedule": "0 4 * * *" }
  ]
}
```

### Environment Variables (new)
- `DATABASE_URL` — Neon Postgres connection string (auto-provisioned via Marketplace)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob access (auto-provisioned)
- `ANTHROPIC_API_KEY` — Claude API key for copy generation (using Claude Sonnet for speed + quality balance)
- Existing: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`

## AI Copy Generation

Uses Claude Sonnet via Anthropic API (fast, good at marketing copy). The LLM receives:
- Creator name, niche, what they sell, follower count
- Instructions to generate:
  - Hero tagline and bio (2-3 sentences)
  - Section descriptions for each selected "sells" category
  - Sample AI strategist recommendation (specific to their niche + follower size)
  - Sample weekly briefing action items (2 items, niche-specific)

Copy tone: professional but warm, specific to their niche (not generic). A fitness creator's mockup should feel like a fitness site, not a template with "fitness" swapped in.

## Build Phases

1. **Quiz UI** — full-screen overlay, 6 steps, progress bar, animations
2. **Instagram scrape** — `/api/scrape-ig`, color extraction, profile card UI
3. **Database setup** — Neon via Marketplace, schema, connection
4. **AI copy generation** — LLM integration, prompt engineering, section copy
5. **Template injection** — server-side HTML generation from creator template with all data
6. **Preview page** — serving from Blob, blur gate for shares, email capture
7. **Email delivery** — Resend integration for mockup link
8. **Cinematic loading screen** — staged progress animation
9. **Cleanup cron** — daily expiration of old previews
10. **Polish** — transitions, error handling, mobile responsiveness, edge cases
