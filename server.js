// Snack Detective By Devdarsh - Server-side Gemini AI Vision Server (Local Development)
const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  getServerApiKey,
  getEffectiveApiKey,
  callGeminiVision,
  callGeminiPipChat
} = require('./lib/gemini');

const PORT = process.env.PORT || 8080;
const ENV_FILE = path.join(__dirname, '.env');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const headerApiKey = req.headers['x-gemini-key'] || null;

  // API 1: Server Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const serverKey = getServerApiKey();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      hasServerKey: Boolean(serverKey && serverKey.length > 5),
      serverKeyPreview: serverKey ? `${serverKey.substring(0, 6)}...` : null,
      model: 'Google Gemini Multimodal Vision (Primary Server + BYOK)'
    }));
    return;
  }

  // API 2: Set / Update Gemini Key on Server (.env)
  if (pathname === '/api/set-key' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { apiKey } = JSON.parse(body);
        if (apiKey) {
          const trimmed = apiKey.trim();
          fs.writeFileSync(ENV_FILE, `# Snack Detective Server-side Configuration\nGEMINI_API_KEY=${trimmed}\n`);
          process.env.GEMINI_API_KEY = trimmed;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Primary Gemini key saved successfully to server (.env)' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API key is required' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API 3: Detect Snack via Gemini Vision (Primary Server Key or BYOK)
  if (pathname === '/api/detect-snack' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { image, apiKey } = JSON.parse(body);
        if (!image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Image data is required' }));
          return;
        }

        const effectiveKey = apiKey || headerApiKey;
        const result = await callGeminiVision(image, effectiveKey);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (err) {
        console.error('Detection error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API 4: Ask Detective Pip
  if (pathname === '/api/ask-pip' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { question, snackName, verdict, apiKey } = JSON.parse(body);
        const effectiveKey = apiKey || headerApiKey;
        const reply = await callGeminiPipChat(question, snackName, verdict, effectiveKey);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, answer: reply }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve static files
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(__dirname, relativePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  const key = getServerApiKey();
  console.log(`🔍 Snack Detective server running at http://localhost:${PORT}`);
  console.log(`🤖 Primary Server-Side Gemini Key: ${key ? 'Configured (' + key.substring(0, 6) + '...)' : 'Not set in .env'}`);
  console.log(`✨ BYOK (Bring Your Own Key) Support: Enabled via Settings & Headers`);
});
