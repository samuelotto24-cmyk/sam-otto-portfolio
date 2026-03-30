export default async function handler(req, res) {
  const keys = Object.keys(process.env).filter(k => 
    k.includes('ANTHROPIC') || k.includes('DATABASE') || k.includes('BLOB') || k.includes('RESEND')
  );
  return res.status(200).json({ envKeys: keys });
}
