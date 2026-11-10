// Derives the Firefox manifest from manifest.json, so one source tree ships to
// both browsers. Used by tools/package.js and test/firefoxManifest.test.js.
//
// Differences from the Chrome manifest:
// - Firefox runs MV3 background code as a non-persistent background script,
//   not a service worker, and has no importScripts there: the libraries that
//   src/background.js imports are listed in background.scripts instead.
// - browser_specific_settings.gecko carries the add-on ID (required by AMO for
//   MV3), the minimum Firefox version and the data-collection declaration.
// - Chrome-only keys (minimum_chrome_version, author as an object) are removed.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const GECKO_ID = 'scam-detector@neteinstein.github.io';
const FIREFOX_MIN = '140.0';          // ESR 140: first version that reads data_collection_permissions
const FIREFOX_ANDROID_MIN = '142.0';
// Domain names go to rdap.org (on by default) and, with the user's own key, page
// addresses go to Google Safe Browsing: both are "browsing activity" in AMO terms.
const DATA_COLLECTION = { required: ['browsingActivity'] };

// The scripts src/background.js loads with importScripts(...), as paths from the repo root.
function backgroundImports(source) {
  const m = source.match(/importScripts\(([^)]*)\)/);
  if (!m) return [];
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => path.posix.join('src', x[1]));
}

function firefoxManifest(manifest, backgroundSource) {
  const out = JSON.parse(JSON.stringify(manifest));
  const worker = out.background && out.background.service_worker;
  if (worker) out.background = { scripts: [...backgroundImports(backgroundSource || ''), worker] };
  delete out.minimum_chrome_version;
  if (out.author && typeof out.author !== 'string') delete out.author;
  out.browser_specific_settings = {
    gecko: { id: GECKO_ID, strict_min_version: FIREFOX_MIN, data_collection_permissions: DATA_COLLECTION },
    gecko_android: { strict_min_version: FIREFOX_ANDROID_MIN },
  };
  return out;
}

function buildFromRepo() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const bg = manifest.background && manifest.background.service_worker;
  const source = bg ? fs.readFileSync(path.join(ROOT, bg), 'utf8') : '';
  return firefoxManifest(manifest, source);
}

module.exports = { firefoxManifest, backgroundImports, buildFromRepo, GECKO_ID, FIREFOX_MIN, FIREFOX_ANDROID_MIN, DATA_COLLECTION };

if (require.main === module) process.stdout.write(JSON.stringify(buildFromRepo(), null, 2) + '\n');
