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

test('HOKA fake shops and Chave Movel Digital phishing (Nov 2026 reporting)', () => {
  const lookalike = require('../src/lib/lookalike.js');
  const brands = require('../src/lib/brands.js');
  assert.equal(lookalike.detect('hoka-outlet-sale.shop').brand, 'HOKA');
  assert.equal(lookalike.detect('hokaoneone-blackfriday.com').brand, 'HOKA');
  assert.equal(lookalike.detect('www.hoka.com'), null);
  assert.equal(brands.findByDomain('hoka.com').name, 'HOKA');
  assert.equal(lookalike.detect('chavemovel-digital.com').brand, 'Chave Móvel Digital');
  assert.equal(lookalike.detect('autenticacaogov-pt.top').brand, 'Chave Móvel Digital');
  assert.equal(lookalike.detect('www.autenticacao.gov.pt'), null);
  // Near-misses: words that merely contain the letters.
  assert.equal(lookalike.detect('shokamura.jp'), null);
  assert.equal(lookalike.detect('chaves-moveis.pt'), null);
});

// ---- 2026-11 catalogue review (PhishTank feed, Reddit r/Scams, INCIBE, SNS 24, FTC) ----

test('new brands from the November 2026 review are detected in phishing hostnames', () => {
  const cases = {
    'sunpasstollsbill.com': 'SunPass', 'ezpass-pay.top': 'E-ZPass', 'e-zpass-toll.com': 'E-ZPass', 'e-zpass.top': 'E-ZPass',
    'pago-de-multas-dgt.info': 'DGT (tráfico)', 'reembolso-segsocial.com': 'Seguridad Social', 'sns24-pagamento.com': 'SNS 24',
    'ipko-polska.com': 'PKO BP', 'ipkobiznes-bp.pl.web.do': 'PKO BP', 'inpost.pl-4f8.lol': 'InPost', 'wetransfer-mu.vercel.app': 'WeTransfer',
    'osrsrunescape.com-challenge-assist.site': 'RuneScape', 'poshmark-verify.shop': 'Poshmark', 'p0shmark.308627951.cfd': 'Poshmark',
  };
  for (const [h, b] of Object.entries(cases)) assert.equal(brandOf(h), b, h);
});

test('real sites of the new brands and names close to them are not flagged', () => {
  for (const h of ['ezpassnj.com', 'www.e-zpassny.com', 'sunpass.com', 'sede.dgt.gob.es', 'www.dgt.es', 'portal.seg-social.gob.es', 'www.sns24.gov.pt',
    'www.ipko.pl', 'www.ipkobiznes.pl', 'inpost.co.uk', 'inpost.eu', 'secure.runescape.com', 'wetransfer.com', 'poshmark.ca',
    // one or two letters from a new brand name, but unrelated real sites
    'anpost.com', 'ilpost.it', 'vnpost.vn', 'enpass.io', '7pass.de', 'unescap.org', 'minescape.com', 'wmtransfer.com', 'transfer.it',
    'mainpost.de', 'www.xtransfer.cn']) {
    assert.equal(lookalike.detect(h), null, h);
  }
});

test('government hosts are never impersonations', () => {
  for (const h of ['miseguridadsocial.gov.co', 'esocial.gov.br', 'ausport.gov.au', 'trezor.gov.rs', 'okta.mil', 'ezpass.ny.gov']) assert.equal(lookalike.detect(h), null, h);
});

test('several phishing words glued to a brand name', () => {
  assert.equal(brandOf('linkedinloginserviceteamhelp.weebly.com'), 'LinkedIn');
  assert.equal(brandOf('comcastverificationupdate.weebly.com'), 'Comcast / Xfinity');
  assert.equal(brandOf('paypalloginverify.com'), 'PayPal');
  assert.equal(brandOf('yahoomail52.wixsite.com'), 'Yahoo');
  assert.equal(brandOf('amazoncheckout.netlify.app'), 'Amazon');
  // ...but brands name their own sites with plain product words
  for (const h of ['amazonwebservices.com', 'mcafeemobilesecurity.com', 'microsoftazure.us', 'microsoftazuread-sso.com']) assert.equal(lookalike.detect(h), null, h);
});

