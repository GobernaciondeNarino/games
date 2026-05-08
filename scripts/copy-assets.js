// Ensures public/models/RobotExpressive.glb exists.
// The npm three package no longer bundles example models, so we fetch
// the canonical GLB from the three.js GitHub repo (matching the
// installed three version) the first time it's missing.
import { mkdirSync, existsSync, createWriteStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { get } from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const destDir = resolve(root, 'public/models');
const dest = resolve(destDir, 'RobotExpressive.glb');

if (existsSync(dest)) {
  console.log('[copy-assets] RobotExpressive.glb already in place.');
  process.exit(0);
}

let tag = 'r160';
try {
  const require = createRequire(import.meta.url);
  const v = require('three/package.json').version; // e.g. "0.160.1"
  const major = v.split('.')[1];
  if (major) tag = `r${major}`;
} catch { /* fall back to r160 */ }

const url = `https://raw.githubusercontent.com/mrdoob/three.js/${tag}/examples/models/gltf/RobotExpressive/RobotExpressive.glb`;
mkdirSync(destDir, { recursive: true });

console.log(`[copy-assets] Fetching ${url}`);
const fetchTo = (target, redirectsLeft = 3) => new Promise((ok, bad) => {
  get(target, (res) => {
    if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
      res.resume();
      fetchTo(res.headers.location, redirectsLeft - 1).then(ok, bad);
      return;
    }
    if (res.statusCode !== 200) { bad(new Error(`HTTP ${res.statusCode}`)); return; }
    const ws = createWriteStream(dest);
    res.pipe(ws);
    ws.on('finish', () => ws.close(() => ok()));
    ws.on('error', bad);
  }).on('error', bad);
});

fetchTo(url).then(() => {
  console.log('[copy-assets] Saved →', dest);
}).catch((err) => {
  console.warn('[copy-assets] Could not fetch GLB:', err.message);
  // Don't fail install; user can drop the file in manually.
});
