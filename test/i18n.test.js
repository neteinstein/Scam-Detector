const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const scoring = require('../src/lib/scoring.js');
const phrases = require('../src/lib/phrases.js');
const chat = require('../src/lib/chatSchemes.js');
const lookalike = require('../src/lib/lookalike.js');
const i18n = require('../src/lib/i18n.js');

const ROOT = path.join(__dirname, '..');
const LANGS = ['en', 'pt', 'es', 'fr'];
const load = (l) => JSON.parse(fs.readFileSync(path.join(ROOT, '_locales', l, 'messages.json'), 'utf8'));
const en = load('en');
const placeholders = (s) => (String(s).match(/\$\d/g) || []).sort().join('');

test('all locales have the same keys with the same placeholders', () => {
  for (const l of LANGS.slice(1)) {
    const m = load(l);
    assert.deepEqual(Object.keys(m).sort(), Object.keys(en).sort(), `key set of ${l}`);
    for (const k of Object.keys(en)) {
      assert.ok(m[k].message && m[k].message.trim(), `${l}.${k} is empty`);
      assert.equal(placeholders(m[k].message), placeholders(en[k].message), `${l}.${k} placeholders`);
    }
  }
});

test('manifest, phrase categories, chat schemes and lookalike evidence have messages', () => {
  assert.ok(en.extName && en.extDesc);
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.name, '__MSG_extName__');
  for (const cat of Object.keys(phrases.CATEGORIES)) assert.ok(en['phrase_' + cat], 'phrase_' + cat);
  for (const s of chat.SCHEMES) { const k = 'chat_' + s.id.replace(/-/g, '_'); assert.ok(en[k + '_title'], k + '_title'); assert.ok(en[k + '_advice'], k + '_advice'); }
  for (const k of ['chat_phishing_link_title', 'chat_phishing_link_advice', 'chat_external_link_title', 'chat_external_link_advice']) assert.ok(en[k], k);
  for (const h of ['paypa1.com', 'paypal-secure-login.com', 'micros0ft-support.live', 'gooogle.com', 'amazon-de.top']) {
    const r = lookalike.detect(h);
    assert.ok(r.evidenceKey && en[r.evidenceKey], `${h}: ${r.evidenceKey}`);
  }
});

