// Prints the release notes for the current manifest version: the matching
// "What's new" section of store-listing/listing.md plus install instructions.
// Used by .github/workflows/release.yml. Run: node tools/release-notes.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')).version;
const listing = fs.readFileSync(path.join(ROOT, 'store-listing', 'listing.md'), 'utf8');

function whatsNew(md, v) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.startsWith("## What's new (version " + v + ')'));
  if (start < 0) return null;
  const out = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) out.push(lines[i]);
  return out.join('\n').trim();
}

const notes = whatsNew(listing, version) || `Version ${version}`;
process.stdout.write(`${notes}

## Install

1. Download **scam-detector-${version}.zip** below and unzip it.
2. Open \`chrome://extensions\` and enable **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.

Verify the download against \`SHA256SUMS.txt\`.
`);
