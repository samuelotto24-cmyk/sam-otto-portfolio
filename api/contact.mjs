function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendApiKey    = process.env.RESEND_API_KEY;
  const contactToEmail  = process.env.CONTACT_TO_EMAIL;
  const contactFromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!resendApiKey || !contactToEmail || !contactFromEmail) {
    return res.status(500).json({ error: 'Email delivery is not configured yet.' });
  }

  const { name, email, instagram, followers, message } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const safeName      = escapeHtml(name);
  const safeEmail     = escapeHtml(email);
  const safeInstagram = escapeHtml(instagram || 'Not provided');
  const safeFollowers = escapeHtml(followers  || 'Not provided');
  const safeMessage   = escapeHtml(message    || 'Not provided').replace(/\n/g, '<br />');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: contactFromEmail,
      to: [contactToEmail],
      reply_to: email,
      subject: `New portfolio inquiry from ${name}`,
      html: `
        <h2>New portfolio inquiry</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Instagram:</strong> ${safeInstagram}</p>
        <p><strong>Follower Count:</strong> ${safeFollowers}</p>
        <p><strong>Message:</strong><br />${safeMessage}</p>
      `,
    }),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    console.error('Resend send failed:', errorText);
    return res.status(502).json({ error: 'Unable to send your message right now. Please try again shortly.' });
  }

  return res.status(200).json({ ok: true });
}
