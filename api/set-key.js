module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    success: true,
    message: 'To set a permanent server-side key on Vercel, add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables, or use BYOK in Settings (⚙️)!'
  });
};
