export function scaleAnalytics(followers) {
  const f = followers || 10000;

  const viewsRatio = 0.2 + Math.random() * 0.4;
  const views = Math.round(f * viewsRatio);
  const engagement = (3 + Math.random() * 5).toFixed(1);

  let revenue;
  if (f >= 1000000) revenue = 3000 + Math.round(Math.random() * 5000);
  else if (f >= 100000) revenue = 1500 + Math.round(Math.random() * 3000);
  else if (f >= 10000) revenue = 500 + Math.round(Math.random() * 1500);
  else revenue = 100 + Math.round(Math.random() * 400);

  const viewsTrend = (5 + Math.random() * 20).toFixed(0);
  const followerGrowth = Math.round(f * (0.005 + Math.random() * 0.02));

  return {
    followers: f,
    views,
    engagement: parseFloat(engagement),
    revenue,
    viewsTrend: '+' + viewsTrend + '%',
    followerGrowth: '+' + followerGrowth.toLocaleString(),
    topSource: 'Instagram',
    topCountry: 'USA',
  };
}

export function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
