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
  const apifyToken = process.env.APIFY_API_TOKEN;

  if (!apifyToken) {
    return res.status(200).json({ success: false, error: 'Scraper not configured' });
  }

  try {
    // Run the Apify Instagram Profile Scraper (synchronous, waits up to 30s)
    const runResp = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=${apifyToken}&waitForFinish=30`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [cleanHandle] }),
      }
    );

    const run = await runResp.json();

    if (run.data?.status !== 'SUCCEEDED') {
      console.error('Apify run did not succeed:', run.data?.status);
      return res.status(200).json({ success: false });
    }

    // Fetch the results
    const dataResp = await fetch(
      `https://api.apify.com/v2/datasets/${run.data.defaultDatasetId}/items?token=${apifyToken}`
    );
    const items = await dataResp.json();

    if (!items.length) {
      return res.status(200).json({ success: false });
    }

    const profile = items[0];

    // Extract colors from profile photo
    let colors = [];
    const photoUrl = profile.profilePicUrlHD || profile.profilePicUrl || '';
    if (photoUrl) {
      try {
        colors = await extractColors(photoUrl);
      } catch (e) {
        console.error('Color extraction failed:', e.message);
        colors = defaultColors();
      }
    } else {
      colors = defaultColors();
    }

    return res.status(200).json({
      success: true,
      name: profile.fullName || cleanHandle,
      photo: photoUrl,
      followers: profile.followersCount || 0,
      bio: profile.biography || '',
      category: profile.businessCategoryName || detectNicheFromBio(profile.biography || ''),
      colors,
    });
  } catch (e) {
    console.error('Apify scrape failed:', e.message);
    return res.status(200).json({ success: false });
  }
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
