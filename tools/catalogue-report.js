// Prints the state of the scam catalogue and how stale it is. Used by the
// update-scam-catalogue skill. Options: --feed <phishtank.csv> --check (exit 1 if stale)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const brands = require(path.join(ROOT, 'src/lib/brands.js'));
const tlds = require(path.join(ROOT, 'src/lib/tlds.js'));
const phrases = require(path.join(ROOT, 'src/lib/phrases.js'));
const chat = require(path.join(ROOT, 'src/lib/chatSchemes.js'));
const um = require(path.join(ROOT, 'src/lib/urlmatch.js'));

const STALE_DAYS = 30;
const args = process.argv.slice(2);
const feedArg = args.indexOf('--feed') >= 0 ? args[args.indexOf('--feed') + 1] : null;
const check = args.includes('--check');

const review = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalogue/last-review.json'), 'utf8'));
const ageDays = Math.floor((Date.now() - Date.parse(review.reviewedAt)) / 86400000);

let patterns = 0; const perLang = {};
for (const cfg of Object.values(phrases.CATEGORIES)) for (const l of phrases.LANGS) { const n = (cfg[l] || []).length; patterns += n; perLang[l] = (perLang[l] || 0) + n; }
let chatPatterns = 0;
for (const s of chat.SCHEMES) for (const l of phrases.LANGS) chatPatterns += (s[l] || []).length;

console.log('Scam catalogue');
console.log(`  brands:          ${brands.BRANDS.length} (${brands.BRANDS.reduce((a, b) => a + b.domains.length, 0)} real domains)`);
console.log(`  risky TLDs:      ${Object.keys(tlds.WEIGHTS).length}`);
console.log(`  phrase patterns: ${patterns} in ${Object.keys(phrases.CATEGORIES).length} categories (${Object.entries(perLang).map(([l, n]) => l + ' ' + n).join(', ')})`);
console.log(`  chat schemes:    ${chat.SCHEMES.length} (${chatPatterns} patterns), ${chat.MARKETPLACES.length} marketplaces`);
console.log(`  shared hosts:    ${um.SHARED_HOSTS.size}`);
console.log(`  last review:     ${review.reviewedAt} (${ageDays} days ago)${ageDays > STALE_DAYS ? '  <-- STALE, run /update-scam-catalogue' : ''}`);

// Language coverage: every category must have all four languages.
const gaps = [];
for (const [cat, cfg] of Object.entries(phrases.CATEGORIES)) for (const l of phrases.LANGS) if (!(cfg[l] || []).length) gaps.push(`phrases.${cat}.${l}`);
for (const s of chat.SCHEMES) for (const l of phrases.LANGS) if (!(s[l] || []).length) gaps.push(`chat.${s.id}.${l}`);
if (gaps.length) console.log('  language gaps:   ' + gaps.join(', '));

if (feedArg) {
  const recs = um.parsePhishTankCsv(fs.readFileSync(feedArg, 'utf8'));
  const targets = {};
  for (const r of recs) if (r.target && r.target !== 'Other') targets[r.target] = (targets[r.target] || 0) + 1;
  const clean = (name) => {
    let n = String(name).replace(/&amp;/g, '&').replace(/&[a-z]+;/g, '');
    try { n = Buffer.from(n, 'latin1').toString('utf8').includes('\ufffd') ? n : Buffer.from(n, 'latin1').toString('utf8'); } catch (e) { /* ignore */ }
    try { n = n.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { /* ignore */ }
    return n.toLowerCase();
  };
  const ALIASES = { 'internal revenue service': 'irs', 'british telecom': 'bt', 'banco bilbao vizcaya argentaria': 'bbva', 'at&t': 'att', 'abonne free mobile': 'freemobile', 'development bank of singapore': 'dbs', 'volksbanken raiffeisenbanken': 'raiffeisen', 'das kann bank': 'commerzbank', 'sumitomo mitsui banking corporation': 'smbc' };
  const known = new Set(brands.BRANDS.map((b) => clean(b.name)));
  const keywords = new Set(brands.BRANDS.flatMap((b) => b.keywords.concat(b.domains.map((d) => d.split('.')[0]))));
  const missing = Object.entries(targets).sort((a, b) => b[1] - a[1]).filter(([name]) => {
    const c = clean(name);
    const n = (ALIASES[c] || c).replace(/[^a-z0-9]/g, '');
    return !known.has(c) && !keywords.has(n) && !Array.from(keywords).some((k) => k.length >= 4 && (n.includes(k) || k.includes(n)));
  }).slice(0, 25);
  console.log(`\nPhishTank feed: ${recs.length} verified URLs. Most-targeted brands missing from brands.js:`);
  for (const [name, n] of missing) console.log(`  ${String(n).padStart(5)}  ${name}`);
  const hosts = {};
  for (const r of recs) { const h = um.hostOf(um.normalizeUrl(r.url) || ''); if (h) hosts[h] = (hosts[h] || 0) + 1; }
  const bigUnknown = Object.entries(hosts).filter(([h, n]) => n >= 50 && !um.isSharedHost(h)).sort((a, b) => b[1] - a[1]).slice(0, 15);
  if (bigUnknown.length) { console.log('Hosts with 50+ reports not in SHARED_HOSTS (check whether they are shared platforms):'); for (const [h, n] of bigUnknown) console.log(`  ${String(n).padStart(5)}  ${h}`); }
}

if (check && (ageDays > STALE_DAYS || gaps.length)) { console.error(`\ncatalogue check failed: ${ageDays > STALE_DAYS ? 'review is stale' : ''} ${gaps.length ? 'language gaps' : ''}`); process.exit(1); }
