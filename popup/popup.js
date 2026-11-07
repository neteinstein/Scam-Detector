(async function () {
  const $ = (id) => document.getElementById(id);
  const { t, signalLabel, signalDetail, chatTitle } = self.SD.i18n;
  self.SD.i18n.applyToDocument(document);
  // ?tabId=<id> lets the page be opened as a normal tab (screenshots, debugging) and still show another tab's result.
  const forcedTabId = Number(new URLSearchParams(location.search).get('tabId'));
  let tab = null;
  if (forcedTabId) { try { tab = await chrome.tabs.get(forcedTabId); } catch (e) { tab = null; } }
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const VERDICT_TEXT = {
    danger: t('verdict_danger', [], 'Likely a scam'), warning: t('verdict_warning', [], 'Suspicious'), ok: t('verdict_ok', [], 'No scam signals found'), trusted: t('verdict_trusted', [], 'Trusted site'), skipped: t('verdict_skipped', [], 'Not analysed'),
  };

  function weightClass(w) { return w >= 20 ? 'hi' : w >= 10 ? 'mid' : 'lo'; }
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    return m < 2 ? t('ago_just', [], 'just updated') : m < 90 ? t('ago_min', [m], `updated ${m} min ago`) : m < 48 * 60 ? t('ago_h', [Math.round(m / 60)], `updated ${Math.round(m / 60)} h ago`) : t('ago_d', [Math.round(m / 1440)], `updated ${Math.round(m / 1440)} days ago`);
  }

  function render(result) {
    const verdict = result ? result.verdict : 'skipped';
    $('badge').className = 'badge ' + verdict;
    $('badge').textContent = verdict === 'danger' || verdict === 'warning' ? result.score : verdict === 'trusted' ? '✓' : verdict === 'ok' ? 'OK' : '–';
    $('title').textContent = VERDICT_TEXT[verdict] || verdict;
    $('host').textContent = result && result.hostname ? result.hostname : (tab.url || '');
    $('trust').classList.toggle('hidden', !result || verdict === 'trusted' || verdict === 'skipped');
    $('untrust').classList.toggle('hidden', !(result && verdict === 'trusted' && result.reason === 'allowlist'));

    const summary = $('summary');
    if (!result || verdict === 'skipped') summary.textContent = t('popup_cannot_analyse', [], 'This page cannot be analysed (browser page, local address or file).');
    else if (verdict === 'trusted') summary.textContent = result.reason === 'allowlist' ? t('popup_trusted_allowlist', [], 'You chose to trust this domain.') : t('popup_trusted_brand', [result.brand || t('popup_known', [], 'known')], `This is a ${result.brand || 'known'} domain.`);
    else if (verdict === 'ok') summary.textContent = result.signals.length ? t('popup_ok_minor', [result.score], `Risk score ${result.score}/100. Minor observations:`) : t('popup_ok_clean', [result.score], `Risk score ${result.score}/100. Nothing suspicious was detected, but stay alert: no tool catches every scam.`);
    else summary.textContent = result.signals.length === 1 ? t('popup_score_one', [result.score], `Risk score ${result.score}/100 based on 1 signal:`) : t('popup_score_many', [result.score, result.signals.length], `Risk score ${result.score}/100 based on ${result.signals.length} signals:`);

    const ul = $('signals');
    ul.innerHTML = '';
    for (const s of (result && result.signals) || []) {
      const li = document.createElement('li');
      const w = document.createElement('span'); w.className = 'w ' + weightClass(s.weight); w.textContent = '+' + s.weight;
      const body = document.createElement('div');
      const l = document.createElement('div'); l.textContent = signalLabel(s); body.appendChild(l);
      const det = signalDetail(s);
      if (det) { const d = document.createElement('div'); d.className = 'd'; d.textContent = det; body.appendChild(d); }
      li.appendChild(w); li.appendChild(body); ul.appendChild(li);
    }

    const meta = $('meta');
    meta.innerHTML = '';
    if (result && verdict !== 'skipped') {
      const rows = [];
      rows.push([t('meta_domain', [], 'Domain'), result.registrable || result.hostname]);
      const regDate = result.registrationDate ? String(result.registrationDate).slice(0, 10) : '';
      if (regDate) rows.push([t('meta_registered', [], 'Registered'), result.ageDays != null ? t('registered_days_ago', [regDate, Math.floor(result.ageDays)], `${regDate} (${Math.floor(result.ageDays)} days ago)`) : regDate]);
      else {
        const statusKey = { ok: 'rdap_unknown', 'no-date': 'rdap_no_date', 'not-found': 'rdap_not_found', disabled: 'rdap_disabled', 'free-hosting': 'rdap_free_hosting', timeout: 'rdap_timeout', error: 'rdap_error', skipped: 'rdap_na', unknown: 'rdap_unknown' }[result.rdapStatus];
        rows.push([t('meta_registered', [], 'Registered'), statusKey ? t(statusKey, [], result.rdapStatus) : result.rdapStatus]);
      }
      if (result.registrar) rows.push([t('meta_registrar', [], 'Registrar'), result.registrar]);
      if (result.lookalike) rows.push([t('meta_impersonates', [], 'Impersonates'), `${result.lookalike.brand} (${result.lookalike.reason})`]);
      if (result.feed) {
        const label = t('meta_reports', [], 'Phishing reports');
        if (!result.feed.enabled) rows.push([label, t('feed_disabled', [], 'feed disabled in settings')]);
        else if (!result.feed.updatedAt) rows.push([label, result.feed.lastError ? t('feed_not_downloaded', [result.feed.lastError], `feed not downloaded yet (${result.feed.lastError})`) : t('feed_downloading', [], 'feed downloading…')]);
        else {
          const what = result.phishReport ? (result.phishReport.kind === 'url' ? t('feed_page_reported', [], 'this page is reported') : t('feed_host_reports', [result.phishReport.count], `${result.phishReport.count} report(s) on this host`)) : t('feed_none', [], 'none for this page');
          rows.push([label, t('feed_line', [what, result.feed.count.toLocaleString(), ago(result.feed.updatedAt)], `${what} · feed of ${result.feed.count.toLocaleString()} sites, ${ago(result.feed.updatedAt)}`)]);
        }
      }
      if (result.safeBrowsing) {
        const sb = result.safeBrowsing;
        rows.push([t('meta_safebrowsing', [], 'Safe Browsing'), sb.error ? t('sb_failed', [sb.error], `lookup failed (${sb.error})`) : sb.threats.length ? t('sb_listed', [sb.threats.join(', ').toLowerCase()], `listed: ${sb.threats.join(', ').toLowerCase()} (advisory provided by Google)`) : t('sb_not_listed', [], 'not listed (advisory provided by Google)')]);
      }
      for (const [k, v] of rows) {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        meta.appendChild(dt); meta.appendChild(dd);
      }
    }
  }

  async function loadChat() {
    const box = $('chat');
    let r = null;
    try { r = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CHAT_RESULT' }); } catch (e) { r = null; }
    box.classList.toggle('hidden', !r);
    box.innerHTML = '';
    if (!r) return;
    const b = document.createElement('b'); b.textContent = t('chat_popup_prefix', [chatTitle(r.schemes[0])], 'Chat scam pattern: ' + r.schemes[0].title); box.appendChild(b);
    for (const s of r.schemes) { const d = document.createElement('div'); d.className = 'd'; d.textContent = `• ${chatTitle(s)} — "${s.match}"`; box.appendChild(d); }
  }

  async function load() {
    const result = await chrome.runtime.sendMessage({ type: 'GET_RESULT', tabId: tab.id, url: tab.url });
    render(result && !result.error ? result : null);
    loadChat();
  }

  $('rescan').addEventListener('click', async () => {
    $('title').textContent = t('popup_rescanning', [], 'Re-scanning…');
    await chrome.runtime.sendMessage({ type: 'RESCAN', tabId: tab.id });
    setTimeout(load, 800);
  });
  $('trust').addEventListener('click', async () => {
    const host = (() => { try { return new URL(tab.url).hostname; } catch (e) { return ''; } })();
    if (!host) return;
    await chrome.runtime.sendMessage({ type: 'TRUST_DOMAIN', hostname: host, tabId: tab.id });
    try { await chrome.tabs.sendMessage(tab.id, { type: 'HIDE_BANNER' }); } catch (e) { /* ignore */ }
    load();
  });
  $('untrust').addEventListener('click', async () => {
    const r = await chrome.runtime.sendMessage({ type: 'GET_RESULT', tabId: tab.id, url: tab.url });
    await chrome.runtime.sendMessage({ type: 'UNTRUST_DOMAIN', domain: r.registrable });
    await chrome.runtime.sendMessage({ type: 'RESCAN', tabId: tab.id });
    setTimeout(load, 800);
  });
  $('options').addEventListener('click', (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });

  load();
})();
