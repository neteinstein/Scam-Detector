const test = require('node:test');
const assert = require('node:assert/strict');
const scoring = require('../src/lib/scoring.js');
const phrases = require('../src/lib/phrases.js');

function page(overrides) {
  return Object.assign({
    isHttps: true, title: '', siteName: '', headings: '', hasPasswordField: false, hasCardField: false, hasSeedPhraseField: false,
    hasHiddenPasswordField: false, forms: [], crossOriginFrames: 0, titleBrands: [], bodyBrandCounts: {}, brandAssets: [], phrases: [],
    links: { total: 0, dead: 0, mismatched: 0, mismatchedSamples: [] }, contextMenuBlocked: false, fakeBadges: 0, textLength: 1000, externalMetaRefresh: '',
  }, overrides || {});
}
const ids = (r) => r.signals.map((s) => s.id);

test('known brand domains are trusted and local hosts skipped', () => {
  assert.equal(scoring.evaluate({ hostname: 'www.paypal.com' }, page(), {}).verdict, 'trusted');
  assert.equal(scoring.evaluate({ hostname: 'localhost' }, page(), {}).verdict, 'skipped');
  assert.equal(scoring.evaluate({ hostname: '192.168.0.10' }, page(), {}).verdict, 'skipped');
});

test('user allowlist wins', () => {
  const r = scoring.evaluate({ hostname: 'paypa1.com', ageDays: 2 }, page({ hasPasswordField: true }), { allowlist: ['paypa1.com'] });
  assert.equal(r.verdict, 'trusted');
  assert.equal(r.reason, 'allowlist');
});

test('ordinary established site scores ok', () => {
  const r = scoring.evaluate({ hostname: 'mindera.com', ageDays: 4000, rdapStatus: 'ok' }, page({ links: { total: 50, dead: 1, mismatched: 0, mismatchedSamples: [] } }), {});
  assert.equal(r.verdict, 'ok');
  assert.equal(r.score, 0);
});

test('a news article mentioning PayPal on an old domain is not flagged', () => {
  const r = scoring.evaluate({ hostname: 'news-site.com', ageDays: 3000, rdapStatus: 'ok' }, page({ title: 'PayPal raises fees', titleBrands: ['PayPal'], bodyBrandCounts: { PayPal: 12 } }), {});
  assert.equal(r.verdict, 'ok');
  assert.ok(r.score < 35, `score ${r.score}`);
});

test('fresh lookalike domain with login form is danger', () => {
  const r = scoring.evaluate({ hostname: 'paypal-secure-login.xyz', ageDays: 3, registrationDate: '2026-11-04', rdapStatus: 'ok' },
    page({ hasPasswordField: true, title: 'Log in to your PayPal account', titleBrands: ['PayPal'] }), {});
  assert.equal(r.verdict, 'danger');
  assert.ok(r.score >= 60);
  for (const id of ['domain-age', 'lookalike', 'cred-lookalike', 'brand-title', 'risky-tld', 'host-keywords']) assert.ok(ids(r).includes(id), id);
});

test('domain age alone grades by recency', () => {
  const w = (d) => scoring.evaluate({ hostname: 'some-shop.com', ageDays: d, rdapStatus: 'ok' }, page(), {}).score;
  assert.ok(w(1) > w(20) && w(20) > w(60) && w(60) > w(120) && w(120) > w(300) && w(300) > w(800));
  assert.equal(w(800), 0);
});

test('seed phrase request is heavily penalised', () => {
  const r = scoring.evaluate({ hostname: 'wallet-sync-validate.app', ageDays: 10, rdapStatus: 'ok' }, page({ hasSeedPhraseField: true, phrases: phrases.scan('connect your wallet to claim the airdrop and enter your 12-word recovery phrase') }), {});
  assert.equal(r.verdict, 'danger');
  assert.ok(ids(r).includes('seed-phrase'));
  assert.ok(ids(r).includes('phrase-crypto'));
});

