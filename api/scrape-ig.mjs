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
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
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

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || '';
  const description = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || '';

  let followers = 0;
  const followerMatch = description.match(/([\d,.]+[KMkm]?)\s*Followers/i);
  if (followerMatch) {
    followers = parseFollowerCount(followerMatch[1]);
  }

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

  const { data, info } = await sharp(buffer)
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
