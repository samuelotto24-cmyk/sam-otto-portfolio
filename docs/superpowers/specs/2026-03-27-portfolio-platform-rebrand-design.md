# Portfolio Platform Rebrand — Design Spec

**Date:** 2026-03-27
**Goal:** Update Sam Otto's portfolio to reflect the full creator platform offering — not just custom pages, but the complete system (website + analytics + Hub + AI strategist). Reposition from "page builder" to "platform builder" while preserving all existing visual infrastructure.

---

## Guiding Principles

- **Emotions to hit:** "This person gets it" + "This is another level" + "I need this yesterday"
- **Preserve:** All animations (particle intro, orbiting rings, cursor glow, side orbs, scroll progress, shimmer effects), world map canvas, dark aesthetic, emerald accents, phone/desktop video assets
- **Change:** Copy, section order, section purposes, hero animation, and the narrative arc

---

## Section Flow (Top to Bottom)

### 1. Nav
- Logo tag: **"Creator Platforms, Built from Scratch"** (was "Creator Pages, Built to Convert")
- Links: keep Analytics + Live Work + "Work with Sam" CTA

### 2. Hero — Auto-Play Narrated Sequence

**Headline:**
> Your website. Your data.
> *Your AI strategist.*

**Sub:**
> Not a template. Not a link-in-bio. The entire platform behind your brand — custom-built, done for you, live in 72 hours.

**Trust bar:**
> Built for your brand · Private analytics · AI-powered strategy · Live in 72 hours · Done for you

