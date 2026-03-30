# Portfolio Template

Single-file portfolio site template (`index.html`) with all CSS/JS inline. Built for showcasing done-for-you service businesses to a specific niche.

## Current niche: Creator/Influencer platform builder
To adapt for a new niche, customize the sections listed below.

---

## Page structure (top to bottom)

1. **Hero** — headline, subtitle, CTA buttons (contact + "Build My Demo")
2. **Four Layer Cards** — each with a video/visual + copy (website, analytics, AI strategist, weekly briefing)
3. **AI Spotlight** — chat mockup showing AI capabilities
4. **Creator Tool Stack** — 15-tool grid with prices, count-up total, closing line
5. **Growth Interrupt** — one-liner transition statement
6. **How It Works** — 3-step process (talk → build → maintain) + ongoing callout
7. **Analytics Showcase** — full dashboard browser mockup with canvas world map
8. **Client Cards** — live client work with videos, domain badges, descriptions
9. **Weekly Recap** — paper airplane animation → Monday briefing card
10. **Pain Ticker** — scrolling pain-point marquee
11. **Contact Form** — form with trust signals + Resend email API
12. **Footer** — logo, tagline, nav links

---

## What to change per niche

### 1. Branding (CSS variables in `:root`)
- `--rose` / `--rose-light` / `--rose-glow` — accent color (currently emerald `#10B981`)
- `--cream` — primary text highlight
- `--serif` / `--sans` — font families
- Update Google Fonts `<link>` to match

### 2. Hero copy
- `h1.hero-title` — currently "You built the audience. I build the platform behind it."
- `p.hero-sub` — currently describes custom website + analytics + AI strategist
- `.hero-label` — currently "Your growth machine"
- CTA buttons in `.hero-actions`

### 3. Four Layer Cards
Each card in `.layers-stack` has:
- `.layer-num` — "01", "02", etc.
- `.layer-name` — section title
- `.layer-desc` — one-line description
- A video `<source>` — replace with your own screen recordings
- The 4th card uses `.layer-email-preview` instead of a video

Update all copy and video sources. If your niche doesn't have 4 layers, remove cards.

### 4. AI Spotlight
- `.ai-spotlight-title` — currently "Not ChatGPT. An AI that knows your numbers."
- `.ai-spotlight-sub` — capabilities description
- `.ai-caps` — four capability bullet items
- `.ai-chat-mockup` — sample chat messages (update to match your niche)

### 5. Tool Stack
- The tool list is in a `<script>` block — search for `var tools = [`
- Update tool names, emoji icons, and prices for your niche
- Update the total ($1,146) and yearly ($13,752) in the count-up JS
- Update the closing lines ("The problem isn't your content...")

### 6. Growth Interrupt
- `.growth-interrupt-headline` — currently "You create the content. I build the system behind it."
- `.growth-interrupt-sub` — supporting line

### 7. How It Works
- Three step cards with emoji icons + titles + descriptions
- The callout box below: "This isn't a one-time build..."
- Update all copy to match your service process

### 8. Analytics Showcase
- `.analytics-title` — currently "YouTube. Instagram. TikTok. All in one dashboard."
- `.analytics-sub` — description
- `.analytics-cards` — four platform cards (YouTube, IG, TikTok, Website)
- Dashboard mockup (`.dash-browser`) — update stats, chart, content list
- Add a label identifying whose dashboard it is

### 9. Client Cards
- `.work-compact-card` blocks — one per client
- Each has: video thumb, name, niche, domain, description
- Replace videos in `/assets/` with your client recordings
- Update names, niches, domains

### 10. Weekly Recap (Paper Airplane Animation)
- The animation is automatic (IntersectionObserver)
- Update the briefing card content: `.rc-badge`, `.rc-date`, platform stats, action items
- Update the `.recap-copy` heading and bullet points

### 11. Pain Ticker
- `.pain-ticker-item` spans — update pain points for your niche
- Duplicate set exists for seamless loop — update both

### 12. Contact Form
- `.contact-title` — headline
- `.contact-sub` — description
- Form fields (name, email, handle, followers, message)
- Trust signals below submit button
- `api/contact.mjs` — Resend email API, env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`

### 13. Quiz / Demo Generator
- The "Build My Demo" quiz overlay lives at the bottom of the HTML
- Step 0 (intro screen) — update the four items to match your service
- The quiz calls `/api/scrape-ig` (Instagram scraper) and `/api/generate-copy` (AI copy)
- `/api/generate-mockup` builds a preview from the creator template
- Update the AI prompt in `api/generate-copy.mjs` for your niche
- Requires env vars: `APIFY_API_TOKEN`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`

### 14. Intro Animation
- `sloganLine1` / `sloganLine2` in the scatter animation JS
- Currently "Sam Otto" / "Creator Pages"

### 15. Nav
- Links in `.nav-links` — currently: Platform, Compare, Analytics, Live Work, Briefing, Build My Demo
- `.nav-cta` text — currently "Work with Sam"
- `.nav-logo-tag` — currently "Creator Platforms, Built from Scratch"

### 16. Footer
- `.footer-logo` — name
- `.footer-tagline` — currently "Your brand doesn't fit a template. Your platform shouldn't either."
- Footer nav links

### 17. Meta
- `<title>` and `<meta name="description">`
- OG tags if needed

---

## API endpoints

| Endpoint | Purpose | Env vars needed |
|----------|---------|----------------|
| `api/contact.mjs` | Contact form email via Resend | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` |
| `api/scrape-ig.mjs` | Instagram profile scraper via Apify | `APIFY_API_TOKEN` |
| `api/generate-copy.mjs` | AI copy generation via Anthropic | `ANTHROPIC_API_KEY` |
| `api/generate-mockup.mjs` | Mockup HTML builder + Blob storage | `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL` |
| `api/preview/[hash].mjs` | Serve mockup preview with email gate | `DATABASE_URL` |
| `api/preview-unlock.mjs` | Email gate unlock for shared previews | `DATABASE_URL`, `RESEND_API_KEY` |
| `api/proxy-image.mjs` | Proxy Instagram images (CORS bypass) | none |
| `api/cron/cleanup-previews.mjs` | Daily cleanup of expired previews | `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` |

---

## Database (Neon Postgres)

Schema in `scripts/init-db.sql`. Three tables:
- `leads` — quiz submissions with name, email, handle, niche, colors, preview hash
- `preview_views` — tracks who viewed each preview
- `share_captures` — emails captured from shared preview links

---

## Features included
- Particle constellation intro animation with scatter-to-unified hero
- Canvas world map (analytics section)
- Side gutter ambient orbs (desktop ≥1260px)
- Scroll progress bar
- Fade-up scroll animations (IntersectionObserver)
- Paper airplane → origami unfold animation (weekly recap)
- Tool stack card grid with staggered entrance + price badge pop + count-up total
- Layer cards with staggered reveal
- Quiz overlay with 7 steps (intro, name, IG handle, niche, offerings, colors, email)
- Instagram scraper with Apify + color extraction via sharp
- AI copy generation via Anthropic Claude
- Mockup generator using creator template + Vercel Blob storage
- Inline preview panel with browser frame, photo grid, layer cards
- Email-gated sharing for preview URLs
- Mobile-only aggressive condensing
- Responsive at 375px, 768px, 1440px
- Contact form with Resend email API + trust signals

---

## Deployment
Static HTML + Vercel serverless functions. Deploy to Vercel with GitHub integration.

```json
// vercel.json
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

Required env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `APIFY_API_TOKEN`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`
