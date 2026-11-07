/*
 * Content script: collects page observations, asks the service worker for a
 * verdict and renders the warning banner (in a closed shadow root so page
 * CSS / scripts cannot restyle or easily remove it).
 */
(function () {
  if (window.top !== window) return; // top frame only (manifest also sets all_frames:false)
  const SD = self.SD;
  if (!SD || !SD.pageSignals) return;

  const BANNER_ID = 'scam-detector-banner-host';
  let dismissed = false;
  let rescans = 0;
  let lastSignature = '';
  let scanTimer = null;
  const MAX_RESCANS = 6;

  function collect(extraBrands) {
    try { return SD.pageSignals.collect(document, location, extraBrands); } catch (e) { return null; }
  }

  function signature(pageInfo) {
    if (!pageInfo) return '';
    return [pageInfo.hasPasswordField, pageInfo.hasCardField, pageInfo.hasSeedPhraseField, pageInfo.forms.length, pageInfo.titleBrands.join(','), pageInfo.phrases.length, pageInfo.brandAssets.length, pageInfo.links.mismatched, Math.round(pageInfo.textLength / 500)].join('|');
  }

  let customBrands = [];
  async function loadCustomBrands() {
    try { const s = await chrome.storage.sync.get('settings'); customBrands = (s.settings && s.settings.customBrands) || []; } catch (e) { customBrands = []; }
  }

  async function scan(force) {
    if (!chrome.runtime || !chrome.runtime.id) return; // extension reloaded
    if (force) await loadCustomBrands();
    const pageInfo = collect(customBrands);
    const sig = signature(pageInfo);
    if (!force && sig === lastSignature) return;
    lastSignature = sig;
    let result;
    try {
      result = await chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE', url: location.href, pageInfo });
    } catch (e) { return; }
    if (!result || result.error) return;
    render(result);
  }

  function scheduleScan() {
    if (rescans >= MAX_RESCANS) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => { rescans++; scan(false); }, 1500);
  }

  // ------------------------------------------------------------- banner
  function removeBanner() {
    const host = document.getElementById(BANNER_ID);
    if (host) host.remove();
  }

  function render(result) {
    const show = result.verdict === 'danger' || (result.verdict === 'warning' && result.settings && result.settings.showWarnBanner);
    if (!show || dismissed) { removeBanner(); return; }
    let host = document.getElementById(BANNER_ID);
    const danger = result.verdict === 'danger';
    const topSignals = (result.signals || []).slice(0, 4);

    if (!host) {
      host = document.createElement('div');
      host.id = BANNER_ID;
      host.setAttribute('style', 'all:initial !important; position:fixed !important; top:0 !important; left:0 !important; right:0 !important; z-index:2147483647 !important; display:block !important;');
      (document.body || document.documentElement).appendChild(host);
      host._shadow = host.attachShadow({ mode: 'closed' });
    }
    const root = host._shadow;
    if (!root) return;

    const color = danger ? '#b71c1c' : '#b45309';
    const bg = danger ? '#fdecea' : '#fff4e5';
    const title = danger ? 'This website is likely a scam' : 'This website looks suspicious';
    const sub = danger
      ? 'Do not enter passwords, card numbers or personal details here.'
      : 'Be careful before entering any personal or payment information.';

    root.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .bar { background: ${bg}; color: #1a1a1a; border-bottom: 4px solid ${color}; box-shadow: 0 2px 12px rgba(0,0,0,.25); padding: 12px 16px; font-size: 14px; line-height: 1.4; }
        .row { display: flex; align-items: flex-start; gap: 12px; max-width: 1200px; margin: 0 auto; }
        .icon { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; background: ${color}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 22px; }
        .body { flex: 1 1 auto; min-width: 0; }
        .title { font-weight: 700; font-size: 16px; color: ${color}; margin: 0 0 2px; }
        .sub { margin: 0; }
        .score { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 10px; background: ${color}; color: #fff; font-size: 12px; font-weight: 600; vertical-align: middle; }
        ul { margin: 6px 0 0; padding-left: 18px; }
        li { margin: 2px 0; }
        li small { color: #555; }
        .actions { flex: 0 0 auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
        button { cursor: pointer; border-radius: 6px; padding: 7px 12px; font-size: 13px; font-weight: 600; border: 1px solid ${color}; background: #fff; color: ${color}; }
        button.primary { background: ${color}; color: #fff; }
        button.link { border: none; background: transparent; color: #444; text-decoration: underline; font-weight: 500; padding: 7px 4px; }
        .details { display: none; }
        .details.open { display: block; }
        @media (max-width: 640px) { .row { flex-wrap: wrap; } .actions { width: 100%; justify-content: flex-start; } }
      </style>
      <div class="bar" role="alert" aria-live="assertive">
        <div class="row">
          <div class="icon" aria-hidden="true">!</div>
          <div class="body">
            <p class="title">${title}<span class="score">risk ${result.score}/100</span></p>
            <p class="sub">${sub} <span id="host"></span></p>
            <div class="details" id="details"><ul id="signals"></ul></div>
          </div>
          <div class="actions">
            <button class="primary" id="leave">Leave this site</button>
            <button id="why">Why?</button>
            <button class="link" id="trust" title="Never warn again for this domain">Trust this site</button>
            <button class="link" id="close" aria-label="Dismiss warning">Dismiss</button>
          </div>
        </div>
      </div>`;

    root.getElementById('host').textContent = `(${result.hostname})`;
    const ul = root.getElementById('signals');
    for (const s of topSignals) {
      const li = document.createElement('li');
      li.textContent = s.label;
      if (s.detail) { const sm = document.createElement('small'); sm.textContent = ' — ' + s.detail; li.appendChild(sm); }
      ul.appendChild(li);
    }
    if ((result.signals || []).length > topSignals.length) {
      const li = document.createElement('li');
      const sm = document.createElement('small');
      sm.textContent = `+ ${result.signals.length - topSignals.length} more (see the extension popup)`;
      li.appendChild(sm);
      ul.appendChild(li);
    }
    root.getElementById('why').addEventListener('click', () => root.getElementById('details').classList.toggle('open'));
    root.getElementById('close').addEventListener('click', () => { dismissed = true; removeBanner(); });
    root.getElementById('leave').addEventListener('click', () => {
      if (history.length > 1) history.back(); else location.replace('about:blank');
    });
    root.getElementById('trust').addEventListener('click', async () => {
      try { await chrome.runtime.sendMessage({ type: 'TRUST_DOMAIN', hostname: location.hostname }); } catch (e) { /* ignore */ }
      dismissed = true; removeBanner();
    });
  }

  // ---------------------------------------------------------- lifecycle
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'RESCAN') { dismissed = false; lastSignature = ''; scan(true).then(() => sendResponse({ ok: true })); return true; }
    if (msg && msg.type === 'HIDE_BANNER') { dismissed = true; removeBanner(); sendResponse({ ok: true }); }
    return false;
  });

  scan(true);
  // Phishing kits often inject the login form after load; re-scan on DOM changes for a while.
  try {
    const mo = new MutationObserver(() => scheduleScan());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 45000);
  } catch (e) { /* ignore */ }
  window.addEventListener('popstate', () => { lastSignature = ''; rescans = 0; scheduleScan(); });
})();
