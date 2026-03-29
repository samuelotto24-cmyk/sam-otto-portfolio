import { sql } from './lib/db.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hash, email } = req.body || {};
  if (!hash || !email) {
    return res.status(400).json({ error: 'Hash and email required' });
  }

  const db = sql();

  const rows = await db`SELECT preview_hash FROM leads WHERE preview_hash = ${hash}`;
  if (!rows.length) {
    return res.status(404).json({ error: 'Preview not found' });
  }

  await db`INSERT INTO share_captures (preview_hash, email) VALUES (${hash}, ${email})`;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (resendKey && fromEmail && toEmail) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'Shared preview lead: ' + email,
        html: '<p>Someone unlocked a shared preview.</p><p><strong>Email:</strong> ' + email + '</p><p><strong>Preview:</strong> <a href="https://bysamotto.com/preview/' + hash + '">View</a></p>',
      }),
    });
  }

  res.setHeader('Set-Cookie', 'preview_unlocked_' + hash + '=true; Path=/; Max-Age=' + (60 * 60 * 24 * 7) + '; SameSite=Lax');

  return res.status(200).json({ success: true });
}
