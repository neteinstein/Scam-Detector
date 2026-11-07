const test = require('node:test');
const assert = require('node:assert/strict');
const um = require('../src/lib/urlmatch.js');

test('normalizeUrl strips scheme, www, fragment and trailing slash', () => {
  assert.equal(um.normalizeUrl('https://www.Example.com/Path/?a=1#x'), 'example.com/Path?a=1');
  assert.equal(um.normalizeUrl('http://example.com/'), 'example.com');
  assert.equal(um.normalizeUrl('http://example.com:8080/p'), 'example.com:8080/p');
  assert.equal(um.normalizeUrl('ftp://example.com/'), null);
  assert.equal(um.normalizeUrl('not a url'), null);
});

test('candidates go from most to least specific', () => {
  assert.deepEqual(um.candidates('https://sites.google.com/view/xyz/home?id=3'), [
    'sites.google.com/view/xyz/home?id=3', 'sites.google.com/view/xyz/home', 'sites.google.com/view/xyz', 'sites.google.com/view',
  ], 'path-shared host: the site root is never a candidate');
  assert.deepEqual(um.candidates('https://evil.top/a/b?x=1'), ['evil.top/a/b?x=1', 'evil.top/a/b', 'evil.top/a', 'evil.top']);
});

test('a report of an open redirect or home page on a brand domain does not flag the whole site', async () => {
  assert.deepEqual(um.storedKeys('https://www.google.com/url?q=https://evil.top'), ['google.com/url?q=https://evil.top']);
  assert.deepEqual(um.storedKeys('https://www.google.com/'), []);
  assert.deepEqual(um.storedKeys('https://www.google.com/?hl=en'), []);
  const idx = await um.buildIndex([
    { url: 'https://www.google.com/url?q=https://evil.top', target: 'Other' },
    { url: 'https://www.google.com/search?q=login', target: 'Other' },
    { url: 'https://www.google.com/', target: 'Other' },
    { url: 'https://evil.top/x', target: 'Other' },
  ]);
  assert.equal(await um.lookup(idx, 'https://www.google.com/'), null);
  assert.equal(await um.lookup(idx, 'https://www.google.com/search?q=weather'), null);
  assert.equal(await um.lookup(idx, 'https://www.google.com/url?q=https://example.org'), null);
  assert.equal((await um.lookup(idx, 'https://www.google.com/url?q=https://evil.top')).kind, 'url', 'the exact reported URL still matches');
});

test('a reported form on a shared host does not flag every other form there', async () => {
  assert.deepEqual(um.storedKeys('https://forms.office.com/Pages/ResponsePage.aspx?id=evil'), ['forms.office.com/Pages/ResponsePage.aspx?id=evil']);
  const idx = await um.buildIndex([{ url: 'https://forms.office.com/Pages/ResponsePage.aspx?id=evil', target: 'Microsoft' }]);
  assert.equal(await um.lookup(idx, 'https://forms.office.com/Pages/ResponsePage.aspx?id=good'), null);
  assert.equal((await um.lookup(idx, 'https://forms.office.com/Pages/ResponsePage.aspx?id=evil')).kind, 'url');
});

test('tenant sites on hosting platforms are matched like any other site, root included', async () => {
  assert.equal(um.isPathShared('www.google.com'), true);
  assert.equal(um.isPathShared('bit.ly'), true);
  assert.equal(um.isPathShared('foo.weebly.com'), false);
  assert.equal(um.isPathShared('abc.z13.web.core.windows.net'), false);
  const idx = await um.buildIndex([
    { url: 'https://evil-shop.vercel.app/', target: 'Other' },
    { url: 'https://abc.z13.web.core.windows.net/?email=x', target: 'Other' },
    { url: 'https://shorturl.at/Od3dK', target: 'Other' },
  ]);
  assert.equal((await um.lookup(idx, 'https://evil-shop.vercel.app/')).kind, 'url');
  assert.equal((await um.lookup(idx, 'https://evil-shop.vercel.app/checkout')).kind, 'url');
  assert.equal((await um.lookup(idx, 'https://abc.z13.web.core.windows.net/?email=y')).kind, 'url');
  assert.equal((await um.lookup(idx, 'https://shorturl.at/Od3dK')).kind, 'url');
  assert.equal(await um.lookup(idx, 'https://shorturl.at/other'), null);
});

