// Prints the release notes for the current manifest version: the matching
// "What's new" section of store-listing/listing.md plus install instructions.
// Used by .github/workflows/release.yml. Run: node tools/release-notes.js
const fs = require('fs');
const { FIREFOX_MIN, FIREFOX_ANDROID_MIN } = require('./firefox-manifest');
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

Two packages are attached, built from the same code:

- **scam-detector-${version}-chrome.zip**: Chrome, Edge, Brave and other Chromium browsers.
- **scam-detector-${version}-firefox.zip**: Firefox ${FIREFOX_MIN.replace(/\.0$/, '')}+ (desktop) and ${FIREFOX_ANDROID_MIN.replace(/\.0$/, '')}+ (Android).

**Chrome / Chromium**

1. Download the Chrome zip and unzip it.
2. Open \`chrome://extensions\` and enable **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.

**Firefox**

Release builds of Firefox only install add-ons signed by Mozilla, so for everyday use install Scam Detector from Firefox Add-ons once it is listed there. To try this build: open \`about:debugging#/runtime/this-firefox\`, click **Load Temporary Add-on…** and pick the Firefox zip (it stays until Firefox restarts). The same zip is what gets uploaded to Firefox Add-ons.

Verify the downloads against \`SHA256SUMS.txt\`.
`);
