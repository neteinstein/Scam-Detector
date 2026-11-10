const test = require('node:test');
const assert = require('node:assert/strict');
const pageSignals = require('../src/lib/pageSignals.js');

test('brandsInText respects ambiguous-name rules', () => {
  assert.deepEqual(pageSignals.brandsInText('Sign in to your PayPal account'), ['PayPal']);
  assert.deepEqual(pageSignals.brandsInText('Apple ID - Sign in'), ['Apple']);
  assert.deepEqual(pageSignals.brandsInText('Fresh apple pie recipe'), []);
  assert.deepEqual(pageSignals.brandsInText('We accept Visa and Mastercard'), []);
  assert.deepEqual(pageSignals.brandsInText('Chase Bank Online'), ['Chase']);
  assert.deepEqual(pageSignals.brandsInText('Chase your dreams'), []);
  assert.deepEqual(pageSignals.brandsInText('UPS Tracking - My Choice'), ['UPS']);
  assert.ok(pageSignals.brandsInText('Portal das Finanças - Reembolso').includes('Autoridade Tributária'));
});

test('countBrandMentions counts occurrences', () => {
  const c = pageSignals.countBrandMentions('paypal paypal paypal netflix');
  assert.equal(c.PayPal, 3);
  assert.equal(c.Netflix, 1);
});

function fakeDoc(favicon) {
  const el = (attrs) => ({ getAttribute: (n) => attrs[n] || null });
  return {
    title: 'Broker', body: { innerText: 'Welcome', getAttribute: () => null }, documentElement: { getAttribute: () => null },
    querySelector: () => null,
    querySelectorAll: (sel) => (sel.includes('icon') && !sel.includes('stylesheet') ? [el({ href: favicon })] : []),
  };
}
const loc = { href: 'https://www.broker.example/', hostname: 'www.broker.example', protocol: 'https:' };

test('a favicon on customer cloud storage is not a hot-linked brand asset', () => {
  assert.deepEqual(pageSignals.collect(fakeDoc('https://storage.googleapis.com/broker-assets/favicon.ico'), loc).brandAssets, []);
  assert.deepEqual(pageSignals.collect(fakeDoc('https://my-bucket.s3.amazonaws.com/favicon.ico'), loc).brandAssets, []);
  const hot = pageSignals.collect(fakeDoc('https://www.paypal.com/favicon.ico'), loc).brandAssets;
  assert.equal(hot.length, 1);
  assert.equal(hot[0].brand, 'PayPal');
});

test('a page titled Revolut.Me on revolut.me is not an impersonation, but on another host it is', () => {
  const brands = require('../src/lib/brands.js');
  const revolut = brands.findByDomain('revolut.me');
  assert.equal(revolut.name, 'Revolut');
  assert.ok(revolut.domains.includes('revolut.com'));
  assert.equal(brands.findByDomain('revolut-me.com'), null);
  assert.deepEqual(pageSignals.brandsInText('Revolut.Me'), ['Revolut']);
});
