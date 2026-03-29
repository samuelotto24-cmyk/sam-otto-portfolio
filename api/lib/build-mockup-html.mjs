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
