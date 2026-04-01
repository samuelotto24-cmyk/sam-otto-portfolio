import { put } from '@vercel/blob';
import { sql } from './lib/db.mjs';
import { buildMockupHtml } from './lib/build-mockup-html.mjs';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, handle, followers, niche, sells, colors, photo, copy, postImages, template } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const hash = crypto.randomBytes(8).toString('hex');

  const html = buildMockupHtml({ name, niche, photo, colors, sells, followers, copy, handle, postImages, template });
  const finalHtml = html.replace(/HASH_PLACEHOLDER/g, hash);

  const blob = await put('previews/' + hash + '.html', finalHtml, {
    access: 'public',
    contentType: 'text/html',
  });

  const db = sql();
  await db`
    INSERT INTO leads (name, email, instagram_handle, follower_count, niche, sells, colors, photo_url, preview_hash, blob_url)
    VALUES (${name}, ${email}, ${handle || null}, ${followers || null}, ${niche || null}, ${sells || []}, ${JSON.stringify(colors || [])}, ${photo || null}, ${hash}, ${blob.url})
  `;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  if (resendKey && fromEmail) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Your platform preview is ready, ' + name + '!',
        html: '<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px"><h2 style="margin-bottom:8px">Hey ' + name + ',</h2><p style="color:#666;line-height:1.6">Your personalized platform preview is ready. Here\'s a glimpse of what your custom creator platform could look like.</p><a href="https://bysamotto.com/preview/' + hash + '" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#B76E79;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">View Your Preview</a><p style="color:#999;font-size:13px">This preview expires in 7 days. Want to make it real? Reply to this email or book a call.</p><p style="color:#999;font-size:13px;margin-top:24px">— Sam Otto</p></div>',
      }),
    });

    const toEmail = process.env.CONTACT_TO_EMAIL;
    if (toEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + resendKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: 'New mockup lead: ' + name + ' (@' + (handle || 'no handle') + ')',
          html: '<h2>New mockup generated</h2><p><strong>Name:</strong> ' + name + '</p><p><strong>Email:</strong> ' + email + '</p><p><strong>Instagram:</strong> @' + (handle || 'N/A') + '</p><p><strong>Followers:</strong> ' + (followers ? followers.toLocaleString() : 'N/A') + '</p><p><strong>Niche:</strong> ' + (niche || 'N/A') + '</p><p><strong>Sells:</strong> ' + ((sells || []).join(', ') || 'N/A') + '</p><p><a href="https://bysamotto.com/preview/' + hash + '">View their preview</a></p>',
        }),
      });
    }
  }

  res.setHeader('Set-Cookie', 'preview_owner=' + hash + '; Path=/; Max-Age=' + (60 * 60 * 24 * 7) + '; SameSite=Lax');

  return res.status(200).json({
    success: true,
    previewUrl: '/preview/' + hash,
    hash,
  });
}
