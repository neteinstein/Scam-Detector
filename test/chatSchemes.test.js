const test = require('node:test');
const assert = require('node:assert/strict');
const chat = require('../src/lib/chatSchemes.js');

const ids = (text, opts) => chat.analyze(text, Object.assign({ hostname: 'www.olx.pt' }, opts || {})).schemes.map((s) => s.id);
const alert = (text, opts) => chat.analyze(text, Object.assign({ hostname: 'www.olx.pt' }, opts || {})).alert;

test('isMarketplace', () => {
  assert.equal(chat.isMarketplace('www.olx.pt'), true);
  assert.equal(chat.isMarketplace('www.vinted.fr'), true);
  assert.equal(chat.isMarketplace('es.wallapop.com'), true);
  assert.equal(chat.isMarketplace('www.facebook.com'), true);
  assert.equal(chat.isMarketplace('mindera.com'), false);
  assert.equal(chat.isMarketplace('shop.example.com', ['example.com']), true);
});

test('courier pick-up + payment link script in four languages', () => {
  const en = 'Hi, I am abroad. I will send a courier to collect it, click the link to receive the payment.';
  const pt = 'Olá, estou fora do país. Envio um estafeta para levantar o artigo, clica no link para receber o pagamento.';
  const es = 'Hola, estoy en el extranjero. Envío un mensajero a recoger el artículo, haz clic en el enlace para recibir el pago.';
  const fr = "Bonjour, je suis à l'étranger. J'envoie un coursier pour récupérer l'article, cliquez sur le lien pour recevoir le paiement.";
  for (const [lang, text] of [['en', en], ['pt', pt], ['es', es], ['fr', fr]]) {
    const r = chat.analyze(text, { hostname: 'www.olx.pt' });
    const got = r.schemes.map((s) => s.id);
    assert.ok(got.includes('courier-pickup'), lang + ' courier');
    assert.ok(got.includes('payment-link'), lang + ' payment-link');
    assert.ok(got.includes('abroad'), lang + ' abroad');
    assert.ok(r.schemes.every((s) => s.lang === lang), lang + ' language tag');
    assert.equal(r.alert, true, lang + ' alert');
  }
});

test('phishing link to a marketplace look-alike is the top finding', () => {
  const r = chat.analyze('Recebe o pagamento aqui: https://olx-entregas-pagamento.com/receber', { hostname: 'www.olx.pt' });
  assert.equal(r.schemes[0].id, 'phishing-link');
  assert.equal(r.links[0].brand, 'OLX');
  assert.equal(r.alert, true);
});

test('links to the marketplace itself are ignored', () => {
  const r = chat.analyze('See the ad at https://www.olx.pt/d/anuncio/123 and pay there', { hostname: 'www.olx.pt' });
  assert.ok(!r.schemes.some((s) => s.id === 'phishing-link' || s.id === 'external-link'));
});

test('SMS code, fee-to-release, rental deposit, overpayment', () => {
  assert.ok(ids('Can you send me the verification code you received by SMS?').includes('sms-code'));
  assert.ok(ids('Envoie-moi le code que tu as reçu par SMS').includes('sms-code'));
  assert.ok(ids('The money is on hold until you pay the insurance fee, it is refunded after delivery').includes('fee-to-release'));
  assert.ok(ids('El dinero queda retenido hasta que pagues el seguro').includes('fee-to-release'));
  assert.ok(ids('Send the deposit before the viewing, the keys will be sent by courier').includes('rental-deposit'));
  assert.ok(ids('Envie a caução antes da visita, as chaves serão enviadas por correio').includes('rental-deposit'));
  assert.ok(ids('I sent you too much by mistake, please refund the difference').includes('overpayment'));
  assert.ok(ids("J'ai envoyé trop par erreur, remboursez-moi la différence").includes('overpayment'));
});

test('weak signals alone do not alert; together they do', () => {
  assert.equal(alert('Estou fora do país neste momento.'), false);
  assert.equal(alert('Fala comigo pelo WhatsApp 912345678'), false);
  assert.equal(alert('Estou fora do país neste momento. Fala comigo pelo WhatsApp 912345678'), true);
});

test('ordinary marketplace conversations do not alert', () => {
  for (const t of [
    'Hello, is it still available? Can I pick it up tomorrow at 6pm?',
    'Olá, ainda está disponível? Posso ir buscar amanhã às 18h? Pago em dinheiro.',
    'Hola, ¿sigue disponible? ¿Aceptas 40 euros? Puedo recogerlo mañana.',
    'Bonjour, est-ce toujours disponible ? Je peux passer demain soir avec du liquide.',
    'Yes it is available. The price is firm. I can ship with OLX delivery.',
  ]) assert.equal(alert(t), false, t);
});

test('whole-page fallback only uses strong schemes', () => {
  const weak = 'Estou fora do país. Fala comigo pelo WhatsApp 912345678';
  assert.equal(chat.analyze(weak, { source: 'page', hostname: 'www.olx.pt' }).alert, false);
  const strong = 'Clica no link para receber o pagamento e introduz os dados do cartão';
  assert.equal(chat.analyze(strong, { source: 'page', hostname: 'www.olx.pt' }).alert, true);
});

test('results are serialisable', () => {
  assert.doesNotThrow(() => JSON.stringify(chat.analyze('click the link to receive the payment', { hostname: 'www.olx.pt' })));
});
