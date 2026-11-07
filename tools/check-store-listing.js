/*
 * Consistency check between the extension and the Chrome Web Store kit in
 * store-listing/ (rule 1 of AGENTS.md). Exits non-zero with a list of problems.
 * Run: node tools/check-store-listing.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const problems = [];
const fail = (msg) => problems.push(msg);

const manifest = JSON.parse(read('manifest.json'));
// Resolve __MSG_key__ placeholders from the default locale, as Chrome does.
const defaultLocale = manifest.default_locale || 'en';
const messages = exists(`_locales/${defaultLocale}/messages.json`) ? JSON.parse(read(`_locales/${defaultLocale}/messages.json`)) : {};
for (const field of ['name', 'description']) {
  const m = String(manifest[field] || '').match(/^__MSG_(\w+)__$/);
  if (m) { if (!messages[m[1]]) fail(`manifest.json: ${field} references message "${m[1]}" missing from _locales/${defaultLocale}`); else manifest[field] = messages[m[1]].message; }
}
const listing = read('store-listing/listing.md');
const practices = read('store-listing/privacy-practices.md');
const policyMd = read('store-listing/privacy-policy.md');
const policyHtml = read('store-listing/privacy-policy.html');

function section(md, heading) {
  const lines = md.split('\n');
  const i = lines.findIndex((l) => l.startsWith('## ' + heading));
  if (i < 0) return null;
  const out = [];
  for (let j = i + 1; j < lines.length && !lines[j].startsWith('## '); j++) out.push(lines[j]);
  return out.join('\n').trim();
}

// --- listing.md -------------------------------------------------------------
const title = section(listing, 'Title');
if (!title) fail('listing.md: missing "## Title" section');
else {
  if (title.length > 45) fail(`listing.md: title is ${title.length} chars (max 45)`);
  if (!title.toLowerCase().includes(manifest.name.toLowerCase())) fail(`listing.md: title "${title}" does not contain the manifest name "${manifest.name}"`);
}
const summary = section(listing, 'Summary');
if (!summary) fail('listing.md: missing "## Summary" section');
else {
  if (summary.length > 132) fail(`listing.md: summary is ${summary.length} chars (max 132)`);
  if (summary !== manifest.description) fail('listing.md: summary differs from manifest.json description\n    listing : ' + summary + '\n    manifest: ' + manifest.description);
}
if (manifest.description.length > 132) fail(`manifest.json: description is ${manifest.description.length} chars (store max 132)`);
if (!new RegExp("^## What's new \\(version " + manifest.version.replace(/\./g, '\\.') + '\\)', 'm').test(listing)) fail(`listing.md: no "## What's new (version ${manifest.version})" section for the manifest version`);
if (!section(listing, 'Detailed description')) fail('listing.md: missing "## Detailed description" section');

// Feature claims in the description must be backed by code.
const desc = (section(listing, 'Detailed description') || '').toLowerCase();
const claims = [
  [/chat monitor/, 'src/lib/chatSchemes.js'],
  [/registered|registration date|domain age/, 'src/background.js', /rdap/i],
  [/portuguese/, 'src/lib/phrases.js', /\bpt:\s*\[/],
  [/spanish/, 'src/lib/phrases.js', /\bes:\s*\[/],
  [/french/, 'src/lib/phrases.js', /\bfr:\s*\[/],
];
for (const [claim, file, needle] of claims) {
  if (claim.test(desc)) {
    if (!exists(file)) fail(`listing.md claims "${claim.source}" but ${file} does not exist`);
    else if (needle && !needle.test(read(file))) fail(`listing.md claims "${claim.source}" but ${file} has no ${needle.source}`);
  }
}

// --- privacy-practices.md ---------------------------------------------------
const perms = [...(manifest.permissions || []), ...(manifest.optional_permissions || []), ...(manifest.host_permissions || [])];
for (const p of perms) {
  if (!practices.includes('`' + p + '`') && !practices.includes('`host_permissions: ' + p + '`')) fail(`privacy-practices.md: no justification for permission "${p}"`);
}
const justified = [...practices.matchAll(/\*\*`(?:host_permissions: )?([^`]+)`\*\*/g)].map((m) => m[1]);
for (const j of justified) {
  if (!perms.includes(j) && !/content scripts/i.test(j)) fail(`privacy-practices.md: justification for "${j}" but the manifest does not request it (stale entry)`);
}
if (!/Single purpose/i.test(practices)) fail('privacy-practices.md: missing single-purpose description');
if (!/Remote code/i.test(practices)) fail('privacy-practices.md: missing remote-code declaration');
if (!/Data usage/i.test(practices)) fail('privacy-practices.md: missing data-usage section');

