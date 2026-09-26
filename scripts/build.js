// Build script for Vercel static asset export
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    for (const item of items) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('📦 Preparing static assets for Vercel in public/...');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Copy top-level static files
['index.html', 'manifest.json', 'sw.js'].forEach(file => {
  const src = path.join(ROOT_DIR, file);
  const dest = path.join(PUBLIC_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied ${file}`);
  }
});

// Copy directories
['css', 'js', 'assets'].forEach(dir => {
  const src = path.join(ROOT_DIR, dir);
  const dest = path.join(PUBLIC_DIR, dir);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
    console.log(`  ✓ Copied ${dir}/`);
  }
});

console.log('✨ Static assets successfully bundled to public/ for Vercel CDN deployment!');
