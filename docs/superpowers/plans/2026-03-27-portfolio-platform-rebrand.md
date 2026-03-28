# Portfolio Platform Rebrand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand Sam Otto's portfolio from "custom creator pages" to "complete creator platforms" — new hero animation, reorganized sections, updated copy, and full platform showcase.

**Architecture:** Single `index.html` file with all CSS and JS inline. All changes are to this one file plus one new screenshot asset. Existing visual infrastructure (particle intro, orbiting rings, world map, cursor glow, all animations) is preserved. Changes are: copy updates, section reordering, new HTML sections, new CSS, and new JS for the hero auto-play animation.

**Tech Stack:** HTML, CSS (vanilla, CSS variables), JavaScript (vanilla, no frameworks), existing animation systems (canvas, IntersectionObserver, requestAnimationFrame).

**Spec:** `docs/superpowers/specs/2026-03-27-portfolio-platform-rebrand-design.md`

---

## File Map

All changes are to a single file:
- **Modify:** `index.html` (all CSS, HTML, and JS inline)

New assets:
- **Create:** `assets/hub-screenshot.png` — screenshot of Mandi's Hub page (captured from localhost or live)

---

## Task 1: Capture Hub Screenshot Asset

Before any code changes, capture the Hub screenshot we'll need for the compare section and work showcase.

**Files:**
- Create: `assets/hub-screenshot.png`

- [ ] **Step 1: Capture Mandi's Hub as a screenshot**

If the Hub is running locally, use agent-browser:
```bash
npx agent-browser open http://localhost:59580/
npx agent-browser wait --load networkidle
npx agent-browser wait 2000
npx agent-browser screenshot --full /Users/samotto/portfolio-template/assets/hub-screenshot.png
npx agent-browser close
```

If not running locally, serve it first or take a screenshot from the live deploy. The screenshot should capture the full Hub: "Hey, Mandi" greeting, stat cards, weekly briefing, and AI chat section.

- [ ] **Step 2: Verify the file exists**

```bash
ls -la assets/hub-screenshot.png
```

Expected: file exists, reasonable size (100KB+).

- [ ] **Step 3: Commit**

```bash
git add assets/hub-screenshot.png
git commit -m "asset: add Hub screenshot for portfolio rebrand"
```

---

## Task 2: Nav + Footer Copy Updates

Smallest, safest change. Updates the tagline everywhere.

**Files:**
- Modify: `index.html:2249` (nav logo tag)
- Modify: `index.html:2890` (footer tagline)
- Modify: `index.html:2923` (intro animation sloganLine2)

- [ ] **Step 1: Update nav logo tag**

Change line 2249:
```html
<!-- OLD -->
<span class="nav-logo-tag">Creator Pages, Built to Convert</span>

<!-- NEW -->
<span class="nav-logo-tag">Creator Platforms, Built from Scratch</span>
```

- [ ] **Step 2: Update footer tagline**

Change line 2890:
```html
<!-- OLD -->
<span class="footer-tagline">Creator pages, built from scratch.</span>

<!-- NEW -->
<span class="footer-tagline">Creator platforms, built from scratch.</span>
```

- [ ] **Step 3: Update intro animation slogan**

Change line 2923:
```javascript
// OLD
var sloganLine2 = 'Creator Pages';

// NEW
var sloganLine2 = 'Creator Platforms';
```

- [ ] **Step 4: Test in browser**

