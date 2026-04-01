import { readFileSync } from 'fs';
import { join } from 'path';
import { scaleAnalytics, formatNum } from './scale-analytics.mjs';

// Read templates once at cold start
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templateCache = {};
function getTemplate(variant) {
  const key = variant || 'light';
  if (!templateCache[key]) {
    const base = key === 'dark' ? 'creator-template-dark.html' : 'creator-template.html';
    const searchPaths = [
      join(process.cwd(), base),
      join(__dirname, '..', '..', base),
      '/var/task/' + base,
      '/var/task/user/' + base,
    ];
    for (const p of searchPaths) {
      try {
        templateCache[key] = readFileSync(p, 'utf8');
        break;
      } catch (e) { /* try next */ }
    }
  }
  return templateCache[key] || null;
}

export function buildMockupHtml(data) {
  const { name, niche, photo, colors, sells, followers, copy, handle, postImages, template: templateChoice } = data;
  const analytics = scaleAnalytics(followers);

  const accent = pickAccentColor(colors);
  const bg = pickBgColor(colors);
  const textColor = isLight(bg) ? '#2D1810' : '#F5EBE6';
  const mutedColor = isLight(bg) ? '#8B7B74' : 'rgba(245,235,230,0.5)';
  const surfaceColor = isLight(bg) ? '#FFFFFF' : 'rgba(255,255,255,0.05)';
  const borderColor = isLight(bg) ? '#E8DDD7' : 'rgba(255,255,255,0.08)';

  const sellsSet = new Set(sells || []);
  const showPrograms = sellsSet.has('Programs & Courses') || sellsSet.has('Coaching') || sellsSet.has('Digital Products');
  const showCodes = sellsSet.has('Affiliate Codes') || sellsSet.has('Brand Deals');
  const nicheLabel = niche || 'Lifestyle';
  const followerLabel = formatNum(followers || 10000);

  // Try to use the real creator template
  let template = getTemplate(templateChoice);

  if (template) {
    return buildFromTemplate(template, {
      name, handle, niche: nicheLabel, photo, accent, bg, textColor, mutedColor, surfaceColor, borderColor,
      followerLabel, showPrograms, showCodes, sellsSet, copy, analytics, postImages: postImages || [],
    });
  }

  // Fallback: build a standalone preview page
  return buildStandalonePage({
    name, handle, niche: nicheLabel, photo, accent, bg, textColor, mutedColor, surfaceColor, borderColor,
    followerLabel, showPrograms, showCodes, copy, analytics,
  });
}

