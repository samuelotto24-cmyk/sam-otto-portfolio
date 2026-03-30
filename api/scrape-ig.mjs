import sharp from 'sharp';

const USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  'Twitterbot/1.0',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { handle } = req.body || {};
  if (!handle) {
    return res.status(400).json({ success: false, error: 'Handle is required' });
  }

  const cleanHandle = handle.replace(/^@/, '').trim();

  // Try multiple crawler UAs — Instagram allows some but blocks others
  let profileData = null;
  for (const ua of USER_AGENTS) {
    try {
      profileData = await fetchWithCrawlerUA(cleanHandle, ua);
      if (profileData) break;
    } catch (e) {
      console.error(`Scrape with ${ua.split('/')[0]} failed:`, e.message);
    }
  }

  // Fallback: Instagram mobile API
  if (!profileData) {
    try {
      profileData = await fetchProfileApi(cleanHandle);
    } catch (e) {
      console.error('API scrape failed:', e.message);
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
      colors = defaultColors();
    }
  } else {
    colors = defaultColors();
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

function defaultColors() {
  return [
    { hex: '#B76E79', rgb: { r: 183, g: 110, b: 121 }, weight: 0.3 },
    { hex: '#FAF7F2', rgb: { r: 250, g: 247, b: 242 }, weight: 0.25 },
    { hex: '#2D1810', rgb: { r: 45, g: 24, b: 16 }, weight: 0.2 },
    { hex: '#E8DDD7', rgb: { r: 232, g: 221, b: 215 }, weight: 0.15 },
    { hex: '#8B7B74', rgb: { r: 139, g: 123, b: 116 }, weight: 0.1 },
  ];
}

async function fetchWithCrawlerUA(handle, ua) {
  const resp = await fetch(`https://www.instagram.com/${handle}/`, {
    headers: { 'User-Agent': ua },
    redirect: 'follow',
  });

  if (!resp.ok) throw new Error(`Fetch returned ${resp.status}`);
  const html = await resp.text();

  // Look for description with follower count
  const description = html.match(/content="([^"]*\d+[KMkm]?\s*Followers[^"]*)"/i)?.[1] || '';
  if (!description) throw new Error('No follower description found');

  let followers = 0;
  const followerMatch = description.match(/([\d,.]+[KMkm]?)\s*Followers/i);
  if (followerMatch) {
    followers = parseFollowerCount(followerMatch[1]);
  }
  if (followers === 0) throw new Error('Could not parse follower count');

  // Name
  const descNameMatch = description.match(/from\s+([^(]+)\s*\(/);
  const titleMatch = html.match(/<title>([^(]+)\(/);
  const name = descNameMatch ? descNameMatch[1].trim()
    : titleMatch ? titleMatch[1].trim()
    : handle;

  // Photo
  let photo = '';
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogImageMatch) {
    photo = ogImageMatch[1].replace(/&amp;/g, '&');
  }

  const category = detectNicheFromBio(description);

  return { name, photo, followers, bio: description, category };
}

async function fetchProfileApi(handle) {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Instagram 278.0.0.19.115 Android',
      'X-IG-App-ID': '936619743392459',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  });

  if (!resp.ok) throw new Error(`API returned ${resp.status}`);

  const data = await resp.json();
  const user = data?.data?.user;
  if (!user || (!user.full_name && !user.edge_followed_by?.count)) {
    throw new Error('API returned empty profile');
  }

  return {
    name: user.full_name || handle,
    photo: user.profile_pic_url_hd || user.profile_pic_url || '',
    followers: user.edge_followed_by?.count || 0,
    bio: user.biography || '',
    category: user.category_name || detectNicheFromBio(user.biography || ''),
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

  const { data } = await sharp(buffer)
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < data.length; i += 3) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

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
