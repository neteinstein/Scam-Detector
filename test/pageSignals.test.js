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