// Network hosts the code talks to must be disclosed.
// Only URLs the code *requests* count: lines that merely assign a hyperlink (href) are user-facing links, not network calls.
const code = ['src/background.js', 'src/content.js', ...fs.readdirSync(path.join(ROOT, 'src/lib')).map((f) => 'src/lib/' + f)]
  .map(read).join('\n').split('\n').filter((line) => !/\.href\s*=|href:/.test(line)).join('\n');
const hosts = new Set([...code.matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})\//gi)].map((m) => m[1].toLowerCase()));
for (const h of hosts) {
  if (/^(www\.)?(github\.com|paypalobjects\.com)$/.test(h)) continue; // not contacted by the extension
  if (!policyMd.includes(h)) fail(`privacy-policy.md: code contacts ${h} but the policy does not mention it`);
  if (!practices.includes(h)) fail(`privacy-practices.md: code contacts ${h} but the permission justification does not mention it`);
}

// --- privacy policy md/html ---------------------------------------------------
const mdDate = (policyMd.match(/Last updated:\s*([^_\n]+)/) || [])[1];
const htmlDate = (policyHtml.match(/Last updated:\s*([^<\n]+)/) || [])[1];
if (!mdDate) fail('privacy-policy.md: missing "Last updated" line');
if (mdDate && htmlDate && mdDate.trim() !== htmlDate.trim()) fail(`privacy policy: HTML "last updated" (${htmlDate.trim()}) differs from Markdown (${mdDate.trim()}); regenerate the HTML`);
const mdHeadings = [...policyMd.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
for (const h of mdHeadings) if (!policyHtml.includes('<h2>' + h.replace(/&/g, '&amp;') + '</h2>')) fail(`privacy-policy.html: missing section "${h}" present in the Markdown; regenerate the HTML`);

// --- assets -----------------------------------------------------------------
function pngSize(p) {
  const b = fs.readFileSync(path.join(ROOT, p));
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const required = [['store-listing/assets/promo-small-440x280.png', 440, 280]];
const optional = [['store-listing/assets/promo-marquee-1400x560.png', 1400, 560]];
for (const [p, w, h] of required.concat(optional)) {
  if (!exists(p)) { if (required.some((r) => r[0] === p)) fail(`missing required asset ${p}`); continue; }
  const s = pngSize(p);
  if (!s || s[0] !== w || s[1] !== h) fail(`${p} is ${s ? s.join('x') : 'not a PNG'}, expected ${w}x${h}`);
}
const shots = fs.existsSync(path.join(ROOT, 'store-listing/assets')) ? fs.readdirSync(path.join(ROOT, 'store-listing/assets')).filter((f) => /^screenshot-/.test(f)) : [];
if (shots.length < 1) fail('store-listing/assets: at least one screenshot-*.png is required');
if (shots.length > 5) fail('store-listing/assets: the store accepts at most 5 screenshots');
for (const f of shots) {
  const s = pngSize('store-listing/assets/' + f);
  if (!s || !((s[0] === 1280 && s[1] === 800) || (s[0] === 640 && s[1] === 400))) fail(`store-listing/assets/${f} must be 1280x800 or 640x400 (is ${s ? s.join('x') : 'not a PNG'})`);
}
// Screenshots must be newer than the UI they show.
const uiFiles = ['popup/popup.html', 'popup/popup.css', 'popup/popup.js', 'options/options.html', 'options/options.js', 'src/content.js', 'icons/icon128.png'].filter(exists);
const newestUi = Math.max(...uiFiles.map((f) => fs.statSync(path.join(ROOT, f)).mtimeMs));
const oldestShot = Math.min(...shots.map((f) => fs.statSync(path.join(ROOT, 'store-listing/assets', f)).mtimeMs));
if (shots.length && process.env.CI !== 'true' && oldestShot + 1000 < newestUi) fail('store-listing/assets: UI files are newer than the screenshots; run `npm run store-assets` (set CI=true to skip this check)');

// --- icons --------------------------------------------------------------------
for (const [size, p] of Object.entries(manifest.icons || {})) {
  const s = pngSize(p);
  if (!s || s[0] !== Number(size) || s[1] !== Number(size)) fail(`${p} must be ${size}x${size}`);
}

if (problems.length) {
  console.error('store-listing is out of sync with the extension:\n');
  for (const p of problems) console.error(' - ' + p);
  console.error('\nSee AGENTS.md, rule 1.');
  process.exit(1);
}
console.log('store-listing is consistent with the extension (' + perms.length + ' permissions justified, ' + shots.length + ' screenshots).');
