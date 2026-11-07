(async function () {
  const $ = (id) => document.getElementById(id);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const VERDICT_TEXT = {
    danger: 'Likely a scam', warning: 'Suspicious', ok: 'No scam signals found', trusted: 'Trusted site', skipped: 'Not analysed',
  };

  function weightClass(w) { return w >= 20 ? 'hi' : w >= 10 ? 'mid' : 'lo'; }

  function render(result) {
    const verdict = result ? result.verdict : 'skipped';
    $('badge').className = 'badge ' + verdict;
    $('badge').textContent = verdict === 'danger' || verdict === 'warning' ? result.score : verdict === 'trusted' ? '✓' : verdict === 'ok' ? 'OK' : '–';
    $('title').textContent = VERDICT_TEXT[verdict] || verdict;
    $('host').textContent = result && result.hostname ? result.hostname : (tab.url || '');
    $('trust').classList.toggle('hidden', !result || verdict === 'trusted' || verdict === 'skipped');
    $('untrust').classList.toggle('hidden', !(result && verdict === 'trusted' && result.reason === 'allowlist'));

    const summary = $('summary');
    if (!result || verdict === 'skipped') summary.textContent = 'This page cannot be analysed (browser page, local address or file).';
    else if (verdict === 'trusted') summary.textContent = result.reason === 'allowlist' ? 'You chose to trust this domain.' : `This is a ${result.brand || 'known'} domain.`;
    else if (verdict === 'ok') summary.textContent = `Risk score ${result.score}/100. ${result.signals.length ? 'Minor observations:' : 'Nothing suspicious was detected, but stay alert: no tool catches every scam.'}`;
    else summary.textContent = `Risk score ${result.score}/100 based on ${result.signals.length} signal${result.signals.length === 1 ? '' : 's'}:`;

    const ul = $('signals');
    ul.innerHTML = '';
    for (const s of (result && result.signals) || []) {
      const li = document.createElement('li');
      const w = document.createElement('span'); w.className = 'w ' + weightClass(s.weight); w.textContent = '+' + s.weight;
      const body = document.createElement('div');
      const l = document.createElement('div'); l.textContent = s.label; body.appendChild(l);
      if (s.detail) { const d = document.createElement('div'); d.className = 'd'; d.textContent = s.detail; body.appendChild(d); }
      li.appendChild(w); li.appendChild(body); ul.appendChild(li);
    }

    const meta = $('meta');
    meta.innerHTML = '';
    if (result && verdict !== 'skipped') {
      const rows = [];
      rows.push(['Domain', result.registrable || result.hostname]);
      if (result.registrationDate) rows.push(['Registered', String(result.registrationDate).slice(0, 10) + (result.ageDays != null ? ` (${Math.floor(result.ageDays)} days ago)` : '')]);
      else rows.push(['Registered', { ok: 'unknown', 'no-date': 'registry does not publish', 'not-found': 'not in RDAP', disabled: 'lookup disabled in settings', 'free-hosting': 'shared hosting platform', timeout: 'lookup timed out', error: 'lookup failed', skipped: 'n/a', unknown: 'unknown' }[result.rdapStatus] || result.rdapStatus]);
      if (result.registrar) rows.push(['Registrar', result.registrar]);
      if (result.lookalike) rows.push(['Impersonates', `${result.lookalike.brand} (${result.lookalike.reason})`]);
      for (const [k, v] of rows) {
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        meta.appendChild(dt); meta.appendChild(dd);
      }
    }
  }

  async function load() {
    const result = await chrome.runtime.sendMessage({ type: 'GET_RESULT', tabId: tab.id, url: tab.url });
    render(result && !result.error ? result : null);
  }

  $('rescan').addEventListener('click', async () => {
    $('title').textContent = 'Re-scanning…';
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
