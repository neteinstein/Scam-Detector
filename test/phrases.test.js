const test = require('node:test');
const assert = require('node:assert/strict');
const phrases = require('../src/lib/phrases.js');

const cats = (t) => [...new Set(phrases.scan(t).map((p) => p.category))];

test('detects urgency wording in several languages', () => {
  assert.deepEqual(cats('Your account has been suspended. Verify your identity within 24 hours.'), ['urgency']);
  assert.deepEqual(cats('A sua conta foi bloqueada. Ação imediata necessária.'), ['urgency']);
  assert.deepEqual(cats('Su cuenta ha sido suspendida'), ['urgency']);
});

test('detects prize, crypto, tech-support, delivery, payment lures', () => {
  assert.ok(cats('Congratulations, you have been selected! Claim your prize now').includes('prize'));
  assert.ok(cats('Send 0.1 BTC and receive 0.2 BTC back. Guaranteed returns!').includes('crypto'));
  assert.ok(cats('Windows Security Alert: your computer is infected. Call now +1 (888) 555-0199').includes('techsupport'));
  assert.ok(cats('Your package is on hold. Pay the redelivery fee of €1.99 to reschedule').includes('delivery'));
  assert.ok(cats('We only accept gift cards').includes('payment'));
});

test('normal marketing copy does not trigger', () => {
  assert.deepEqual(cats('Welcome to our online store. Free shipping on orders over $50. Create an account to track your orders.'), []);
  assert.deepEqual(cats('Sign in with your email and password. Forgot password? Contact support.'), []);
});

test('matches per category are capped', () => {
  const t = 'act now. act now. final notice. unusual sign-in. immediate action required. your account has been locked. offer ends today';
  assert.ok(phrases.scan(t).filter((p) => p.category === 'urgency').length <= 3);
});