Open `index.html` locally. Verify:
- Nav shows "Creator Platforms, Built from Scratch"
- Footer shows "Creator platforms, built from scratch."
- Particle intro animation forms "Creator Platforms" text

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "copy: update nav, footer, and intro to 'Creator Platforms'"
```

---

## Task 3: Hero Section — New Copy + Structure

Replace the hero headline, sub, trust bar, and visual structure. This task handles the static HTML/CSS. The auto-play animation JS comes in Task 4.

**Files:**
- Modify: `index.html` — hero HTML (lines ~2258-2322) and hero CSS (lines ~153-340)

- [ ] **Step 1: Replace hero left column HTML**

Replace the hero left content (the `fade-up` div containing h1, p, actions, trust bar). The `fade-up` class is removed because the auto-play animation (Task 4) will handle reveal timing instead.

```html
<!-- HERO -->
<section id="hero">
  <div class="hero-bg"></div>
  <canvas id="hero-orbits" aria-hidden="true"></canvas>
  <div class="inner hero-inner">

    <div class="hero-left" id="hero-narration">
      <!-- Narration lines — hidden initially, revealed by auto-play JS -->
      <div class="hero-line hero-line-1" style="opacity:0; transform:translateY(16px)">
        <h1 class="hero-title-word">Your website.</h1>
        <p class="hero-desc">Custom-built around your brand.</p>
      </div>
      <div class="hero-line hero-line-2" style="opacity:0; transform:translateY(16px)">
        <h1 class="hero-title-word">Your data.</h1>
        <p class="hero-desc">Every click, every visitor, every conversion.</p>
      </div>
      <div class="hero-line hero-line-3" style="opacity:0; transform:translateY(16px)">
        <h1 class="hero-title-word hero-title-accent">Your AI strategist.</h1>
        <p class="hero-desc">Tells you what to post and what's making you money.</p>
      </div>

      <div class="hero-final" style="opacity:0; transform:translateY(16px)">
        <p class="hero-sub">Not a template. Not a link-in-bio. The entire platform behind your brand — custom-built, done for you, live in 72 hours.</p>
        <div class="hero-actions">
          <a href="#contact" class="btn-rose btn-hero-cta"><span class="btn-rose-outline" aria-hidden="true"></span><i class="fa-solid fa-paper-plane"></i> Let's Build Yours</a>
          <a href="#work" class="btn-ghost">See live work <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="hero-trust">
          <span class="hero-trust-item">Built for your brand</span>
          <span class="trust-sep"></span>
          <span class="hero-trust-item">Private analytics</span>
          <span class="trust-sep"></span>
          <span class="hero-trust-item">AI-powered strategy</span>
          <span class="trust-sep"></span>
          <span class="hero-trust-item">Live in 72 hours</span>
          <span class="trust-sep"></span>
          <span class="hero-trust-item">Done for you</span>
        </div>
      </div>
    </div>

    <div class="hero-preview" id="hero-visuals">
      <!-- Phone mockup — Mandi's site (single phone, centered) -->
      <div class="hero-phone-solo" style="opacity:0; transform:translateY(40px)">
        <div class="hero-phone-shell">
          <div class="hero-phone-notch"></div>
          <div class="hero-phone-screen">
            <video class="hero-phone-iframe" autoplay muted loop playsinline>
              <source src="assets/mandi-phone.mp4" type="video/mp4">
            </video>
          </div>
        </div>
      </div>

      <!-- Floating platform cards — hidden initially -->
      <div class="hero-float-card hero-card-analytics" style="opacity:0; transform:translate(-20px, 20px)">
        <div class="hfc-icon">📊</div>
        <div class="hfc-body">
          <div class="hfc-title">842 views this week</div>
          <div class="hfc-sparkline">
            <svg viewBox="0 0 80 24" fill="none" style="width:80px;height:24px">
              <polyline points="0,20 12,16 24,18 36,10 48,12 60,6 72,8 80,4" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="hero-float-card hero-card-hub" style="opacity:0; transform:translate(20px, 20px)">
        <div class="hfc-icon">👋</div>
        <div class="hfc-body">
          <div class="hfc-title">Hey, Mandi</div>
          <div class="hfc-sub">Your page is performing well</div>
        </div>
      </div>

      <div class="hero-float-card hero-card-ai" style="opacity:0; transform:translate(20px, -20px)">
        <div class="hfc-icon">🤖</div>
        <div class="hfc-body">
          <div class="hfc-title">Your best posting time is…</div>
          <div class="hfc-typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>

  </div>
</section>
```

- [ ] **Step 2: Add new hero CSS**

Add these styles to the `<style>` section. Keep all existing hero CSS that applies to shared elements (`.hero-bg`, `#hero-orbits`, `.btn-rose`, `.btn-ghost`, `.hero-trust`, etc.). Add new rules:

```css
/* ── HERO NARRATION ── */
.hero-left { max-width: 520px; }
.hero-line { margin-bottom: 8px; transition: opacity 0.6s ease, transform 0.6s ease; }
.hero-title-word {
  font-family: var(--serif);
  font-size: clamp(40px, 5vw, 68px);
  font-weight: 500;
  line-height: 1.1;
  color: var(--text);
  margin: 0;
}
.hero-title-accent { color: var(--rose); font-style: italic; }
.hero-desc {
  font-size: 15px;
  color: var(--text-sub);
  margin: 4px 0 16px;
  line-height: 1.5;
}
.hero-final { transition: opacity 0.6s ease, transform 0.6s ease; }

/* ── HERO PHONE (single, centered) ── */
.hero-phone-solo { transition: opacity 0.8s ease, transform 0.8s ease; }

/* ── HERO FLOATING CARDS ── */
.hero-float-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(20, 20, 16, 0.95);
  border: 1px solid rgba(255, 248, 220, 0.12);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: none;
  z-index: 10;
}
.hfc-icon { font-size: 20px; flex-shrink: 0; }
.hfc-title { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; }
.hfc-sub { font-size: 11px; color: var(--rose); margin-top: 2px; }
.hfc-sparkline { margin-top: 4px; }

/* Card positions */
.hero-card-analytics { top: 15%; left: -10px; transform: translate(-20px, 20px); }
.hero-card-hub { top: 55%; right: -10px; transform: translate(20px, 20px); }
.hero-card-ai { bottom: 15%; left: -10px; transform: translate(20px, -20px); }

/* Typing dots animation */
.hfc-typing { display: flex; gap: 4px; margin-top: 4px; }
.hfc-typing span {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--rose); opacity: 0.4;
  animation: typingDot 1.2s ease-in-out infinite;
}
.hfc-typing span:nth-child(2) { animation-delay: 0.2s; }
.hfc-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingDot {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
}

/* Settled state — floating animation after auto-play completes */
.hero-float-card.settled { pointer-events: auto; }
.hero-card-analytics.settled { animation: floatL 3.5s ease-in-out infinite; }
.hero-card-hub.settled { animation: floatR 3.5s ease-in-out infinite; animation-delay: 0.5s; }
.hero-card-ai.settled { animation: floatL 3.5s ease-in-out infinite; animation-delay: 1s; }
@keyframes floatL {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0, -6px); }
}
@keyframes floatR {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0, -6px); }
}

/* Mobile: stack phone above cards, cards as horizontal strip below */
@media (max-width: 768px) {
  .hero-inner { grid-template-columns: 1fr; text-align: center; }
  .hero-left { max-width: 100%; }
  .hero-preview { position: relative; min-height: 360px; display: flex; align-items: center; justify-content: center; }
  .hero-card-analytics { top: auto; bottom: -10px; left: 50%; transform: translateX(-50%) translateY(20px); }
  .hero-card-hub { top: 10px; right: 10px; }
  .hero-card-ai { bottom: auto; top: 10px; left: 10px; }
  .hero-desc { margin-left: auto; margin-right: auto; }
}
```