test('indexes carry a format version so old ones are rebuilt', async () => {
  assert.equal((await um.buildIndex([])).v, um.INDEX_VERSION);
});

test('storedKeys keeps the query form and the bare form', () => {
  assert.deepEqual(um.storedKeys('https://evil.top/login.php?u=1'), ['evil.top/login.php?u=1', 'evil.top/login.php']);
  assert.deepEqual(um.storedKeys('https://evil.top/'), ['evil.top']);
});

test('shared hosts and brand domains are not host-matched', () => {
  assert.equal(um.isSharedHost('docs.google.com'), true);
  assert.equal(um.isSharedHost('bit.ly'), true);
  assert.equal(um.isSharedHost('foo.github.io'), true);
  assert.equal(um.isSharedHost('www.paypal.com'), true);
  assert.equal(um.isSharedHost('allegrolokalnie.search0046.cfd'), false);
});

test('parsePhishTankCsv handles quoting and filters unverified rows', () => {
  const csv = 'phish_id,url,phish_detail_url,submission_time,verified,verification_time,online,target\n' +
    '1,https://evil.top/login,http://x,2026-01-01,yes,2026-01-01T10:00:00+00:00,yes,PayPal\n' +
    '2,"https://evil2.top/a,b",http://x,2026-01-01,yes,2026-01-01,yes,"Bank, Inc"\n' +
    '3,https://notyet.top/,http://x,2026-01-01,no,,yes,Other\n' +
    '4,https://offline.top/,http://x,2026-01-01,yes,2026-01-01,no,Other\n';
  const recs = um.parsePhishTankCsv(csv);
  assert.deepEqual(recs.map((r) => r.url), ['https://evil.top/login', 'https://evil2.top/a,b']);
  assert.equal(recs[1].target, 'Bank, Inc');
});

test('buildIndex + lookup: exact, path-prefix, host and shared-host behaviour', async () => {
  const idx = await um.buildIndex([
    { url: 'https://evil.top/login.php?u=1', target: 'PayPal' },
    { url: 'https://evil.top/verify', target: 'PayPal' },
    { url: 'https://sites.google.com/view/secure-docs/home', target: 'Microsoft' },
    { url: 'https://docs.google.com/forms/d/abc/viewform', target: 'Other' },
  ]);
  assert.equal(idx.count, 4);
  assert.equal(idx.targets.PayPal, 2);
  assert.equal((await um.lookup(idx, 'https://evil.top/login.php?u=1')).kind, 'url');
  assert.equal((await um.lookup(idx, 'https://www.evil.top/login.php?u=999')).kind, 'url', 'query variant matches bare form');
  assert.equal((await um.lookup(idx, 'https://evil.top/other')).kind, 'host', 'host-level match on dedicated host');
  assert.equal((await um.lookup(idx, 'https://evil.top/other')).count, 2);
  assert.equal((await um.lookup(idx, 'https://sites.google.com/view/secure-docs/home/extra')).kind, 'url', 'path prefix match');
  assert.equal(await um.lookup(idx, 'https://sites.google.com/view/another'), null, 'shared host never host-matched');
  assert.equal(await um.lookup(idx, 'https://docs.google.com/'), null);
  assert.equal(await um.lookup(idx, 'https://mindera.com/'), null);
  assert.equal(await um.lookup(null, 'https://evil.top/'), null);
});

test('hashes are stable, short and url-safe', async () => {
  const h = await um.hashKey('evil.top/login');
  assert.equal(h, await um.hashKey('evil.top/login'));
  assert.match(h, /^[A-Za-z0-9_-]{16}$/);
});
