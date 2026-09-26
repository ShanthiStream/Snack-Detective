const { callGeminiPipChat } = require('../lib/gemini');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { question, snackName, verdict, apiKey } = body || {};
    const headerKey = req.headers['x-gemini-key'];
    const effectiveKey = apiKey || headerKey;
    const answer = await callGeminiPipChat(question, snackName, verdict, effectiveKey);
    return res.status(200).json({ success: true, answer });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