test('every signal the scorer can emit has a message key in every locale', () => {
  const page = {
    isHttps: false, title: 'Log in to PayPal', headings: '', hasPasswordField: true, hasCardField: true, hasSeedPhraseField: true, hasHiddenPasswordField: true,
    forms: [{ actionHost: 'evil.top', crossDomain: true, hasPassword: true, hasCard: false, actionIsHttp: true, method: 'get' }], crossOriginFrames: 4,
    titleBrands: ['PayPal'], bodyBrandCounts: { PayPal: 9 }, brandAssets: [{ brand: 'PayPal', host: 'paypalobjects.com', kind: 'favicon' }, { brand: 'PayPal', host: 'paypalobjects.com', kind: 'image' }],
    phrases: phrases.scan('your account has been suspended. congratulations you have won. double your bitcoin. your computer is infected. pay only with gift cards. your package is on hold. fee of $1.99. 100% safe. guaranteed returns. pay the processing fee to release your funds. guaranteed loan approval, no credit check. earn up to $3,000 per week working from home no experience required. refund the difference. next of kin. our escrow agent will hold the funds'),
    links: { total: 10, dead: 9, mismatched: 2, mismatchedSamples: ['a → b'] }, contextMenuBlocked: true, fakeBadges: 2, textLength: 1000, externalMetaRefresh: 'x.com',
  };
  const results = [
    scoring.evaluate({ hostname: 'paypa1-secure-login-verify.account-update.xyz', ageDays: 3, registrationDate: '2026-11-04', phishReport: { kind: 'host', count: 3 }, safeBrowsing: { threats: ['MALWARE'] } }, page, {}),
    scoring.evaluate({ hostname: 'xn--80ak6aa92e.com', ageDays: 400, phishReport: { kind: 'url', count: 1, target: 'Apple' } }, page, {}),
    scoring.evaluate({ hostname: '93.184.216.34', ageDays: null }, page, {}),
    scoring.evaluate({ hostname: 'abcdefghijklmnop-qrst-uvwx-yz.github.io', ageDays: 20, phishReport: { kind: 'host', count: 1 } }, Object.assign({}, page, { isHttps: true }), {}),
    scoring.evaluate({ hostname: 'a.b.c.d.e.some-very-long-hostname-for-testing-purposes-here.com', ageDays: 100 }, page, {}),
  ];
  const seen = new Set();
  for (const r of results) for (const s of r.signals) {
    seen.add(s.id);
    assert.ok(s.key, `${s.id} has no key`);
    for (const l of LANGS) { const m = load(l); assert.ok(m[s.key], `${l}: missing ${s.key} (signal ${s.id})`); if (s.detailKey) assert.ok(m[s.detailKey], `${l}: missing ${s.detailKey}`); if (s.ageKey) assert.ok(m[s.ageKey], `${l}: missing ${s.ageKey}`); if (s.typeKey) assert.ok(m[s.typeKey], `${l}: missing ${s.typeKey}`); }
    // argument count must match the placeholders in the message
    const n = Math.max(0, ...(en[s.key].message.match(/\$(\d)/g) || []).map((x) => Number(x[1]))); // highest placeholder index
    const provided = s.id === 'domain-age' || s.id === 'safe-browsing' ? 1 : s.args.length;
    assert.ok(provided >= n, `${s.id}: message needs ${n} args, signal provides ${provided}`);
  }
  assert.ok(seen.size >= 35, `only ${seen.size} distinct signals exercised`);
});

test('i18n helper falls back to English outside Chrome', () => {
  assert.equal(i18n.t('verdict_danger', [], 'Likely a scam'), 'Likely a scam');
  const r = scoring.evaluate({ hostname: 'paypa1.com', ageDays: 3, registrationDate: '2026-11-04' }, { isHttps: true, hasPasswordField: true, forms: [], titleBrands: [], bodyBrandCounts: {}, brandAssets: [], phrases: [], links: {} }, {});
  const age = r.signals.find((s) => s.id === 'domain-age');
  assert.equal(i18n.signalLabel(age), age.label);
  assert.equal(i18n.signalDetail(age), 'Registered 2026-11-04');
});

test('plain-language variants have a base message and the same placeholders', () => {
  for (const l of LANGS) {
    const m = load(l);
    for (const k of Object.keys(m).filter((x) => x.endsWith('_plain'))) {
      const base = k.slice(0, -'_plain'.length);
      assert.ok(m[base], `${l}.${k} has no base message ${base}`);
      assert.equal(placeholders(m[k].message), placeholders(m[base].message), `${l}.${k} placeholders`);
    }
  }
  assert.ok(Object.keys(en).filter((x) => x.endsWith('_plain')).length >= 100, 'plain variants cover the UI');
});

test('plain mode prefers <key>_plain and falls back to <key>', () => {
  const msgs = { sig_no_https: 'Connection is not encrypted (HTTP)', sig_no_https_plain: 'The connection is not secure', verdict_danger: 'Likely a scam' };
  const prev = global.chrome;
  global.chrome = { i18n: { getMessage: (k) => msgs[k] || '' } };
  try {
    i18n.setPlain(true);
    assert.equal(i18n.t('sig_no_https'), 'The connection is not secure');
    assert.equal(i18n.t('verdict_danger'), 'Likely a scam');
    i18n.setPlain(false);
    assert.equal(i18n.t('sig_no_https'), 'Connection is not encrypted (HTTP)');
  } finally { i18n.setPlain(true); global.chrome = prev; }
});
