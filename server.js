// Snack Detective By Devdarsh - Server-side Gemini AI Vision Server
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

// Pre-load static assets into memory with explicit static paths.
// This guarantees that Vercel's Node File Tracer (@vercel/nft) bundles all frontend files into the lambda artifact.
const STATIC_ASSETS = {
  '/': {
    content: fs.readFileSync(path.join(__dirname, 'index.html')),
    type: 'text/html; charset=UTF-8'
  },
  '/index.html': {
    content: fs.readFileSync(path.join(__dirname, 'index.html')),
    type: 'text/html; charset=UTF-8'
  },
  '/manifest.json': {
    content: fs.readFileSync(path.join(__dirname, 'manifest.json')),
    type: 'application/json'
  },
  '/sw.js': {
    content: fs.readFileSync(path.join(__dirname, 'sw.js')),
    type: 'application/javascript; charset=UTF-8'
  },
  '/css/style.css': {
    content: fs.readFileSync(path.join(__dirname, 'css', 'style.css')),
    type: 'text/css; charset=UTF-8'
  },
  '/js/app.js': {
    content: fs.readFileSync(path.join(__dirname, 'js', 'app.js')),
    type: 'application/javascript; charset=UTF-8'
  },
  '/js/model.js': {
    content: fs.readFileSync(path.join(__dirname, 'js', 'model.js')),
    type: 'application/javascript; charset=UTF-8'
  },
  '/js/audio.js': {
    content: fs.readFileSync(path.join(__dirname, 'js', 'audio.js')),
    type: 'application/javascript; charset=UTF-8'
  },
  '/js/confetti.js': {
    content: fs.readFileSync(path.join(__dirname, 'js', 'confetti.js')),
    type: 'application/javascript; charset=UTF-8'
  },
  '/js/storage.js': {
    content: fs.readFileSync(path.join(__dirname, 'js', 'storage.js')),
    type: 'application/javascript; charset=UTF-8'
  },
  '/assets/detective_pip.jpg': {
    content: fs.readFileSync(path.join(__dirname, 'assets', 'detective_pip.jpg')),
    type: 'image/jpeg'
  },
  '/assets/sample_healthy.jpg': {
    content: fs.readFileSync(path.join(__dirname, 'assets', 'sample_healthy.jpg')),
    type: 'image/jpeg'
  },
  '/assets/sample_treat.jpg': {
    content: fs.readFileSync(path.join(__dirname, 'assets', 'sample_treat.jpg')),
    type: 'image/jpeg'
  }
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

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
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
          try {
            fs.writeFileSync(ENV_FILE, `# Snack Detective Server-side Configuration\nGEMINI_API_KEY=${trimmed}\n`);
          } catch (writeErr) {
            console.warn('Could not write to local .env (read-only environment):', writeErr.message);
          }
          process.env.GEMINI_API_KEY = trimmed;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Gemini key updated successfully!' }));
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

  // Serve static files from memory cache (Zero-latency, 100% reliable on Vercel)
  const asset = STATIC_ASSETS[pathname] || STATIC_ASSETS[pathname.replace(/\/$/, '')] || STATIC_ASSETS['/index.html'];

  if (asset) {
    res.writeHead(200, {
      'Content-Type': asset.type,
      'Cache-Control': pathname === '/' || pathname.endsWith('.html') ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(asset.content);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('File Not Found');
});

// Export server handler for serverless environments (Vercel / Lambda)
module.exports = server;

// Start listening if run directly (node server.js)
if (require.main === module) {
  server.listen(PORT, () => {
    const key = getServerApiKey();
    console.log(`🔍 Snack Detective server running at http://localhost:${PORT}`);
    console.log(`🤖 Primary Server-Side Gemini Key: ${key ? 'Configured (' + key.substring(0, 6) + '...)' : 'Not set in .env'}`);
    console.log(`✨ BYOK (Bring Your Own Key) Support: Enabled via Settings & Headers`);
  });
}
