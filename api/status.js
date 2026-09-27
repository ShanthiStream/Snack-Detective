const { getServerApiKey } = require('../lib/gemini');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const key = getServerApiKey();
  return res.status(200).json({
    hasServerKey: Boolean(key && key.length > 5),
    serverKeyPreview: key ? `${key.substring(0, 6)}...` : null,
    model: 'AI Vision Engine'
  });
};
