const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ff = require('../tools/firefox-manifest.js');

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const built = ff.buildFromRepo();

test('background: service worker becomes background scripts with the imported libraries first', () => {
  assert.equal(built.background.service_worker, undefined);
  const scripts = built.background.scripts;
  assert.equal(scripts[scripts.length - 1], manifest.background.service_worker);
  assert.ok(scripts.length > 1, 'libraries found in the importScripts call');
  for (const s of scripts) assert.ok(fs.existsSync(path.join(ROOT, s)), s + ' exists');
  assert.ok(scripts.includes('src/lib/scoring.js') && scripts.includes('src/lib/urlmatch.js'));
});

test('background.js only calls importScripts where it exists (Firefox background scripts have none)', () => {
  const src = fs.readFileSync(path.join(ROOT, manifest.background.service_worker), 'utf8');
  assert.match(src, /typeof importScripts === 'function'\) importScripts\(/);
});

test('gecko settings: id, minimum versions and data-collection declaration', () => {
  const g = built.browser_specific_settings.gecko;
  assert.equal(g.id, ff.GECKO_ID);
  assert.match(g.id, /^[\w.-]+@[\w.-]+$/);
  assert.equal(g.strict_min_version, ff.FIREFOX_MIN);
  assert.ok(Number.parseFloat(g.strict_min_version) >= 140, 'data_collection_permissions needs Firefox 140+');
  assert.deepEqual(g.data_collection_permissions.required, ['browsingActivity']);
  assert.ok(built.browser_specific_settings.gecko_android.strict_min_version);
});

test('Chrome-only keys are dropped and everything else is kept', () => {
  assert.equal(built.minimum_chrome_version, undefined);
  assert.ok(built.author === undefined || typeof built.author === 'string');
  for (const k of ['version', 'name', 'description', 'permissions', 'host_permissions', 'content_scripts', 'action', 'options_ui', 'icons', 'default_locale']) {
    assert.deepEqual(built[k], manifest[k], k);
  }
  assert.equal(manifest.background.service_worker, 'src/background.js', 'source manifest is not modified');
});

test('backgroundImports parses the importScripts call', () => {
  assert.deepEqual(ff.backgroundImports("if (x) importScripts(\n 'lib/a.js', \"lib/b.js\"\n);"), ['src/lib/a.js', 'src/lib/b.js']);
  assert.deepEqual(ff.backgroundImports('// nothing'), []);
});
