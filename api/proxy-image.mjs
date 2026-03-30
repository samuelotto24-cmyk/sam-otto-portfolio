export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!resp.ok) {
      return res.status(resp.status).send('Image fetch failed');
    }

    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await resp.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buffer);
  } catch (e) {
    return res.status(500).send('Proxy error');
  }
}
