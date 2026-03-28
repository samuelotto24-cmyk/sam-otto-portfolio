# Portfolio Template

This is a single-file portfolio site template (`index.html`) with all CSS/JS inline. Built for showcasing custom web design services to a specific niche.

## Current niche: Creator/Influencer page builder
To adapt for a new niche, customize the sections below.

---

## What to change per client/niche

### 1. Branding (CSS variables in `:root`)
- `--rose` / `--rose-light` / `--rose-glow` — accent color (currently emerald `#10B981`)
- `--cream` — primary text highlight
- `--serif` / `--sans` — font families
- Update Google Fonts `<link>` to match

### 2. Copy (HTML text content)
- **Hero headline** — `h1.hero-title`
- **Hero subtitle** — `p.hero-sub`
- **Trust bar items** — `.hero-trust-item` spans
- **Compare section** — `.compare-title`, `.compare-sub`, verdict items
- **Impact cards** — `.impact-card` content (stats, names, descriptions)
- **Ownership row** — `.ownership-item` titles/body
- **Analytics section** — headline, sub, card titles (if you offer analytics)
- **Work section** — client name, description, tags in `.client-showcase`
- **"What I Build" section** — `.feat-title`, `.feat-big-quote`, all `.cap-cat` categories
- **Process cards** — step titles and descriptions
- **Contact section** — headline, sub, form fields, response note
- **Footer** — logo name, tagline, nav links

### 3. Intro animation
- `sloganLine1` / `sloganLine2` in the intro JS — currently "Sam Otto" / "Creator Pages"

### 4. Client showcase videos
- Replace files in `/assets/`:
  - `mandi-phone.mp4` → your client's mobile screen recording
  - `mandi-desktop.mp4` → your client's desktop screen recording
  - `gabe-phone.mp4` → second client phone recording
  - `gabe-desktop.mp4` → second client desktop recording
- Update the `<video>` `src` paths and `.hero-phone-badge` domain text

### 5. Compare section
- Update linktree mockup srcdoc in JS (search `linktree-mock`)
- Update or replace the "good pane" video/iframe

### 6. Contact form
- `api/contact.mjs` — Resend email delivery, env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`
- Update form fields if needed (currently: name, email, instagram, followers, message)

### 7. Nav
- Update `.nav-cta` text and nav links

### 8. Meta
- `<title>` and `<meta name="description">`
- OG images if needed

---

## Features included
- Particle constellation intro animation
- Orbiting rings hero background
- Canvas world map (analytics section)
- Side gutter ambient orbs (desktop ≥1260px)
- Cursor glow follow effect
- Scroll progress bar
- Fade-up scroll animations
- Featured client showcase card with shimmer + badge
- Real screen recording video embeds (phone + desktop)
- Before/after laptop comparison
- Responsive mobile layout (aggressive condensing)
- Contact form with Resend email API
- Scroll-to-top on every load (iOS Safari compatible)

---

## Deployment
Static HTML — deploy to Vercel, Netlify, or any static host. The `api/` directory contains a Vercel serverless function for the contact form.