test('credentials posted cross-domain and over http', () => {
  const r = scoring.evaluate({ hostname: 'random-blog.net', ageDays: 2000, rdapStatus: 'ok' }, page({ isHttps: false, hasPasswordField: true, forms: [{ actionHost: 'collector.evil.top', crossDomain: true, hasPassword: true, hasCard: false, actionIsHttp: true, method: 'post' }] }), {});
  assert.ok(ids(r).includes('cross-domain-form'));
  assert.ok(ids(r).includes('no-https'));
  assert.ok(r.score >= 35);
});

test('hot-linked brand favicon is a strong signal', () => {
  const r = scoring.evaluate({ hostname: 'account-review-center.com', ageDays: 15, rdapStatus: 'ok' }, page({ hasPasswordField: true, brandAssets: [{ brand: 'Microsoft', host: 'www.microsoft.com', kind: 'favicon' }] }), {});
  assert.ok(ids(r).includes('brand-favicon'));
  assert.equal(r.verdict, 'danger');
});

test('phrase weights are capped', () => {
  const text = 'your account has been suspended. congratulations you have won. double your bitcoin. your computer is infected. pay only with gift cards. your package is on hold. a small fee of $1.99. 100% safe';
  const r = scoring.evaluate({ hostname: 'oldsite.org', ageDays: 5000, rdapStatus: 'ok' }, page({ phrases: phrases.scan(text) }), {});
  const total = r.signals.filter((s) => s.id.startsWith('phrase-')).reduce((a, s) => a + s.weight, 0);
  assert.ok(total <= 40, `phrase total ${total}`);
});

test('thresholds are configurable', () => {
  const dom = { hostname: 'some-shop.xyz', ageDays: 20, rdapStatus: 'ok' };
  const strict = scoring.evaluate(dom, page(), { dangerThreshold: 30, warnThreshold: 10 });
  const lax = scoring.evaluate(dom, page(), { dangerThreshold: 90, warnThreshold: 80 });
  assert.equal(strict.verdict, 'danger');
  assert.equal(lax.verdict, 'ok');
});

test('result is JSON-serialisable', () => {
  const r = scoring.evaluate({ hostname: 'paypa1.com', ageDays: 1 }, page({ hasPasswordField: true }), {});
  assert.doesNotThrow(() => JSON.stringify(r));
});

test('money claims combined with a card form are penalised', () => {
  const text = 'Guaranteed returns of 5% daily. Pay the activation fee to release your profits. Enter your card.';
  const r = scoring.evaluate({ hostname: 'invest-now.xyz', ageDays: 12, rdapStatus: 'ok' }, page({ hasCardField: true, phrases: phrases.scan(text) }), {});
  for (const id of ['phrase-investment', 'phrase-advancefee', 'money-form', 'money-stack', 'money-young']) assert.ok(ids(r).includes(id), id);
  assert.equal(r.verdict, 'danger');
});

test('a single money phrase on an old site stays below the warning threshold', () => {
  const r = scoring.evaluate({ hostname: 'bank-blog.com', ageDays: 4000, rdapStatus: 'ok' }, page({ phrases: phrases.scan('Guaranteed returns are a myth, says our analyst') }), {});
  assert.equal(r.verdict, 'ok');
});

test('a verified PhishTank report alone makes the page danger, even on a brand host', () => {
  const r = scoring.evaluate({ hostname: 'docs.google.com', phishReport: { kind: 'url', count: 1, target: 'Microsoft' } }, page({ hasPasswordField: true }), {});
  assert.equal(r.verdict, 'danger');
  assert.ok(ids(r).includes('phish-report-url'));
  assert.ok(!ids(r).includes('lookalike'), 'no impersonation signal for the brand\'s own host');
  assert.equal(r.brand, 'Google');
});

test('host-level reports add weight but need company to reach danger', () => {
  const r = scoring.evaluate({ hostname: 'some-shop.com', ageDays: 3000, rdapStatus: 'ok', phishReport: { kind: 'host', count: 3 } }, page(), {});
  assert.equal(r.verdict, 'warning');
  assert.ok(ids(r).includes('phish-report-host'));
});

