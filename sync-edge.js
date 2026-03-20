// sync-edge.js
// Syncs the dist/ folder into the Apex-Revenue-Edge repo after every build.
// Run automatically via `npm run build`.

const fs   = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, 'dist');
const EDGE = path.resolve(__dirname, '..', 'apex-revenue-edge', 'Apex Revenue Edge');

if (!fs.existsSync(EDGE)) {
  console.warn('[sync-edge] Edge repo not found at:', EDGE);
  console.warn('[sync-edge] Skipping sync — check the path if this is unexpected.');
  process.exit(0);
}

// Files to copy from dist/ to Edge repo
const FILES = [
  'apex-config.js',
  'array.full.no-external.js',
  'auth.js',
  'background.js',
  'content.js',
  'overlay.css',
  'overlay.html',
  'overlay.js',
  'popout.js',
  'popup.css',
  'popup.html',
  'posthog-recorder.js',
  'recovery.html',
  'recovery.js',
];

// Copy individual files
FILES.forEach(function(file) {
  const src  = path.join(DIST, file);
  const dest = path.join(EDGE, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('[sync-edge] copied:', file);
  } else {
    console.warn('[sync-edge] missing:', file);
  }
});

// Copy icons folder
const iconsSrc  = path.join(DIST, 'icons');
const iconsDest = path.join(EDGE, 'icons');
if (fs.existsSync(iconsSrc)) {
  if (!fs.existsSync(iconsDest)) fs.mkdirSync(iconsDest, { recursive: true });
  fs.readdirSync(iconsSrc).forEach(function(file) {
    fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDest, file));
  });
  console.log('[sync-edge] copied: icons/');
}

// Copy manifest but strip the "key" field for Edge store compliance
const manifestSrc = path.join(DIST, 'manifest.json');
const manifestDest = path.join(EDGE, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  var manifest = JSON.parse(fs.readFileSync(manifestSrc, 'utf8'));
  delete manifest.key;
  // Enforce Edge description length limit (132 chars)
  if (manifest.description && manifest.description.length > 132) {
    manifest.description = manifest.description.slice(0, 129) + '...';
  }
  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2) + '\n');
  console.log('[sync-edge] copied: manifest.json (key removed)');
}

console.log('[sync-edge] Sync complete →', EDGE);
