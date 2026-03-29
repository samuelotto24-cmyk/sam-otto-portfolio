import { sql } from '../lib/db.mjs';

export default async function handler(req, res) {
  const hash = req.query.hash;
  if (!hash) return res.status(400).send('Missing hash');

  const db = sql();

  const rows = await db`SELECT * FROM leads WHERE preview_hash = ${hash}`;
  if (!rows.length) {
    return res.status(404).send(expiredPage());
  }

  const lead = rows[0];

  if (new Date(lead.expires_at) < new Date()) {
    return res.status(410).send(expiredPage());
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const isOwner = cookies.preview_owner === hash || cookies['preview_unlocked_' + hash] === 'true';

  await db`INSERT INTO preview_views (preview_hash, viewer_email, is_owner) VALUES (${hash}, ${isOwner ? lead.email : null}, ${isOwner})`;

  const blobResp = await fetch(lead.blob_url);
  if (!blobResp.ok) {
    return res.status(500).send('Preview not found in storage');
  }
  let html = await blobResp.text();

  if (!isOwner) {
    html = html.replace('<body>', '<body data-gated="true">');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html);
}

function parseCookies(str) {
  const cookies = {};
  str.split(';').forEach(function(pair) {
    const parts = pair.trim().split('=');
    if (parts[0]) cookies[parts[0]] = parts[1] || '';
  });
  return cookies;
}

function expiredPage() {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview Expired</title><style>body{font-family:system-ui;background:#0C0809;color:#F5EBE6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}a{color:#B76E79;text-decoration:none;border:1px solid #B76E79;padding:12px 28px;border-radius:10px;margin-top:20px;display:inline-block;font-weight:600}</style></head><body><div><h1>This preview has expired</h1><p style="color:rgba(245,235,230,0.5)">Previews are available for 7 days.</p><a href="https://bysamotto.com">Build a new one</a></div></body></html>';
}