test('Safe Browsing match carries the Google attribution and hedged wording', () => {
  const r = scoring.evaluate({ hostname: 'example-shop.net', safeBrowsing: { threats: ['SOCIAL_ENGINEERING'] } }, page(), {});
  const s = r.signals.find((x) => x.id === 'safe-browsing');
  assert.ok(s);
  assert.match(s.label, /suspected/);
  assert.equal(s.detail, 'Advisory provided by Google');
  assert.equal(r.verdict, 'danger');
});

test('brand domains stay trusted without a reputation hit', () => {
  assert.equal(scoring.evaluate({ hostname: 'docs.google.com', phishReport: null, safeBrowsing: { threats: [] } }, page(), {}).verdict, 'trusted');
});

test('a brand naming itself on its own domain is not a brand mismatch', () => {
  const r = scoring.evaluate({ hostname: 'www.google.com', phishReport: { kind: 'url', count: 1, target: 'Other' } },
    page({ title: 'Google', titleBrands: ['Google'], bodyBrandCounts: { Google: 9 }, brandAssets: [{ brand: 'Google', host: 'www.gstatic.com', kind: 'favicon' }] }), {});
  for (const id of ['brand-title', 'brand-body', 'brand-favicon', 'brand-assets']) assert.ok(!ids(r).includes(id), id);
});

test('clone broker: young domain claiming government licensing is danger, a real broker is not', () => {
  const pitch = 'The leading CFD trading firm for experts and beginners. Open a trading account. Fund your account and complete KYC. ';
  const clone = pitch + 'Operated by XYZ Trading Limited, a UK-registered investment company authorised by the United Kingdom government. Regulated by the FCA.';
  const r = scoring.evaluate({ hostname: 'quinaspro.com', ageDays: 164, rdapStatus: 'ok' }, page({ phrases: phrases.scan(clone) }), {});
  assert.equal(r.verdict, 'danger');
  assert.ok(ids(r).includes('phrase-fakeregulator'));
  const real = pitch + 'IG Markets Ltd is authorised and regulated by the Financial Conduct Authority.';
  assert.equal(scoring.evaluate({ hostname: 'some-broker.com', ageDays: 6000, rdapStatus: 'ok' }, page({ phrases: phrases.scan(real) }), {}).verdict, 'ok');
});

test('defaults: Safe Browsing, chat monitor and non-tech terms are on', () => {
  const d = require('../src/lib/scoring.js').DEFAULT_SETTINGS;
  assert.equal(d.safeBrowsingEnabled, true);
  assert.equal(d.chatMonitorEnabled, true);
  assert.equal(d.plainLanguage, true);
});

test('toolbar icon: green, yellow, red, grey check, no badge text', () => {
  const fs = require('fs');
  const path = require('path');
  const { badgeFor } = require('../src/lib/scoring.js');
  const sig = [{ id: 'digits', weight: 4 }];
  assert.equal(badgeFor({ verdict: 'ok', signals: [] }).state, 'green');
  assert.equal(badgeFor({ verdict: 'ok', signals: sig }).state, 'yellow');
  assert.equal(badgeFor({ verdict: 'warning', signals: sig, settings: { showWarnBanner: false } }).state, 'yellow');
  assert.equal(badgeFor({ verdict: 'warning', signals: sig, settings: { showWarnBanner: true } }).state, 'red');
  assert.equal(badgeFor({ verdict: 'danger', signals: sig }).state, 'red');
  assert.equal(badgeFor({ verdict: 'trusted', signals: [] }).state, 'grey');
  assert.equal(badgeFor({ verdict: 'skipped' }).state, 'neutral');
  assert.equal(badgeFor(null).state, 'neutral');
  for (const st of ['green', 'yellow', 'red', 'grey', 'neutral']) {
    const b = badgeFor(st === 'neutral' ? null : st === 'grey' ? { verdict: 'trusted' } : st === 'red' ? { verdict: 'danger', signals: sig } : { verdict: 'ok', signals: st === 'yellow' ? sig : [] });
    assert.equal(b.text, '', 'no badge text');
    for (const p of Object.values(b.icon)) assert.ok(fs.existsSync(path.join(__dirname, '..', p)), `${p} exists`);
  }
});
