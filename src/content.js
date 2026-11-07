/*
 * Content script: collects page observations, asks the service worker for a
 * verdict and renders warning banners (in a closed shadow root so page CSS /
 * scripts cannot restyle or easily remove them).
 *
 * Two independent monitors share one banner host:
 *  - page verdict (always on)
 *  - marketplace chat monitor (opt-in; OLX, Vinted, Wallapop, Leboncoin, ...)
 */
(function () {
  if (window.top !== window) return; // top frame only (manifest also sets all_frames:false)
  const SD = self.SD;
  if (!SD || !SD.pageSignals) return;

  const HOST_ID = 'scam-detector-banner-host';
  const MAX_RESCANS = 6;
  let settings = { customBrands: [], chatMonitorEnabled: false, chatMonitorDomains: [] };
  let pageDismissed = false;
  let chatDismissedSignature = '';
  let rescans = 0;
  let lastSignature = '';
  let scanTimer = null;
  let chatTimer = null;
  let lastChatSignature = '';
  let pageResult = null;
  let chatResult = null;

  async function loadSettings() {
    try {
      const s = await chrome.storage.sync.get('settings');
      settings = Object.assign({ customBrands: [], chatMonitorEnabled: false, chatMonitorDomains: [] }, s.settings || {});
    } catch (e) { /* keep defaults */ }
  }

  // ------------------------------------------------------------ page scan
  function collect() {
    try { return SD.pageSignals.collect(document, location, settings.customBrands); } catch (e) { return null; }
  }

  function signature(pageInfo) {
    if (!pageInfo) return '';
    return [pageInfo.hasPasswordField, pageInfo.hasCardField, pageInfo.hasSeedPhraseField, pageInfo.forms.length, pageInfo.titleBrands.join(','), pageInfo.phrases.length, pageInfo.brandAssets.length, pageInfo.links.mismatched, Math.round(pageInfo.textLength / 500)].join('|');
  }

  async function scan(force) {
    if (!chrome.runtime || !chrome.runtime.id) return; // extension reloaded
    if (force) await loadSettings();
    const pageInfo = collect();
    const sig = signature(pageInfo);
    if (!force && sig === lastSignature) return;
    lastSignature = sig;
    let result;
    try {
      result = await chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', url: location.href, pageInfo });
    } catch (e) { return; }
    if (!result || result.error) return;
    pageResult = result;
    render();
  }

  function scheduleScan() {
    if (rescans >= MAX_RESCANS) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => { rescans++; scan(false); }, 1500);
  }

  // ------------------------------------------------------------ chat scan
  const CHAT_SELECTOR = [
    '[role="log"]', '[aria-label*="chat" i]', '[aria-label*="conversa" i]', '[aria-label*="message" i]', '[aria-label*="mensag" i]',
    '[class*="chat" i]', '[class*="conversation" i]', '[class*="conversa" i]', '[class*="message" i]', '[class*="mensag" i]', '[class*="messenger" i]',
    '[id*="chat" i]', '[id*="conversation" i]', '[id*="message" i]', '[data-testid*="chat" i]', '[data-testid*="message" i]', '[data-testid*="conversation" i]',
    '[data-cy*="chat" i]', '[data-cy*="message" i]',
  ].join(',');

  function chatRegionText() {
    let nodes;
    try { nodes = Array.from(document.querySelectorAll(CHAT_SELECTOR)); } catch (e) { nodes = []; }
    // Keep only the outermost matching containers (so we do not count the same text many times)
    const outer = nodes.filter((n) => !nodes.some((o) => o !== n && o.contains(n)));
    const texts = [];
    for (const n of outer.slice(0, 40)) {
      let t = '';
      try { t = n.innerText || n.textContent || ''; } catch (e) { /* ignore */ }
      if (t && t.trim().length > 20) texts.push(t);
    }
    const joined = texts.join('\n').slice(0, 60000);
    return joined.length > 40 ? joined : '';
  }

  function chatActive() {
    return settings.chatMonitorEnabled && SD.chatSchemes && SD.chatSchemes.isMarketplace(location.hostname, settings.chatMonitorDomains);
  }

  function chatScan() {
    if (!chatActive()) { chatResult = null; render(); return; }
    let text = chatRegionText();
    let source = 'chat';
    if (!text) {
      try { text = (document.body && document.body.innerText) || ''; } catch (e) { text = ''; }
      text = text.slice(0, 120000);
      source = 'page';
    }
    const sig = source + ':' + text.length + ':' + text.slice(-200);
    if (sig === lastChatSignature) return;
    lastChatSignature = sig;
    let r = null;
    try { r = SD.chatSchemes.analyze(text, { source, hostname: location.hostname, customBrands: settings.customBrands }); } catch (e) { r = null; }
    chatResult = r && r.alert ? r : null;
    render();
  }

  function scheduleChatScan() {
    if (!chatActive()) return;
    clearTimeout(chatTimer);
    chatTimer = setTimeout(chatScan, 1200);
  }

  // ---------------------------------------------------------------- UI
  function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = HOST_ID;
      host.setAttribute('style', 'all:initial !important; position:fixed !important; top:0 !important; left:0 !important; right:0 !important; z-index:2147483647 !important; display:block !important;');
      (document.body || document.documentElement).appendChild(host);
      host._shadow = host.attachShadow({ mode: 'closed' });
      host._shadow.innerHTML = `
        <style>
          :host { all: initial; }
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          .bar { color: #1a1a1a; box-shadow: 0 2px 12px rgba(0,0,0,.25); padding: 12px 16px; font-size: 14px; line-height: 1.4; border-bottom: 4px solid var(--c); background: var(--bg); }
          .row { display: flex; align-items: flex-start; gap: 12px; max-width: 1200px; margin: 0 auto; }
          .icon { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; background: var(--c); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 22px; }
          .body { flex: 1 1 auto; min-width: 0; }
          .title { font-weight: 700; font-size: 16px; color: var(--c); margin: 0 0 2px; }
          .sub { margin: 0; }
          .score { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 10px; background: var(--c); color: #fff; font-size: 12px; font-weight: 600; vertical-align: middle; }
          ul { margin: 6px 0 0; padding-left: 18px; }
          li { margin: 2px 0; }
          li small { color: #555; }
          .advice { margin: 6px 0 0; color: #333; }
          .actions { flex: 0 0 auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
          button { cursor: pointer; border-radius: 6px; padding: 7px 12px; font-size: 13px; font-weight: 600; border: 1px solid var(--c); background: #fff; color: var(--c); }
          button.primary { background: var(--c); color: #fff; }
          button.link { border: none; background: transparent; color: #444; text-decoration: underline; font-weight: 500; padding: 7px 4px; }
          .details { display: none; }
          .details.open { display: block; }
          @media (max-width: 640px) { .row { flex-wrap: wrap; } .actions { width: 100%; justify-content: flex-start; } }
        </style>
        <div id="page-bar"></div>
        <div id="chat-bar"></div>`;
    }
    return host;
  }

  function removeHostIfEmpty() {
    const host = document.getElementById(HOST_ID);
    if (host && host._shadow && !host._shadow.getElementById('page-bar').firstChild && !host._shadow.getElementById('chat-bar').firstChild) host.remove();
  }

  function render() {
    renderPage();
    renderChat();
    removeHostIfEmpty();
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderPage() {
    const result = pageResult;
    const show = result && (result.verdict === 'danger' || (result.verdict === 'warning' && result.settings && result.settings.showWarnBanner));
    const host = document.getElementById(HOST_ID);
    if (!show || pageDismissed) { if (host && host._shadow) host._shadow.getElementById('page-bar').replaceChildren(); return; }
    const root = ensureHost()._shadow;
    const danger = result.verdict === 'danger';
    const color = danger ? '#b71c1c' : '#b45309';
    const bg = danger ? '#fdecea' : '#fff4e5';
    const topSignals = (result.signals || []).slice(0, 4);

    const bar = el('div', 'bar'); bar.style.setProperty('--c', color); bar.style.setProperty('--bg', bg); bar.setAttribute('role', 'alert');
    const row = el('div', 'row'); bar.appendChild(row);
    row.appendChild(el('div', 'icon', '!'));
    const body = el('div', 'body'); row.appendChild(body);
    const title = el('p', 'title', danger ? 'This website is likely a scam' : 'This website looks suspicious');
    title.appendChild(el('span', 'score', `risk ${result.score}/100`)); body.appendChild(title);
    body.appendChild(el('p', 'sub', (danger ? 'Do not enter passwords, card numbers or personal details here. ' : 'Be careful before entering any personal or payment information. ') + `(${result.hostname})`));
    const details = el('div', 'details'); const ul = el('ul'); details.appendChild(ul); body.appendChild(details);
    for (const s of topSignals) { const li = el('li', '', s.label); if (s.detail) li.appendChild(el('small', '', ' — ' + s.detail)); ul.appendChild(li); }
    if ((result.signals || []).length > topSignals.length) { const li = el('li'); li.appendChild(el('small', '', `+ ${result.signals.length - topSignals.length} more (see the extension popup)`)); ul.appendChild(li); }

    const actions = el('div', 'actions'); row.appendChild(actions);
    const leave = el('button', 'primary', 'Leave this site'); leave.id = 'leave';
    leave.addEventListener('click', () => { if (history.length > 1) history.back(); else location.replace('about:blank'); });
    const why = el('button', '', 'Why?'); why.id = 'why'; why.addEventListener('click', () => details.classList.toggle('open'));
    const trust = el('button', 'link', 'Trust this site'); trust.id = 'trust'; trust.title = 'Never warn again for this domain';
    trust.addEventListener('click', async () => { try { await chrome.runtime.sendMessage({ type: 'TRUST_DOMAIN', hostname: location.hostname }); } catch (e) { /* ignore */ } pageDismissed = true; render(); });
    const close = el('button', 'link', 'Dismiss'); close.id = 'close'; close.setAttribute('aria-label', 'Dismiss warning');
    close.addEventListener('click', () => { pageDismissed = true; render(); });
    actions.append(leave, why, trust, close);
    root.getElementById('page-bar').replaceChildren(bar);
  }

  function renderChat() {
    const r = chatResult;
    const host = document.getElementById(HOST_ID);
    const sig = r ? r.schemes.map((s) => s.id).join(',') : '';
    if (!r || sig === chatDismissedSignature) { if (host && host._shadow) host._shadow.getElementById('chat-bar').replaceChildren(); return; }
    const root = ensureHost()._shadow;
    const color = r.score >= 30 ? '#b71c1c' : '#1d4ed8';
    const bg = r.score >= 30 ? '#fdecea' : '#e8f0fe';
    const main = r.schemes[0];

    const bar = el('div', 'bar'); bar.style.setProperty('--c', color); bar.style.setProperty('--bg', bg); bar.setAttribute('role', 'alert');
    const row = el('div', 'row'); bar.appendChild(row);
    row.appendChild(el('div', 'icon', '💬'));
    const body = el('div', 'body'); row.appendChild(body);
    const title = el('p', 'title', 'This conversation matches a known scam pattern');
    title.appendChild(el('span', 'score', `${r.schemes.length} pattern${r.schemes.length > 1 ? 's' : ''}`)); body.appendChild(title);
    body.appendChild(el('p', 'sub', main.title));
    body.appendChild(el('p', 'advice', main.advice));
    const details = el('div', 'details'); const ul = el('ul'); details.appendChild(ul); body.appendChild(details);
    for (const s of r.schemes) { const li = el('li', '', s.title); li.appendChild(el('small', '', ` — "${s.match}"`)); ul.appendChild(li); }

    const actions = el('div', 'actions'); row.appendChild(actions);
    const why = el('button', '', 'Details'); why.id = 'chat-why'; why.addEventListener('click', () => details.classList.toggle('open'));
    const close = el('button', 'link', 'Dismiss'); close.id = 'chat-close';
    close.addEventListener('click', () => { chatDismissedSignature = sig; render(); });
    actions.append(why, close);
    root.getElementById('chat-bar').replaceChildren(bar);
  }

  // ---------------------------------------------------------- lifecycle
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'RESCAN') { pageDismissed = false; chatDismissedSignature = ''; lastSignature = ''; lastChatSignature = ''; scan(true).then(() => { chatScan(); sendResponse({ ok: true }); }); return true; }
    if (msg && msg.type === 'HIDE_BANNER') { pageDismissed = true; render(); sendResponse({ ok: true }); }
    if (msg && msg.type === 'GET_CHAT_RESULT') { sendResponse(chatResult); }
    return false;
  });
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.settings) { loadSettings().then(() => { lastChatSignature = ''; chatScan(); }); }
    });
  } catch (e) { /* ignore */ }

  scan(true).then(() => chatScan());
  try {
    // Phishing kits often inject the login form after load: re-scan the page for a while.
    const mo = new MutationObserver(() => scheduleScan());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 45000);
    // Chats are live: keep watching for as long as the page is open (debounced).
    const chatMo = new MutationObserver(() => scheduleChatScan());
    chatMo.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  } catch (e) { /* ignore */ }
  window.addEventListener('popstate', () => { lastSignature = ''; lastChatSignature = ''; rescans = 0; scheduleScan(); scheduleChatScan(); });
})();
