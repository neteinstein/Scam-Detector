// Runs the domain checks over the most visited websites to catch false alarms
// before they ship: a real site such as amazon.ae must never be called fake.
// Used by the update-scam-catalogue skill after every catalogue change.
//
//   node tools/top-sites-sweep.js --list <tranco.csv> [--top 200000] [--check]
//
// Download the list with
//   curl -sSL -o top.zip https://tranco-list.eu/top-1m.csv.zip && unzip top.zip
//
// Every site is scored twice: as a long-registered domain with no page (the
// address alone must not warn), and as its own sign-in page with an unknown
// domain age (many country registries publish none) and a title naming the
// site ("Amazon.ae - Sign in"), which is how amazon.ae was once called fake.
// --check exits 1 when a site in the top 10,000 warns in either case.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const scoring = require(path.join(ROOT, 'src/lib/scoring.js'));
const pageSignals = require(path.join(ROOT, 'src/lib/pageSignals.js'));

function ownLoginPage(host) {
  const title = `${host.replace(/^www\./, '')} - Sign in`;
  return {
    isHttps: true, title, siteName: '', headings: '', hasPasswordField: true, hasCardField: false, hasSeedPhraseField: false,
    forms: [], titleBrands: pageSignals.brandsInText(title), bodyBrandCounts: {}, brandAssets: [], phrases: [], links: {},
  };
}

const args = process.argv.slice(2);
const opt = (name, dflt) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : dflt);
const listPath = opt('--list');
const top = Number(opt('--top', 200000));
const check = args.includes('--check');
const STRICT_TOP = 10000;
// Popular names that are look-alikes on purpose or unverified, and should keep warning
// with a sign-in form. Review this list when the check fails; do not add real sites here.
const EXPECTED_SUSPICIOUS = new Set(['googll.store', 'oneidrive.org', 'binance.info', 'facebook-hardware.com']);

if (!listPath) {
  console.error('usage: node tools/top-sites-sweep.js --list <tranco top-1m.csv> [--top N] [--check]');
  process.exit(2);
}

const warn = scoring.DEFAULT_SETTINGS.warnThreshold;
const warnings = [];
const loginWarnings = [];
const byBrand = new Map();
let n = 0;
let impersonations = 0;
let namesakes = 0;

for (const line of fs.readFileSync(listPath, 'utf8').split('\n')) {
  const [rankText, host] = line.trim().split(',');
  const rank = Number(rankText);
  if (!host || !rank) continue;
  if (rank > top) break;
  n++;
  const r = scoring.evaluate({ hostname: host, ageDays: 4000, rdapStatus: 'ok' }, null, {});
  if (r.namesake) namesakes++;
  if (r.score >= warn) warnings.push({ rank, host, score: r.score, signals: r.signals.map((s) => s.id).join(',') });
  const lr = scoring.evaluate({ hostname: host, ageDays: null, rdapStatus: 'unknown' }, ownLoginPage(host), {});
  if (lr.score >= warn) loginWarnings.push({ rank, host, score: lr.score, signals: lr.signals.map((s) => s.id).join(',') });
  const la = r.lookalike;
  if (la) {
    impersonations++;
    if (!byBrand.has(la.brand)) byBrand.set(la.brand, []);
    byBrand.get(la.brand).push(`${rank}:${host}`);
  }
}

console.log(`Top-sites sweep: ${n} sites`);
console.log(`  reach the warning level on the domain alone: ${warnings.length}`);
console.log(`  treated as a brand's namesake / country site: ${namesakes}`);
console.log(`  flagged as impersonating a brand:            ${impersonations}`);
console.log(`  warn with their own sign-in page:            ${loginWarnings.length}`);
for (const w of warnings.slice(0, 50)) console.log(`  WARN #${w.rank} ${w.host} score ${w.score} (${w.signals})`);
for (const w of loginWarnings.slice(0, 50)) console.log(`  LOGIN-WARN #${w.rank} ${w.host} score ${w.score} (${w.signals})`);
console.log('Impersonation hits by brand (real sites here need their domain in brands.js, or UNRELATED_DOMAINS):');
for (const [brand, hosts] of [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(hosts.length).padStart(4)}  ${brand}: ${hosts.slice(0, 12).join(' ')}${hosts.length > 12 ? ' …' : ''}`);
}

const strict = warnings.concat(loginWarnings).filter((w) => w.rank <= STRICT_TOP && !EXPECTED_SUSPICIOUS.has(w.host));
if (check && strict.length) {
  console.error(`${strict.length} site(s) in the top ${STRICT_TOP} reach the warning level: ${strict.map((w) => w.host).join(', ')}`);
  process.exit(1);
}
