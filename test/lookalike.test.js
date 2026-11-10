const test = require('node:test');
const assert = require('node:assert/strict');
const lookalike = require('../src/lib/lookalike.js');

function brandOf(host) { const r = lookalike.detect(host); return r ? r.brand : null; }
function reasonOf(host) { const r = lookalike.detect(host); return r ? r.reason : null; }

test('legitimate brand domains are never flagged', () => {
  for (const h of ['paypal.com', 'www.paypal.com', 'accounts.google.com', 'login.microsoftonline.com', 'www.amazon.co.uk', 'github.com', 'paypalobjects.com', 'cgd.pt', 'www.dhl.com', 'apple.com', 'icloud.com', 'revolut.com', 'revolut.me']) {
    assert.equal(lookalike.detect(h), null, h);
  }
});

test('unrelated domains are not flagged', () => {
  for (const h of ['example.com', 'mindera.com', 'applebees.com', 'cups.com', 'nosotros.es', 'wikipedia.org', 'stackoverflow.com', 'bbc.co.uk', 'ingenieria.es', 'chaseelliott.com', 'upstart.com', 'attorney.com']) {
    assert.equal(lookalike.detect(h), null, h);
  }
});

test('brand embedded in hostname with phishing words', () => {
  assert.equal(brandOf('paypal-secure-login.com'), 'PayPal');
  assert.equal(brandOf('appleid-verify.xyz'), 'Apple');
  assert.equal(brandOf('netflix-billing-update.info'), 'Netflix');
  assert.equal(brandOf('ups-redelivery.info'), 'UPS');
  assert.equal(reasonOf('ups-redelivery.info'), 'brand-in-domain');
  assert.equal(brandOf('paypalverify.com'), 'PayPal');
});

test('brand in subdomain of unrelated registrable domain', () => {
  const r = lookalike.detect('secure.paypal.com.verify-id.net');
  assert.equal(r.brand, 'PayPal');
  assert.equal(r.reason, 'brand-in-subdomain');
  assert.equal(brandOf('login.microsoftonline.com.evil-host.top'), 'Microsoft');
});

test('typosquats', () => {
  assert.equal(brandOf('gooogle.com'), 'Google');
  assert.equal(reasonOf('gooogle.com'), 'typosquat');
  assert.equal(brandOf('steamcommunlty.com'), 'Steam');
  assert.equal(brandOf('faceboook.com'), 'Facebook / Meta');
  assert.equal(brandOf('amazom.com'), 'Amazon');
});

test('homoglyphs and IDN confusables', () => {
  assert.equal(reasonOf('paypa1.com'), 'homoglyph');
  assert.equal(brandOf('micros0ft-support.live'), 'Microsoft');
  assert.equal(brandOf('xn--pypal-4ve.com'), 'PayPal');       // pаypal with Cyrillic а
  assert.equal(brandOf('xn--80ak6aa92e.com'), 'Apple');       // аррӏе (all Cyrillic)
  assert.equal(lookalike.detect('xn--80ak6aa92e.com').isIdn, true);
});

test('brand glued to TLD', () => {
  assert.equal(brandOf('paypal-com.xyz'), 'PayPal');
  assert.equal(brandOf('amazon-de.top'), 'Amazon');
});

test('custom brands are honoured', () => {
  const extra = [{ name: 'Acme Bank', keywords: ['acmebank'], domains: ['acmebank.com'] }];
  assert.equal(lookalike.detect('acmebank.com', extra), null);
  assert.equal(lookalike.detect('acmebank-login.net', extra).brand, 'Acme Bank');
});

test('detect result is JSON-serialisable (no cycles)', () => {
  const r = lookalike.detect('paypal-secure-login.com');
  assert.doesNotThrow(() => JSON.stringify(r));
});

test('brands added from feed statistics', () => {
  assert.equal(brandOf('allegrolokalnie.pl-smart236784.sbs'), 'Allegro');
  assert.equal(brandOf('www.allegrolokalnie.search0046.cfd'), 'Allegro');
  assert.equal(lookalike.detect('allegro.pl'), null);
  assert.equal(brandOf('societegenerale-secure.com'), 'Société Générale');
  assert.equal(lookalike.detect('particuliers.societegenerale.fr'), null);
});

test('Continente and Via Verde impersonation (2026 PT SMS campaigns)', () => {
  const lookalike = require('../src/lib/lookalike.js');
  const brands = require('../src/lib/brands.js');
  assert.equal(lookalike.detect('cartaocontinente.vc').brand, 'Continente');
  assert.equal(lookalike.detect('continente.vc').brand, 'Continente');
  assert.equal(lookalike.detect('viaverde-pagamentos.com').brand, 'Via Verde');
  assert.equal(lookalike.detect('cartao.continente.pt'), null);
  assert.equal(lookalike.detect('www.viaverde.pt'), null);
  assert.equal(brands.findByDomain('cartaocontinente.pt').name, 'Continente');
  // Near-miss: ordinary words, not the brand.
  assert.equal(lookalike.detect('continentes-viagens.pt'), null);
});
