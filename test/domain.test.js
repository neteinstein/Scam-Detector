const test = require('node:test');
const assert = require('node:assert/strict');
const domain = require('../src/lib/domain.js');
const punycode = require('../src/lib/punycode.js');

test('parse extracts registrable domain with single-label suffix', () => {
  const p = domain.parse('login.example.com');
  assert.equal(p.registrable, 'example.com');
  assert.equal(p.sld, 'example');
  assert.equal(p.subdomain, 'login');
  assert.equal(p.suffix, 'com');
});

test('parse understands multi-label public suffixes', () => {
  assert.equal(domain.parse('www.bbc.co.uk').registrable, 'bbc.co.uk');
  assert.equal(domain.parse('a.b.example.com.br').registrable, 'example.com.br');
  assert.equal(domain.parse('secure.paypal.com.verify-id.net').registrable, 'verify-id.net');
});

test('parse marks free hosting platforms', () => {
  const p = domain.parse('my-login-page.github.io');
  assert.equal(p.freeHosting, true);
  assert.equal(p.registrable, 'my-login-page.github.io');
  assert.equal(domain.parse('example.com').freeHosting, false);
});

test('IP and local hosts', () => {
  assert.equal(domain.parse('192.168.1.1').isIP, true);
  assert.equal(domain.isIPAddress('8.8.8.8'), true);
  assert.equal(domain.isIPAddress('example.com'), false);
  assert.equal(domain.isLocalHost('localhost'), true);
  assert.equal(domain.isLocalHost('127.0.0.1'), true);
  assert.equal(domain.isLocalHost('10.0.0.5'), true);
  assert.equal(domain.isLocalHost('172.20.1.1'), true);
  assert.equal(domain.isLocalHost('8.8.8.8'), false);
  assert.equal(domain.isLocalHost('example.com'), false);
});

test('levenshtein with transpositions', () => {
  assert.equal(domain.levenshtein('paypal', 'paypal'), 0);
  assert.equal(domain.levenshtein('paypal', 'paypa1'), 1);
  assert.equal(domain.levenshtein('google', 'gogole'), 1);
  assert.equal(domain.levenshtein('amazon', 'amazom'), 1);
  assert.equal(domain.levenshtein('abc', 'xyz'), 3);
  assert.equal(domain.levenshtein('', 'abc'), 3);
});

test('isSubdomainOf', () => {
  assert.equal(domain.isSubdomainOf('www.paypal.com', 'paypal.com'), true);
  assert.equal(domain.isSubdomainOf('paypal.com', 'paypal.com'), true);
  assert.equal(domain.isSubdomainOf('notpaypal.com', 'paypal.com'), false);
});

test('punycode decoding', () => {
  assert.equal(punycode.toUnicode('xn--mnchen-3ya.de'), 'münchen.de');
  assert.equal(punycode.toUnicode('xn--80ak6aa92e.com'), 'аррӏе.com');
  assert.equal(punycode.toUnicode('example.com'), 'example.com');
  assert.equal(punycode.isPunycode('xn--pypal-4ve.com'), true);
  assert.equal(punycode.isPunycode('paypal.com'), false);
});