**Visual — right side:**
Single phone mockup (Mandi's site) as center anchor, surrounded by three floating cards:
- Analytics card (sparkline + "842 views this week")
- Hub card ("Hey, Mandi" + stat preview)
- AI chat card ("Your best posting time is…")

**Animation — auto-play on page load (~6-8 seconds):**

| Time | Headline | Visual | Descriptive text |
|------|----------|--------|-----------------|
| 0s | — | Phone slides in from bottom | — |
| ~1s | "Your website." fades in | Phone fully visible | "Custom-built around your brand." |
| ~2.5s | "Your data." fades in | Analytics card floats up (sparkline draws) | "Every click, every visitor, every conversion." |
| ~4s | "Your AI strategist." fades in (emerald italic) | AI chat card appears (typing effect) | "Tells you what to post and what's making you money." |
| ~5.5s | Hub card fades in | Hub card floats in | — |
| ~6.5s | Sub text fades in | Everything settles into final positions | Trust bar appears |

After the sequence completes, the hero is a static layout with all elements visible. Scroll-triggered fade-ups take over from here.

**CTA buttons:** "Let's Build Yours" (primary) + "See live work" (ghost) — same as current.

### 3. Platform Breakdown — Scroll-Triggered Progressive Stack

**Label:** "THE PLATFORM"
**Headline:** "One platform. Three layers."

As the user scrolls, each layer builds visually on the previous one — stacking to create a complete visual representation:

| Scroll position | Layer | Visual | One-liner |
|----------------|-------|--------|-----------|
| Enter viewport | Website layer | Phone/browser mockup appears | "A website that looks like you." |
| Continue scroll | Analytics layer | Dashboard/chart UI slides in behind/above | "Analytics that actually make sense." |
| Continue scroll | AI layer | AI chat interface crowns the stack | "An AI that tells you what's working." |

Final state: all three layers visible as a unified stack. Uses existing fade-up animation system, extended with staggered transforms.

### 4. Compare — Evolved Side-by-Side

**Label:** "THE DIFFERENCE"
**Headline:** "Other tools give you pieces. I build the whole platform."
**Sub:** "Linktree gives you links. Google Analytics gives you numbers you never check. ChatGPT gives you generic advice. I give you one system that does all of it — designed around your brand, fed by your actual data, and smart enough to tell you what to do next."

**Visual — laptop frame (existing):**
- **Left pane (bad):** Chaotic collage of scattered tool tabs — a Linktree mockup, a Google Analytics screenshot, a notes app, maybe a ChatGPT window. Desaturated, filter applied (existing `.bad-pane` styling).
- **Right pane (good):** The Hub — one clean dark screen with "Hey, Mandi," stat cards, briefing preview. Full color, emerald glow (existing `.good-pane` styling).
- **Divider:** "VS" badge stays.
- **Pane labels:** "YOUR TOOLS NOW" vs. "YOUR PLATFORM"

**Verdict row:** Update from "Generic · Forgettable" vs. "Custom · Yours" to something like "Scattered · Manual" vs. "Unified · Intelligent"

### 5. Impact Cards

Same four-card layout with animated counters. Update copy to reference platform metrics:

| Card | Current | Updated |
|------|---------|---------|
| Offer & Program Views | +28% Program Engagement | No change — still relevant |
| Discount & Code Usage | +22% Code Redemption | No change — still relevant |
| Affiliate Link Clicks | +34% Affiliate Revenue | No change — still relevant |
| Cross-Platform Discovery | +19% Platform Click-Through | No change — still relevant |

These cards work as-is — the website layer drives these metrics. No copy changes needed.

### 6. Ownership Row

**No changes.** "Your domain. Your name." / "Your data stays yours." / "No platform watching." — all still apply and are even more relevant with the full platform positioning.

### 7. Analytics Section

**Label:** "BUILT-IN ANALYTICS"
**Headline:** "Your audience is global. Now you can *see* it." (keep)
**Sub:** Update from "Every site I build includes a private, password-protected analytics dashboard" to: "Every platform I build includes private, password-protected analytics. No third-party trackers. No shared data. Your numbers, visible only to you."

**Visual:** World map canvas stays. Dashboard browser mockup stays. Four benefit cards stay (password protected, know what converts, 30-day trends, live world map). Mobile stat strip stays.

Single word changes: "site" → "platform" where it appears.

### 8. Work Showcase — Full Platform Case Study

**Label:** "FEATURED CLIENT WORK"
**Section headline:** "One creator. One complete platform." (was "One creator. One custom page.")

**Primary showcase — Mandi Bagley (full platform client):**

Two-column layout within the work card:
- **Left column — "What her audience sees":** Phone mockup with existing screen recording of mandibagley.com. Label below: "mandibagley.com"
- **Right column — "What she sees":** Browser frame showing Mandi's Hub — "Hey, Mandi" greeting, stat cards, weekly briefing, AI chat visible. Label below: "Her private platform"

Desktop video: available via hover state or a "View desktop →" toggle link on the phone mockup.

**Tags:** Update from current set to include platform features:
- Custom Design · Affiliate Codes · Program Showcases · Private Analytics · AI Strategy · Weekly Briefings · Link Tracking

**Description:** Update to mention the full platform, not just the site.

**Secondary showcase — Gabe McKenney (website client):**
- Simpler card below Mandi's
- Phone mockup + desktop video, similar to current layout
- Positioned as proof of the website layer
- Tags reflect website-only features

### 9. What's Included — Package Breakdown

**Replaces the current "What I Build" capability grid.**

**Label:** "WHAT'S INCLUDED"
**Headline:** "Not a feature set. A platform for your business." (evolved from "Not a feature set. A page for your business.")
**Quote:** "I start with one question: what do you want your audience to do? Everything else — the page, the tracking, the intelligence — follows from that."

**Three package layers** (replaces the six-category pill grid):

**Layer 1 — Your Website**
- Your colors, fonts & aesthetic
- Your own domain
- A layout that feels unmistakably yours
- Photography & visual direction
- Auto-updating content feeds
- Smart link buttons & CTAs
- Program & course cards
- Tap-to-copy affiliate codes
- Client results & testimonials
- Brand partnership highlights

**Layer 2 — Your Analytics**
- Private password-protected dashboard
- 30-day pageview & visitor trends
- Link click tracking by platform
- Traffic sources & world map
- Scroll depth & session duration
- New vs. returning visitors
- Geographic data (country + city)
- Referrer-to-action conversions

**Layer 3 — Your AI Strategist**
- AI-generated weekly briefings
- Real-time strategy chat
- "When should I post?" answers from your data
- "What should I promote?" based on conversions
- Platform performance recommendations
- Content strategy insights
- Streaming responses, not canned advice

**Design:** Each layer is a card or expandable section with the emerald accent for the layer title and subtle borders. Same dark card aesthetic as current `.cap-cat` styling. The current "Speed" category content ("Live in 72 hours," "Same-day updates," "Direct line to me") moves to the Process section or the contact section sub-copy.

### 10. Process — Updated Copy

Same three-card layout with step numbers (01, 02, 03) and arrow dividers.

| Step | Current | Updated |
|------|---------|---------|
| 01 — Tell me about your brand | "Your audience, your business model, what you want people to do. A quick conversation is all it takes." | "Your audience, your business model, what you want people to do. A quick conversation is all I need to map out your platform." |
| 02 — I design and build | "No templates. Built from scratch — your colors, your structure, your conversion flow. Live within 72 hours." | "No templates. Your website, your analytics, your AI strategist — designed and built from scratch. Live within 72 hours." |
| 03 — You launch. I stay on it. | "Your page goes live on your domain. Updates, new features, refinements — just message me." | "Your platform goes live on your domain. Weekly briefings, new features, strategy updates — just message me." |

### 11. Contact

**Label:** "GET STARTED"
**Headline:** "Send me your handle. I'll map out *your build.*"
**Sub:** "No commitment, no brief to fill out. Tell me who you are and what you're building — I'll respond same day with a breakdown of what your platform would look like, what's included, and how it all works together."

**Form:** Same fields (name, email, Instagram/TikTok handle, follower count, message).
**Message placeholder:** Update from "What do you sell, promote, or want your audience to do? What's not working about your current page?" to: "What do you sell, promote, or want your audience to do? What tools are you currently using?"
**Submit CTA + note:** Same — "Send it" + "Takes two minutes. I respond same day."

### 12. Footer
- Logo tagline: **"Creator platforms, built from scratch."** (was "Creator pages, built from scratch.")
- Links: Home, Work, Analytics, Process, Contact (same)
- CTA: "Work with Sam →" (same)

---

## New Assets Needed

1. **Hub screenshot/recording** — Mandi's Hub at `/hub` for the work showcase right column and the compare section right pane
2. **Scattered tools mockup** — Collage of Linktree + Google Analytics + ChatGPT tabs for the compare section left pane (can be built as an HTML/CSS mockup within the iframe, similar to existing Linktree mock)
3. **Floating hero cards** — Three small UI cards (analytics sparkline, Hub greeting, AI chat bubble) for the hero right side. Built as styled divs with animation.
4. **Platform stack visuals** — Three-layer progressive visual for the platform breakdown section. Can reuse existing phone mockup + new dashboard and AI chat styled divs.

---

## What Does NOT Change

- Particle constellation intro animation
- Orbiting rings hero background canvas
- World map canvas (analytics section)
- Side gutter ambient orbs (desktop ≥1260px)
- Cursor glow follow effect
- Scroll progress bar
- Fade-up scroll animation system
- Phone shell mockup design and dimensions
- Laptop frame design
- Color palette (--black, --dark, --dark-card, --rose/emerald, --text hierarchy)
- Font stack (Cormorant Garamond + DM Sans)
- Responsive breakpoints and mobile layout system
- Contact form functionality (Resend API)
- All CSS variables and design tokens
