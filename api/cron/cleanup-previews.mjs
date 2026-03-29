import { sql } from '../lib/db.mjs';
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== 'Bearer ' + cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = sql();

  const expired = await db`
    SELECT preview_hash, blob_url FROM leads
    WHERE expires_at < NOW() AND status != 'expired'
  `;

  let deleted = 0;
  for (const row of expired) {
    if (row.blob_url) {
      try {
        await del(row.blob_url);
      } catch (e) {
        console.error('Failed to delete blob for ' + row.preview_hash + ':', e.message);
      }
    }

    await db`UPDATE leads SET status = 'expired' WHERE preview_hash = ${row.preview_hash}`;
    deleted++;
  }

  return res.status(200).json({ success: true, deleted });
}