- [ ] **Step 3: Remove old hero phone pair HTML**

Delete the old two-phone hero preview (the `.hero-phones` div with both Mandi and Gabe phone mockups) and the four callout badges (`.callout.c1` through `.c4`). These are replaced by the new single phone + floating cards structure above.

- [ ] **Step 4: Test in browser**

Open in browser. At this point the hero should show the new structure but without animation (everything hidden via inline `opacity:0`). Verify the HTML is valid and CSS loads correctly. The auto-play JS in Task 4 will make elements appear.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: new hero section structure — narrated headline + floating platform cards"
```

---

## Task 4: Hero Auto-Play Animation JS

Add the JavaScript that choreographs the hero sequence on page load.

**Files:**
- Modify: `index.html` — add JS at the end of the `<script>` section (after existing animations)

- [ ] **Step 1: Add the auto-play animation function**

Add this inside the main `<script>` tag, after the intro overlay animation code (after the intro overlay fade-out completes):

```javascript
// ── Hero auto-play narrated sequence ──
(function() {
  // Wait for intro animation to finish (it takes ~3.5s)
  var introDelay = document.getElementById('intro-overlay') ? 4000 : 500;

  function reveal(el) {
    if (!el) return;
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    el.style.opacity = '1';
    el.style.transform = 'translate(0, 0)';
  }

  function settle(el) {
    if (!el) return;
    el.classList.add('settled');
  }

  setTimeout(function() {
    var phone = document.querySelector('.hero-phone-solo');
    var line1 = document.querySelector('.hero-line-1');
    var line2 = document.querySelector('.hero-line-2');
    var line3 = document.querySelector('.hero-line-3');
    var final = document.querySelector('.hero-final');
    var cardAnalytics = document.querySelector('.hero-card-analytics');
    var cardHub = document.querySelector('.hero-card-hub');
    var cardAi = document.querySelector('.hero-card-ai');

    // 0s — Phone slides in
    reveal(phone);

    // 1s — "Your website."
    setTimeout(function() { reveal(line1); }, 1000);

    // 2.5s — "Your data." + analytics card
    setTimeout(function() {
      reveal(line2);
      reveal(cardAnalytics);
    }, 2500);

    // 4s — "Your AI strategist." + AI card
    setTimeout(function() {
      reveal(line3);
      reveal(cardAi);
    }, 4000);

    // 5.5s — Hub card
    setTimeout(function() {
      reveal(cardHub);
    }, 5500);

    // 6.5s — Sub + CTAs + trust bar, cards start floating
    setTimeout(function() {
      reveal(final);
      settle(cardAnalytics);
      settle(cardHub);
      settle(cardAi);
    }, 6500);

  }, introDelay);
})();
```

- [ ] **Step 2: Test in browser**

Full page load test. Verify:
- Intro particle animation plays as before
- After intro fades, hero sequence begins
- Phone appears first, then each headline word with its descriptive text
- Floating cards appear in sync with their respective headline words
- After sequence completes, cards begin gentle floating animation
- Sub text, CTAs, and trust bar appear last

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: hero auto-play narrated animation sequence"
```

---

## Task 5: Platform Breakdown Section (New)

Add the new "One platform. Three layers." section between hero and compare.

**Files:**
- Modify: `index.html` — insert new section HTML after `</section>` of hero, add CSS

- [ ] **Step 1: Add section HTML**

Insert this after the hero `</section>` closing tag and before `<!-- COMPARE -->`:

```html
<!-- PLATFORM BREAKDOWN -->
<section id="platform">
  <div class="inner">
    <div class="fade-up">
      <span class="platform-label">The Platform</span>
      <h2 class="platform-title">One platform. <em>Three layers.</em></h2>
    </div>

    <div class="platform-stack">
      <div class="platform-layer platform-layer-1 fade-up">
        <div class="pl-visual">
          <div class="pl-phone-mini">
            <div class="pl-phone-shell">
              <div class="pl-phone-notch"></div>
              <div class="pl-phone-screen" style="background:linear-gradient(135deg, #1a0f0b 0%, #2d1810 100%); display:flex; align-items:center; justify-content:center;">
                <span style="font-family:var(--serif); font-size:14px; color:rgba(255,255,255,0.5);">mandibagley.com</span>
              </div>
            </div>
          </div>
        </div>
        <div class="pl-copy">
          <h3 class="pl-name">Your Website</h3>
          <p class="pl-desc">A website that looks like you.</p>
        </div>
      </div>

      <div class="platform-layer platform-layer-2 fade-up">
        <div class="pl-visual">
          <div class="pl-browser-mini">
            <div class="pl-browser-chrome">
              <span class="pl-dot" style="background:#ff5f57"></span>
              <span class="pl-dot" style="background:#febc2e"></span>
              <span class="pl-dot" style="background:#28c840"></span>
            </div>
            <div class="pl-browser-body" style="padding:10px;">
              <div style="display:flex; gap:6px; margin-bottom:6px;">
                <div style="flex:1; background:rgba(16,185,129,0.15); border-radius:6px; padding:6px; text-align:center;">
                  <div style="font-size:14px; font-weight:700; color:#10B981;">842</div>
                  <div style="font-size:8px; color:rgba(255,255,255,0.4);">views</div>
                </div>
                <div style="flex:1; background:rgba(255,255,255,0.04); border-radius:6px; padding:6px; text-align:center;">
                  <div style="font-size:14px; font-weight:700; color:var(--text);">187</div>
                  <div style="font-size:8px; color:rgba(255,255,255,0.4);">this week</div>
                </div>
              </div>
              <svg viewBox="0 0 120 30" style="width:100%;height:30px;" fill="none">
                <polyline points="0,25 15,20 30,22 45,14 60,16 75,8 90,12 105,6 120,4" stroke="#10B981" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="pl-copy">
          <h3 class="pl-name">Your Analytics</h3>
          <p class="pl-desc">Analytics that actually make sense.</p>
        </div>
      </div>

      <div class="platform-layer platform-layer-3 fade-up">
        <div class="pl-visual">
          <div class="pl-chat-mini">
            <div class="pl-chat-msg pl-chat-user">When should I post this week?</div>
            <div class="pl-chat-msg pl-chat-ai">Based on your traffic data, your audience is most active at <span style="color:#10B981; font-weight:600;">2pm</span> and <span style="color:#10B981; font-weight:600;">8pm EST</span>…</div>
          </div>
        </div>
        <div class="pl-copy">
          <h3 class="pl-name">Your AI Strategist</h3>
          <p class="pl-desc">An AI that tells you what's working.</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add platform section CSS**

```css
/* ── PLATFORM BREAKDOWN ── */
#platform { padding: clamp(48px, 6vw, 80px) 0; }
.platform-label {
  display: block; font-size: 11px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--rose); margin-bottom: 16px;
}
.platform-title {
  font-family: var(--serif);
  font-size: clamp(32px, 4.5vw, 56px);
  font-weight: 500; line-height: 1.1; margin-bottom: 48px;
}
.platform-title em { color: var(--rose); font-style: italic; }
.platform-stack {
  display: flex; flex-direction: column; gap: 32px;
  position: relative;
}
.platform-layer {
  display: flex; align-items: center; gap: 32px;
  background: var(--dark-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px 32px;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.platform-layer:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
}
.pl-visual { flex-shrink: 0; width: 160px; }

/* Mini phone */
.pl-phone-mini { width: 80px; margin: 0 auto; }
.pl-phone-shell {
  background: #1c1916; border-radius: 16px;
  border: 1px solid rgba(255,248,220,0.1);
  padding: 6px 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.pl-phone-notch {
  width: 28px; height: 4px; background: #0d0c0a;
  border-radius: 50px; margin: 0 auto 4px;
}
.pl-phone-screen { border-radius: 12px; overflow: hidden; height: 110px; background: #000; }

/* Mini browser */
.pl-browser-mini {
  background: var(--dark); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.pl-browser-chrome {
  display: flex; gap: 4px; padding: 6px 8px;
  background: var(--surface-hi); border-bottom: 1px solid var(--border);
}
.pl-dot { width: 6px; height: 6px; border-radius: 50%; }
.pl-browser-body { background: var(--dark-card); min-height: 70px; }

/* Mini chat */
.pl-chat-mini {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px; background: var(--dark);
  border: 1px solid var(--border); border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.pl-chat-msg {
  font-size: 10px; line-height: 1.4; padding: 6px 10px;
  border-radius: 10px; max-width: 90%;
}
.pl-chat-user {
  background: rgba(255,255,255,0.06); color: var(--text-sub);
  align-self: flex-end; border-bottom-right-radius: 3px;
}
.pl-chat-ai {
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15);
  color: var(--text); border-bottom-left-radius: 3px;
}

.pl-copy { flex: 1; }
.pl-name {
  font-family: var(--serif); font-size: 26px; font-weight: 500;
  color: var(--text); margin-bottom: 6px;
}
.pl-desc { font-size: 15px; color: var(--text-sub); }

@media (max-width: 600px) {
  .platform-layer { flex-direction: column; text-align: center; padding: 20px; }
  .pl-visual { width: 120px; }
}
```

- [ ] **Step 3: Test in browser**

Verify the three layers appear stacked with mini visuals. Each should fade up on scroll (using the existing `fade-up` IntersectionObserver). Check mobile layout stacks vertically.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add platform breakdown section — 'One platform. Three layers.'"
```

---

## Task 6: Compare Section — Updated Copy + Visuals

Update the existing compare section with platform-focused copy and change the laptop panes.

**Files:**
- Modify: `index.html` — compare section HTML (lines ~2325-2390)

- [ ] **Step 1: Update compare headline and sub**

```html
<!-- OLD -->
<span class="compare-label">The Difference</span>
<h2 class="compare-title">Other templates give you pieces.<br>I build the whole page.</h2>
<p class="compare-sub">Linktree, Beacons, Stan — they give you blocks to fill in. Every page ends up looking like every other page. Yours should look, feel, and convert like it was built specifically for you. Because it was.</p>

<!-- NEW -->
<span class="compare-label">The Difference</span>
<h2 class="compare-title">Other tools give you pieces.<br>I build the whole platform.</h2>
<p class="compare-sub">Linktree gives you links. Google Analytics gives you numbers you never check. ChatGPT gives you generic advice. I give you one system that does all of it — designed around your brand, fed by your actual data, and smart enough to tell you what to do next.</p>
```

- [ ] **Step 2: Update laptop URL bar**

```html
<!-- OLD -->
<span class="url-bad">linktr.ee/fitnessinfluencer</span>
<span class="url-sep">vs</span>
<span class="url-good">coachgabemckenney.com</span>

<!-- NEW -->
<span class="url-bad">your scattered tools</span>
<span class="url-sep">vs</span>
<span class="url-good">your platform</span>
```

- [ ] **Step 3: Update left pane (bad) — scattered tools mockup**

Replace the Linktree iframe in the `.bad-pane` with an HTML mockup of scattered tabs. Replace the `<iframe id="linktree-mock" ...>` with:

```html
<div class="scattered-tools-mock">
  <div class="stm-tab stm-tab-1">
    <div class="stm-tab-bar">linktr.ee/you</div>
    <div class="stm-tab-body">
      <div class="stm-link"></div><div class="stm-link"></div><div class="stm-link"></div>
      <div class="stm-link"></div><div class="stm-link"></div>
    </div>
  </div>
  <div class="stm-tab stm-tab-2">
    <div class="stm-tab-bar">analytics.google.com</div>
    <div class="stm-tab-body">
      <div class="stm-chart"></div>
      <div style="display:flex;gap:4px;margin-top:6px;">
        <div class="stm-stat"></div><div class="stm-stat"></div><div class="stm-stat"></div>
      </div>
    </div>
  </div>
  <div class="stm-tab stm-tab-3">
    <div class="stm-tab-bar">chatgpt.com</div>
    <div class="stm-tab-body">
      <div class="stm-msg"></div><div class="stm-msg stm-msg-short"></div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Update right pane (good) — Hub mockup**

Replace the Gabe desktop video in the `.good-pane` with a Hub screenshot:

```html
<!-- OLD -->
<video class="compare-gabe-video" autoplay muted loop playsinline>
  <source src="assets/gabe-desktop.mp4" type="video/mp4">
</video>
<div class="pane-label">Built by Sam Otto</div>

<!-- NEW -->
<img src="assets/hub-screenshot.png" alt="Creator Hub — private platform" style="width:760px; height:960px; object-fit:cover; object-position:top; transform:scale(0.592); transform-origin:top left;">
<div class="pane-label">Your Platform</div>
```

- [ ] **Step 5: Update pane labels**

```html
<!-- OLD bad pane label -->
<div class="pane-label">Generic Template</div>
<!-- NEW -->
<div class="pane-label">Your Tools Now</div>
```

- [ ] **Step 6: Update verdict row**

```html
<!-- OLD -->
<div class="verdict-item verdict-bad">Built for everyone.</div>
<div class="verdict-item verdict-good">Built for you.</div>

<!-- NEW -->
<div class="verdict-item verdict-bad">Scattered · Manual</div>
<div class="verdict-item verdict-good">Unified · Intelligent</div>
```

- [ ] **Step 7: Update mobile comparison cards**

```html
<!-- OLD -->
<div class="ccm-card ccm-bad">
  <div class="ccm-label">Generic Template</div>
  <ul class="ccm-list">
    <li>Looks like everyone else</li>
    <li>No real data or analytics</li>
    <li>Platform owns your traffic</li>
  </ul>
</div>
<div class="ccm-card ccm-good">
  <div class="ccm-label">Built by Sam Otto</div>
  <ul class="ccm-list">
    <li>Your brand, your domain</li>
    <li>Built-in analytics dashboard</li>
    <li>Designed to convert</li>
  </ul>
</div>

<!-- NEW -->
<div class="ccm-card ccm-bad">
  <div class="ccm-label">Your Tools Now</div>
  <ul class="ccm-list">
    <li>Linktree for links, GA for numbers, ChatGPT for advice</li>
    <li>Nothing talks to anything else</li>
    <li>You're guessing what works</li>
  </ul>
</div>
<div class="ccm-card ccm-good">
  <div class="ccm-label">Your Platform</div>
  <ul class="ccm-list">
    <li>One system — website, analytics, AI strategy</li>
    <li>Your data feeds your strategy automatically</li>
    <li>You know exactly what's working</li>
  </ul>
</div>
```

- [ ] **Step 8: Add scattered tools CSS**

```css
/* ── Scattered tools mockup (compare bad pane) ── */
.scattered-tools-mock {
  width: 760px; height: 960px;
  transform: scale(0.592); transform-origin: top left;
  padding: 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.stm-tab {
  background: rgba(30, 30, 30, 0.9); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; overflow: hidden;
}
.stm-tab-bar {
  padding: 6px 12px; font-size: 10px; font-family: monospace;
  color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.stm-tab-body { padding: 12px; }
.stm-link {
  height: 28px; background: rgba(255,255,255,0.06);
  border-radius: 14px; margin-bottom: 8px;
}
.stm-chart {
  height: 60px; background: rgba(255,255,255,0.04);
  border-radius: 6px;
}
.stm-stat {
  flex: 1; height: 30px; background: rgba(255,255,255,0.04);
  border-radius: 6px;
}
.stm-msg {
  height: 24px; background: rgba(255,255,255,0.05);
  border-radius: 12px; margin-bottom: 8px; width: 80%;
}
.stm-msg-short { width: 55%; }
.stm-tab-1 { flex: 1.2; }
.stm-tab-2 { flex: 1; }
.stm-tab-3 { flex: 0.8; }
```

- [ ] **Step 9: Remove old Linktree mock JS**

Search for the JS block that builds the Linktree iframe `srcdoc` content (search for `linktree-mock` in the script section). Remove or comment out that block since we're no longer using an iframe for the bad pane.

- [ ] **Step 10: Test in browser**

Verify:
- Left pane shows scattered tools wireframe (desaturated via existing `.bad-pane` filter)
- Right pane shows Hub screenshot
- URL bar reads "your scattered tools vs your platform"
- Verdict says "Scattered · Manual" vs. "Unified · Intelligent"
- Mobile cards updated

- [ ] **Step 11: Commit**

```bash
git add index.html
git commit -m "feat: compare section — scattered tools vs. unified platform"
```

---

## Task 7: Analytics Section — Copy Update

Minimal copy changes. "site" → "platform".

**Files:**
- Modify: `index.html` — analytics section (lines ~2470-2515)

- [ ] **Step 1: Update analytics sub copy**

```html
<!-- OLD -->
<p class="analytics-sub">Every site I build includes a private, password-protected analytics dashboard. No third-party trackers. No shared data. Your numbers, visible only to you.</p>

<!-- NEW -->
<p class="analytics-sub">Every platform I build includes private, password-protected analytics. No third-party trackers. No shared data. Your numbers, visible only to you.</p>
```

- [ ] **Step 2: Test in browser**

Verify the analytics section copy reads correctly. All visuals unchanged.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "copy: analytics section — 'site' to 'platform'"
```

---

## Task 8: Work Showcase — "What She Sees" Layout

Restructure Mandi's showcase card to show website vs. Hub side by side.

**Files:**
- Modify: `index.html` — work section HTML (lines ~2632-2700) and related CSS

- [ ] **Step 1: Update work section headline**

```html
<!-- OLD -->
<h2 class="work-title">One creator.<br>One custom page.</h2>
<p class="work-sub">Built around her brand, her audience, and what she wants them to do.</p>

<!-- NEW -->
<h2 class="work-title">One creator.<br>One complete platform.</h2>
<p class="work-sub">Built around her brand, her audience, and what she wants them to do.</p>
```

- [ ] **Step 2: Restructure the showcase card to two-column layout**

Replace the `.client-showcase` div content with a two-column layout. Keep the existing phone mockup on the left, add Hub screenshot on the right:

```html
<div class="client-showcase">
  <div class="showcase-shimmer"></div>

  <!-- Two-column: audience view vs. creator view -->
  <div class="showcase-split">
    <div class="showcase-col showcase-audience">
      <div class="showcase-col-label">What her audience sees</div>
      <div class="showcase-desktop-toggle" id="desktopToggle" onclick="toggleDesktopView()">
        View desktop <i class="fa-solid fa-arrow-right"></i>
      </div>
      <div class="demo-phone-wrap-sm">
        <div class="phone-shell">
          <div class="phone-notch"></div>
          <div class="demo-phone-screen">
            <video class="demo-video-phone" autoplay muted loop playsinline>
              <source src="assets/mandi-phone.mp4" type="video/mp4">
            </video>
          </div>
        </div>
      </div>
      <div class="showcase-domain">mandibagley.com</div>
    </div>

    <div class="showcase-col showcase-creator">
      <div class="showcase-col-label showcase-col-label-accent">What she sees</div>
      <div class="showcase-hub-frame">
        <div class="showcase-hub-chrome">
          <span style="width:6px;height:6px;border-radius:50%;background:#ff5f57"></span>
          <span style="width:6px;height:6px;border-radius:50%;background:#febc2e"></span>
          <span style="width:6px;height:6px;border-radius:50%;background:#28c840"></span>
        </div>
        <img src="assets/hub-screenshot.png" alt="Mandi's Hub — private creator platform" class="showcase-hub-img">
      </div>
      <div class="showcase-domain showcase-domain-accent">Her private platform</div>
    </div>
  </div>

  <!-- Desktop video overlay (hidden by default, shown on toggle) -->
  <div class="desktop-overlay" id="desktopOverlay" style="display:none">
    <div class="desktop-overlay-close" onclick="toggleDesktopView()">✕</div>
    <div class="desktop-video-chrome">
      <div class="desktop-video-dots"><span></span><span></span><span></span></div>
      <div class="desktop-video-url"><span class="desktop-video-lock">🔒</span> mandibagley.com</div>
    </div>
    <video class="desktop-video" autoplay muted loop playsinline>
      <source src="assets/mandi-desktop.mp4" type="video/mp4">
    </video>
  </div>

  <div class="work-info">
    <p class="work-client">Fitness &amp; Lifestyle Creator · 1M+ Followers</p>
    <h3 class="work-name">Mandi Bagley</h3>
    <p class="work-desc">Mandi had a million followers and a scattered set of tools. I built her a complete platform — a custom website, private analytics, an AI strategist that reads her real data, and a Hub that gives her everything at a glance.</p>
    <div class="work-tags">
      <span class="work-tag">Custom Design</span>
      <span class="work-tag">Affiliate Codes</span>
      <span class="work-tag">Program Showcases</span>
      <span class="work-tag">Private Analytics</span>
      <span class="work-tag">AI Strategy</span>
      <span class="work-tag">Weekly Briefings</span>
      <span class="work-tag">Link Tracking</span>
    </div>
    <a class="work-link" href="https://mandibagley.com" target="_blank" rel="noopener noreferrer">
      See it live <i class="fa-solid fa-arrow-right"></i>
    </a>
  </div>
</div>
```

- [ ] **Step 3: Add showcase split CSS**

```css
/* ── Showcase split layout ── */
.showcase-split {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 24px; padding: 24px; margin-bottom: 20px;
}
.showcase-col { text-align: center; position: relative; }
.showcase-col-label {
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px;
}
.showcase-col-label-accent { color: var(--rose); }
.showcase-domain {
  font-size: 12px; font-weight: 600; color: var(--text-muted);
  margin-top: 12px;
}
.showcase-domain-accent { color: var(--rose); }
.demo-phone-wrap-sm { display: flex; justify-content: center; }
.demo-phone-wrap-sm .phone-shell { width: 140px; }
.demo-phone-wrap-sm .demo-phone-screen { height: 280px; }
.demo-phone-wrap-sm .demo-video-phone {
  width: 390px; height: 844px;
  transform: scale(0.359); transform-origin: top left;
}
.showcase-hub-frame {
  background: var(--dark); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 12px 36px rgba(0,0,0,0.5);
}
.showcase-hub-chrome {
  display: flex; gap: 5px; padding: 8px 10px;
  background: var(--surface-hi); border-bottom: 1px solid var(--border);
}
.showcase-hub-img {
  width: 100%; height: 300px; object-fit: cover; object-position: top;
  display: block;
}
.showcase-desktop-toggle {
  position: absolute; top: 0; right: 0;
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  cursor: pointer; transition: color var(--ease);
}
.showcase-desktop-toggle:hover { color: var(--rose); }

/* Desktop overlay */
.desktop-overlay {
  position: relative; margin: 0 24px 20px;
  background: var(--dark-card); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
}
.desktop-overlay-close {
  position: absolute; top: 8px; right: 12px;
  font-size: 16px; color: var(--text-muted); cursor: pointer;
  z-index: 5; transition: color var(--ease);
}
.desktop-overlay-close:hover { color: var(--text); }

@media (max-width: 600px) {
  .showcase-split { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4: Add desktop toggle JS**

```javascript
// ── Desktop video toggle for work showcase ──
function toggleDesktopView() {
  var overlay = document.getElementById('desktopOverlay');
  if (!overlay) return;
  overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
}
```

- [ ] **Step 5: Test in browser**

Verify:
- Mandi's showcase shows two columns: phone on left, Hub on right
- Column labels read "What her audience sees" vs. "What she sees"
- "View desktop →" toggles the desktop video overlay
- Tags include platform features
- Description mentions the full platform
- Mobile stacks the two columns

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: work showcase — 'what her audience sees vs what she sees' split layout"
```

---

## Task 9: What's Included — Package Breakdown

Replace the six-category capability grid with three platform layers.

**Files:**
- Modify: `index.html` — "What I Build" section (lines ~2707-2793)

- [ ] **Step 1: Update headline and quote**

```html
<!-- OLD -->
<span class="feat-label">What I Build</span>
<h2 class="feat-title">Not a feature set.<br>A page for your business.</h2>
<div class="feat-big-quote">I start with one question:<br><em>what do you want your<br>audience to do?</em></div>
<div class="feat-quote-body">Everything else — the structure, the hierarchy, the design, the details — follows from that. No templates. No recycled layouts. No boxed-in builder.</div>

<!-- NEW -->
<span class="feat-label">What's Included</span>
<h2 class="feat-title">Not a feature set.<br>A platform for your business.</h2>
<div class="feat-big-quote">I start with one question:<br><em>what do you want your<br>audience to do?</em></div>
<div class="feat-quote-body">Everything else — the page, the tracking, the intelligence — follows from that. No templates. No recycled layouts. No boxed-in builder.</div>
```

- [ ] **Step 2: Replace the six-category grid with three platform layers**

Replace the entire `.cap-cats` div and its contents with:

```html
<div class="cap-cats">
  <div class="cap-cat">
    <div class="cap-cat-head">
      <div class="cap-cat-icon brand">🌐</div>
      <div class="cap-cat-title brand">Your Website</div>
    </div>
    <div class="cap-cat-items">
      <span class="cap-cat-item brand">Your colors, fonts &amp; aesthetic</span>
      <span class="cap-cat-item brand">Your own domain</span>
      <span class="cap-cat-item brand">A layout that feels unmistakably yours</span>
      <span class="cap-cat-item brand">Photography &amp; visual direction</span>
      <span class="cap-cat-item brand">Auto-updating content feeds</span>
      <span class="cap-cat-item brand">Smart link buttons &amp; CTAs</span>
      <span class="cap-cat-item brand">Program &amp; course cards</span>
      <span class="cap-cat-item brand">Tap-to-copy affiliate codes</span>
      <span class="cap-cat-item brand">Client results &amp; testimonials</span>
      <span class="cap-cat-item brand">Brand partnership highlights</span>
    </div>
  </div>
  <div class="cap-cat">
    <div class="cap-cat-head">
      <div class="cap-cat-icon analytics">📊</div>
      <div class="cap-cat-title analytics">Your Analytics</div>
    </div>
    <div class="cap-cat-items">
      <span class="cap-cat-item analytics">Private password-protected dashboard</span>
      <span class="cap-cat-item analytics">30-day pageview &amp; visitor trends</span>
      <span class="cap-cat-item analytics">Link click tracking by platform</span>
      <span class="cap-cat-item analytics">Traffic sources &amp; world map</span>
      <span class="cap-cat-item analytics">Scroll depth &amp; session duration</span>
      <span class="cap-cat-item analytics">New vs. returning visitors</span>
      <span class="cap-cat-item analytics">Geographic data (country + city)</span>
      <span class="cap-cat-item analytics">Referrer-to-action conversions</span>
    </div>
  </div>
  <div class="cap-cat">
    <div class="cap-cat-head">
      <div class="cap-cat-icon commerce">🤖</div>
      <div class="cap-cat-title commerce">Your AI Strategist</div>
    </div>
    <div class="cap-cat-items">
      <span class="cap-cat-item commerce">AI-generated weekly briefings</span>
      <span class="cap-cat-item commerce">Real-time strategy chat</span>
      <span class="cap-cat-item commerce">"When should I post?" — answers from your data</span>
      <span class="cap-cat-item commerce">"What should I promote?" — based on conversions</span>
      <span class="cap-cat-item commerce">Platform performance recommendations</span>
      <span class="cap-cat-item commerce">Content strategy insights</span>
      <span class="cap-cat-item commerce">Streaming responses, not canned advice</span>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Test in browser**

Verify three layers show with correct styling (reuses existing `.cap-cat` CSS). Check mobile collapses correctly.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace capability grid with three-layer package breakdown"
```

---

## Task 10: Process + Contact + Misc Copy Updates

Final copy sweep across process cards, contact section, and any remaining "page" references.

**Files:**
- Modify: `index.html` — process section (~2798-2829), contact section (~2831-2881)

- [ ] **Step 1: Update process card copy**

Step 01 description:
```html
<!-- OLD -->
<p>Your audience, your business model, what you want people to do. A quick conversation is all it takes.</p>
<!-- NEW -->
<p>Your audience, your business model, what you want people to do. A quick conversation is all I need to map out your platform.</p>
```

Step 02 description:
```html
<!-- OLD -->
<p>No templates. Built from scratch — your colors, your structure, your conversion flow. Live within 72 hours.</p>
<!-- NEW -->
<p>No templates. Your website, your analytics, your AI strategist — designed and built from scratch. Live within 72 hours.</p>
```

Step 03 description:
```html
<!-- OLD -->
<p>Your page goes live on your domain. Updates, new features, refinements — just message me.</p>
<!-- NEW -->
<p>Your platform goes live on your domain. Weekly briefings, new features, strategy updates — just message me.</p>
```

- [ ] **Step 2: Update contact section**

Headline:
```html
<!-- OLD -->
<h2 class="contact-title">Send me your handle.<br>I'll tell you what <em>I'd build.</em></h2>
<!-- NEW -->
<h2 class="contact-title">Send me your handle.<br>I'll map out <em>your build.</em></h2>
```

Sub:
```html
<!-- OLD -->
<p class="contact-sub">No commitment, no brief to fill out. Tell me who you are and what you're building — I'll respond same day with what I'd make for you.</p>
<!-- NEW -->
<p class="contact-sub">No commitment, no brief to fill out. Tell me who you are and what you're building — I'll respond same day with a breakdown of what your platform would look like, what's included, and how it all works together.</p>
```

Message placeholder:
```html
<!-- OLD -->
<textarea id="message" name="message" placeholder="What do you sell, promote, or want your audience to do? What's not working about your current page?"></textarea>
<!-- NEW -->
<textarea id="message" name="message" placeholder="What do you sell, promote, or want your audience to do? What tools are you currently using?"></textarea>
```

- [ ] **Step 3: Global "page" → "platform" sweep**

Search the entire HTML for any remaining instances of the word "page" that should be "platform" in copy text (not in CSS class names or technical references). Key places to check:
- Meta description tag
- OG description
- Any remaining body copy

Update the meta description:
```html
<!-- OLD -->
<meta name="description" content="Sam Otto builds custom creator landing pages from scratch — designed around your brand, your audience, and what you want them to do. Done for you. Live in 72 hours." />
<!-- NEW -->
<meta name="description" content="Sam Otto builds complete creator platforms from scratch — a custom website, private analytics, and an AI strategist. Designed around your brand. Done for you. Live in 72 hours." />
```

- [ ] **Step 4: Test full page in browser**

Full scroll-through test. Verify every section reads correctly with platform positioning. Check:
- Meta description in page source
- Process cards updated
- Contact headline and sub updated
- No stray "page" references in copy

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "copy: update process, contact, and meta — full 'platform' positioning sweep"
```

---

## Task 11: Final Integration Test + Deploy

Full end-to-end verification and deployment.

**Files:**
- No new changes — testing only

- [ ] **Step 1: Full desktop walkthrough**

Open the site in browser at full width (1280px+). Scroll through every section and verify:
1. Particle intro → "Creator Platforms" text forms correctly
2. Hero auto-play sequence: phone → "Your website." → "Your data." + analytics card → "Your AI strategist." + AI card → Hub card → sub + CTAs
3. Platform breakdown: three layers with mini visuals
4. Compare: scattered tools (left) vs Hub (right), correct labels and verdicts
5. Impact cards unchanged
6. Ownership row unchanged
7. Analytics section: "platform" in sub copy
8. Work showcase: two-column split, phone left, Hub right, desktop toggle works
9. What's Included: three package layers
10. Process: updated descriptions
11. Contact: "map out your build" headline
12. Footer: "Creator platforms, built from scratch."
13. Nav: "Creator Platforms, Built from Scratch"

- [ ] **Step 2: Mobile walkthrough**

Resize to 375px width or use mobile device emulation. Verify:
1. Hero stacks correctly (text above, phone below)
2. Floating cards reposition for mobile
3. Platform breakdown layers stack vertically
4. Compare section mobile cards show updated copy
5. Work showcase columns stack
6. Package breakdown readable on mobile

- [ ] **Step 3: Deploy**

```bash
cd /Users/samotto/portfolio-template
vercel deploy --prod
```

Or push to git if the project auto-deploys from a repo.

- [ ] **Step 4: Verify live site**

Open `https://sam-otto-portfolio.vercel.app/` and do a quick scroll-through to confirm everything deployed correctly.

- [ ] **Step 5: Commit any final fixes**

If any issues were found and fixed during testing:
```bash
git add index.html
git commit -m "fix: final polish from integration testing"
```
