import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, niche, sells, followers } = req.body || {};
  if (!name || !niche) {
    return res.status(400).json({ error: 'Name and niche required' });
  }

  const followerLabel = formatFollowers(followers || 0);
  const sellsList = (sells || []).join(', ') || 'content and brand partnerships';

  const prompt = `You are writing website copy for a ${niche.toLowerCase()} creator named ${name} who has ${followerLabel} followers. They sell/offer: ${sellsList}.

Generate the following in JSON format. All copy should be warm, confident, and specific to their niche — NOT generic template language. Write as if you deeply understand their world.

{
  "heroTagline": "A tagline for their niche (e.g., 'Fitness · Faith · Food')",
  "heroGreeting": "A casual greeting headline (e.g., 'Hey, I'm ${name}')",
  "aboutBody": "2-3 sentences about who they are and what they do. Warm and personal.",
  "aboutStats": [
    {"value": "realistic stat", "label": "label"},
    {"value": "realistic stat", "label": "label"},
    {"value": "realistic stat", "label": "label"}
  ],
  "programsHeadline": "Headline for their programs/offerings section",
  "programsSubheadline": "One-line subtitle",
  "programs": [
    {"title": "Program name", "description": "1-2 sentence description", "price": "$XX/mo"},
    {"title": "Program name", "description": "1-2 sentence description", "price": "$XX"}
  ],
  "partnersHeadline": "Headline for brand codes section",
  "partnersSubheadline": "One-line subtitle",
  "aiRecommendation": "A specific, actionable AI strategist recommendation for this creator based on their niche. 2-3 sentences. Reference specific content types and timing.",
  "briefingActions": [
    {"headline": "Action item 1 — specific to their niche", "dataPoint": "Supporting data point"},
    {"headline": "Action item 2 — specific to their niche", "dataPoint": "Supporting data point"}
  ]
}

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text;
    const copy = JSON.parse(text);

    return res.status(200).json({ success: true, copy });
  } catch (e) {
    console.error('AI copy generation failed:', e.message);
    return res.status(500).json({ success: false, error: 'Copy generation failed' });
  }
}

function formatFollowers(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(count);
}