function buildFromTemplate(html, d) {
  const configObj = {
    name: d.name || 'Creator',
    handle: '@' + (d.handle || 'creator'),
    tagline: d.copy?.heroTagline || d.niche,
    colors: { bg: d.bg, accent: d.accent, text: d.textColor, muted: d.mutedColor, surface: d.surfaceColor, border: d.borderColor },
    displayFont: 'cormorant',
    hero: {
      greetings: {
        morning: 'Good morning — ready to reset?',
        afternoon: "Good afternoon — let's lock in.",
        evening: 'Good evening — time to level up.',
        night: "Up late? Let's get to work.",
      },
    },
    social: {
      tiktok: '', instagram: d.handle ? 'https://instagram.com/' + d.handle : '',
      instagram_alt: '', youtube: '', snapchat: '', twitter: '', pinterest: '',
    },
    quickLinks: buildQuickLinks(d.sellsSet),
    about: {
      enabled: true,
      headline: d.copy?.heroGreeting || ("Hey, I'm " + d.name),
      body: d.copy?.aboutBody || 'Welcome to my corner of the internet.',
      stats: d.copy?.aboutStats || [
        { value: d.followerLabel + '+', label: 'Followers' },
        { value: '—', label: 'Students' },
        { value: '—', label: 'Programs' },
      ],
    },
    programs: {
      enabled: d.showPrograms,
      headline: d.copy?.programsHeadline || 'My Programs',
      subheadline: d.copy?.programsSubheadline || 'Built for real results.',
      items: (d.copy?.programs || []).map((p, i) => ({
        title: p.title, description: p.description, price: p.price,
        badge: i === 0 ? 'Most Popular' : '',
        primaryBtn: { text: 'Join Now', href: '#' },
        outlineBtn: { text: 'Learn More', href: '#' },
      })),
    },
    photoStrip: {
      enabled: d.postImages.length >= 3,
      photos: d.postImages.map(function(url) { return '/api/proxy-image?url=' + encodeURIComponent(url); }),
      speed: '18s',
    },
    youtube: { enabled: false, headline: 'Watch My Latest', channelUrl: '', videoId: '' },
    partners: {
      enabled: d.showCodes,
      headline: d.copy?.partnersHeadline || 'My Favorites',
      subheadline: d.copy?.partnersSubheadline || 'Brands I trust and actually use.',
      items: [
        { brand: 'Brand Partner', code: 'CODE15', discount: '15% off', href: '#' },
        { brand: 'Brand Partner', code: 'SAVE20', discount: '20% off', href: '#' },
      ],
    },
    newsletter: { enabled: false, headline: "Something's Coming", subheadline: 'Be the first to know.', buttonText: 'Notify Me', confirmText: "You're on the list!", beehiivPublicationId: '' },
    support: { enabled: false, headline: 'Support My Work', links: [] },
    contact: { enabled: true, headline: 'Work With Me', email: '#', buttonText: 'Get In Touch' },
    ticker: {
      enabled: true,
      messages: [
        '🔥 Someone just visited ' + d.name + "'s page",
        '💪 New visitor just checked out the programs',
        '⭐ This page was built by Sam Otto',
        '📦 Custom-built creator platform — bysamotto.com',
      ],
    },
    og: { title: d.name, description: d.copy?.heroTagline || d.niche, image: d.photo || '', url: '' },
    dashboard: { password: 'preview' },
  };

  // Replace the CONFIG block
  const configStart = html.indexOf('const CONFIG = {');
  const endOfConfigMarker = html.indexOf('// ║  END OF CONFIG');
  if (configStart === -1 || endOfConfigMarker === -1) {
    // Can't find CONFIG — fall back to standalone
    return buildStandalonePage(d);
  }
  const endScript = html.indexOf('</script>', endOfConfigMarker);

  const configScript = `const CONFIG = ${JSON.stringify(configObj, null, 2)};
  window.__PREVIEW_MODE__ = true;`;

  html = html.substring(0, configStart) + configScript + '\n' + html.substring(endScript);

  // Inject profile photo
  if (d.photo) {
    const proxiedPhoto = '/api/proxy-image?url=' + encodeURIComponent(d.photo);
    // Replace all image src references to hero.jpg and about.jpg with the proxied profile photo
    html = html.replace(/src="assets\/hero\.jpg"/g, 'src="' + proxiedPhoto + '"');
    html = html.replace(/src="assets\/about\.jpg"/g, 'src="' + proxiedPhoto + '"');
    // Also handle any CSS background-image references
    html = html.replace('</head>', `<style>
      .hero-photo img, .about-photo img { content: url('${proxiedPhoto}') !important; }
      .hero-photo, .about-photo { background-image: url('${proxiedPhoto}'); background-size: cover; background-position: center; }
    </style></head>`);
  }

  // Disable tracking
  html = html.replace(/fetch\(['"]\/api\/track['"]/g, '/* preview */ void(0) && fetch("/api/track"');

  // Preview banner
  const banner = `<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:${d.accent};color:#fff;text-align:center;padding:10px 20px;font-family:system-ui;font-size:13px;font-weight:600;letter-spacing:0.02em;box-shadow:0 2px 12px rgba(0,0,0,0.2)">This is a preview of what your site could look like · <a href="https://bysamotto.com/#contact" style="color:#fff;text-decoration:underline;margin-left:8px">Build mine →</a></div><div style="height:40px"></div>`;
  html = html.replace('<body>', '<body>' + banner);

  // Append the 4-layer showcase
  html = html.replace('</body>', buildLayersSection(d) + '</body>');

  return html;
}

function buildStandalonePage(d) {
  // Minimal standalone page when template isn't available
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${d.name} — Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:${d.bg};color:${d.textColor};font-family:'DM Sans',system-ui}
.sec{min-height:80vh;display:flex;align-items:center;justify-content:center;padding:60px 24px;text-align:center}
.inner{max-width:600px;width:100%}
h1{font-family:'Cormorant Garamond',serif;font-size:clamp(32px,5vw,48px);font-weight:500;margin-bottom:16px}
.sub{color:${d.mutedColor};font-size:15px;line-height:1.7}
.accent{color:${d.accent}}
</style></head><body>
<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:${d.accent};color:#fff;text-align:center;padding:10px 20px;font-family:system-ui;font-size:13px;font-weight:600">This is a preview · <a href="https://bysamotto.com/#contact" style="color:#fff;text-decoration:underline">Build mine →</a></div>
<div style="height:40px"></div>
<div class="sec"><div class="inner">
${d.photo ? '<img src="' + d.photo + '" style="width:100px;height:100px;border-radius:50%;border:3px solid ' + d.accent + ';object-fit:cover;margin-bottom:20px" onerror="this.style.display=\'none\'">' : ''}
<h1>${d.copy?.heroGreeting || "Hey, I'm " + d.name}</h1>
<p class="sub">${d.copy?.aboutBody || ''}</p>
</div></div>
${buildLayersSection(d)}
</body></html>`;
}

function buildLayersSection(d) {
  return `
<div style="background:#0C0809;color:#F5EBE6;font-family:'DM Sans',system-ui">
  <div style="padding:80px 24px;max-width:800px;margin:0 auto;text-align:center">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${d.accent};margin-bottom:16px">Layer 02 — Your Analytics</div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
      <div style="font-family:'Cormorant Garamond',serif;font-size:28px;margin-bottom:24px">Growth Overview</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${[
          { val: formatNum(d.analytics.followers), label: 'Followers', trend: d.analytics.followerGrowth + ' this month' },
          { val: formatNum(d.analytics.views), label: 'Total Views', trend: d.analytics.viewsTrend },
          { val: d.analytics.engagement + '%', label: 'Engagement', trend: '+2.1%' },
          { val: '$' + d.analytics.revenue.toLocaleString(), label: 'Link Revenue', trend: '+34%' },
        ].map(s => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px"><div style="font-family:'Cormorant Garamond',serif;font-size:22px">${s.val}</div><div style="font-size:9px;color:rgba(245,235,230,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-top:4px">${s.label}</div><div style="font-size:10px;color:#4ade80;margin-top:2px">${s.trend}</div></div>`).join('')}
      </div>
      <div style="font-size:10px;color:rgba(245,235,230,0.3);margin-top:16px">Simulated data · Based on your public profile</div>
    </div>
  </div>
  <div style="padding:40px 24px 80px;max-width:800px;margin:0 auto;text-align:center">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${d.accent};margin-bottom:16px">Layer 03 — Your AI Strategist</div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;text-align:left">
      <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;gap:12px"><div style="width:36px;height:36px;border-radius:10px;background:${d.accent};display:flex;align-items:center;justify-content:center;font-size:18px">🧠</div><div style="font-size:16px;font-weight:600">Your AI Strategist</div></div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="align-self:flex-end;background:${d.accent};color:#fff;padding:12px 16px;border-radius:14px 14px 4px 14px;max-width:85%;font-size:14px;line-height:1.6">When should I post this week?</div>
        <div style="align-self:flex-start;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:12px 16px;border-radius:14px 14px 14px 4px;max-width:85%;font-size:14px;line-height:1.6">${d.copy?.aiRecommendation || 'Based on your engagement patterns, Tuesday at 7pm and Thursday at 12pm are your highest-performing windows.'}</div>
      </div>
    </div>
    <div style="font-size:10px;color:rgba(245,235,230,0.3);margin-top:16px">Sample recommendation · Your real AI will use your actual data</div>
  </div>
  <div style="padding:40px 24px 80px;max-width:800px;margin:0 auto;text-align:center">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${d.accent};margin-bottom:16px">Layer 04 — Your Weekly Briefing</div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;text-align:left">
      <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08)"><div style="font-size:14px;font-weight:600">Your AI Strategist</div><div style="font-size:13px;color:rgba(245,235,230,0.45);margin-top:2px">Your Monday Briefing — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>
      <div style="padding:20px">
        <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;font-size:12px;color:rgba(245,235,230,0.5)">
          <span>📺 <strong style="color:#F5EBE6">${formatNum(d.analytics.views)}</strong> views ${d.analytics.viewsTrend}</span>
          <span>📸 <strong style="color:#F5EBE6">${d.analytics.engagement}%</strong> engagement</span>
        </div>
        ${(d.copy?.briefingActions || []).map(a => '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin-bottom:8px"><div style="font-size:14px;font-weight:600;margin-bottom:4px">' + a.headline + '</div><div style="font-size:12px;color:rgba(245,235,230,0.45)">' + a.dataPoint + '</div></div>').join('')}
      </div>
    </div>
    <div style="font-size:10px;color:rgba(245,235,230,0.3);margin-top:16px">Simulated · Your real briefings use your actual data</div>
  </div>
  <div style="padding:80px 24px;max-width:600px;margin:0 auto;text-align:center">
    <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(28px,5vw,44px);font-weight:500;margin-bottom:12px;color:#F5EBE6">Ready to make it real?</div>
    <div style="font-size:14px;color:rgba(245,235,230,0.5);margin-bottom:32px">I'll fully customize this to your brand and have it live within 72 hours.</div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="https://bysamotto.com/#contact" style="padding:14px 32px;background:${d.accent};color:#fff;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none">Build mine →</a>
      <a href="https://bysamotto.com/#contact" style="padding:14px 32px;background:transparent;color:#F5EBE6;border:1px solid rgba(255,255,255,0.15);border-radius:12px;font-size:15px;font-weight:600;text-decoration:none">Book a call →</a>
    </div>
    <div style="font-size:12px;color:rgba(245,235,230,0.3);margin-top:20px">This preview expires in 7 days</div>
  </div>
</div>
<div id="blurGate" style="display:none;position:fixed;inset:0;z-index:100000;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);background:rgba(0,0,0,0.5);align-items:center;justify-content:center">
  <div style="background:#1a1416;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px;max-width:400px;text-align:center;color:#F5EBE6;font-family:system-ui">
    <h3 style="font-family:'Cormorant Garamond',serif;font-size:24px;margin-bottom:8px">See this mockup</h3>
    <p style="font-size:14px;color:rgba(245,235,230,0.5);margin-bottom:24px">Enter your email to view this personalized creator platform preview.</p>
    <input type="email" id="gateEmail" placeholder="your@email.com" style="width:100%;padding:12px 16px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:14px;background:rgba(255,255,255,0.05);color:#F5EBE6;margin-bottom:12px;font-family:system-ui;box-sizing:border-box">
    <button onclick="unlockPreview()" style="width:100%;padding:12px;background:${d.accent};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:system-ui">View mockup</button>
  </div>
</div>
<script>
var isOwner=document.cookie.includes('preview_owner=HASH_PLACEHOLDER');
var isGated=document.body.dataset.gated==='true';
if(isGated&&!isOwner){document.getElementById('blurGate').style.display='flex'}
function unlockPreview(){var e=document.getElementById('gateEmail').value;if(!e)return;fetch('/api/preview-unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hash:'HASH_PLACEHOLDER',email:e})}).then(function(r){return r.json()}).then(function(){document.getElementById('blurGate').style.display='none'})}
</script>`;
}

function buildQuickLinks(sellsSet) {
  const links = [];
  if (sellsSet.has('Programs & Courses') || sellsSet.has('Coaching') || sellsSet.has('Digital Products'))
    links.push({ label: 'Programs', icon: 'fa-solid fa-dumbbell', href: '#programs' });
  if (sellsSet.has('Affiliate Codes') || sellsSet.has('Brand Deals'))
    links.push({ label: 'Codes', icon: 'fa-solid fa-tag', href: '#partners' });
  links.push({ label: 'Contact', icon: 'fa-solid fa-envelope', href: '#contact' });
  return links;
}

function pickAccentColor(colors) {
  if (!colors || !colors.length) return '#B76E79';
  let best = colors[0], bestSat = 0;
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
  const sorted = [...colors].sort((a, b) => (b.rgb.r + b.rgb.g + b.rgb.b) - (a.rgb.r + a.rgb.g + a.rgb.b));
  return sorted[0].hex;
}

function isLight(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