test('one slip in a glued phishing word still counts, real words do not', () => {
  assert.equal(brandOf('trezorwollet.webador.com'), 'Trezor');
  assert.equal(brandOf('xfinityecure.weebly.com'), 'Comcast / Xfinity');
  assert.equal(brandOf('paypal-verifcation.com'), 'PayPal');
  assert.equal(lookalike.detect('paypalpreview.com'), null); // preview is a word, not a typo of review
  assert.equal(lookalike.detect('bradescoprime.com.br'), null); // prime is not prize
});

test('brand name split by hyphens', () => {
  assert.equal(brandOf('seg-social.icu'), 'Segurança Social');
  assert.equal(brandOf('pay-pal-login.com'), 'PayPal');
});

test('typos of long brand names in a subdomain label', () => {
  assert.equal(brandOf('allegrolokainie.strawberryv2.sbs'), 'Allegro');
  assert.equal(reasonOf('allegrolokainie.strawberryv2.sbs'), 'typosquat');
  assert.equal(brandOf('allegrolokalne.pl-84382.click'), 'Allegro');
  assert.equal(brandOf('klelnanzeigen-deutch.xtlgj.com'), 'Kleinanzeigen');
  // short names are not fuzzy-matched in subdomains
  assert.equal(lookalike.detect('stream.example.com'), null);
});

test('country storefronts of global brands are real (amazon.ae was flagged)', () => {
  for (const h of ['www.amazon.ae', 'amazon.sa', 'amazon.eg', 'www.amazon.com.tr', 'amazon.sg', 'amazon.ie', 'amazon.co.za', 'www.amazon.com.be', 'amazon.cn',
    'audible.co.uk', 'www.google.ae', 'google.com.sa', 'google.co.in', 'google.com.qa', 'youtube.de', 'ebay.at', 'www.ebay.com.sg', 'airbnb.ae', 'airbnb.co.kr',
    'ticketmaster.de', 'nintendo.co.jp', 'vinted.ie', 'mercadolibre.cl', 'walmart.com.mx', 'hsbc.com.sg', 'vodafone.com.tr', 'olx.com.pk', 'visa.fr']) {
    assert.equal(lookalike.detect(h), null, h);
  }
});

test('lookalikes of country storefronts are still caught', () => {
  for (const h of ['amazon-ae.com', 'amazon.ae.verify-login.top', 'amazonae-login.com', 'amazon.xyz', 'google-ae.top', 'ebay-at-payment.com']) {
    assert.ok(lookalike.detect(h), h);
  }
});

test('unrelated sites that share a brand word are not impersonations', () => {
  for (const h of ['nos.nl', 'www.hermes.com', 'telegram.com', 'zoom.earth', 'kraken.io', 'halifax.ca', 'ups.edu.ec']) {
    assert.equal(lookalike.detect(h), null, h);
  }
  assert.equal(brandOf('hermes-delivery.top'), 'Evri');
});

test('Gulf couriers and shops, IMT and Deutsche Rentenversicherung (Nov 2026 review)', () => {
  assert.equal(brandOf('aramex-uae-delivery.net'), 'Aramex');
  assert.equal(brandOf('emiratespost-clearance.com'), 'Emirates Post');
  assert.equal(brandOf('noon-deals.top'), 'Noon');
  assert.equal(brandOf('imt-multas.com'), 'IMT');
  assert.equal(brandOf('rentenversicherung-online.com'), 'Deutsche Rentenversicherung');
  for (const h of ['www.aramex.com', 'emiratespost.ae', 'www.noon.com', 'www.imt-ip.pt', 'www.deutsche-rentenversicherung.de', 'afternoon.com', 'noonlight.com', 'limtech.com', 'volksbank-mittelhessen.de']) {
    assert.equal(lookalike.detect(h), null, h);
  }
});
