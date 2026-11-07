(async function () {
  const $ = (id) => document.getElementById(id);
  let settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

  function renderAllowlist() {
    const ul = $('allowlist');
    ul.innerHTML = '';
    if (!settings.allowlist.length) { const li = document.createElement('li'); li.textContent = 'None yet.'; li.style.color = '#777'; ul.appendChild(li); }
    for (const d of settings.allowlist) {
      const li = document.createElement('li');
      const span = document.createElement('span'); span.textContent = d;
      const btn = document.createElement('button'); btn.textContent = 'Remove';
      btn.addEventListener('click', () => { settings.allowlist = settings.allowlist.filter((x) => x !== d); renderAllowlist(); });
      li.appendChild(span); li.appendChild(btn); ul.appendChild(li);
    }
  }

  function brandsToText(list) {
    return (list || []).map((b) => `${b.name} | ${(b.keywords || []).join(', ')} | ${(b.domains || []).join(', ')}`).join('\n');
  }
  function textToBrands(text) {
    return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
      const [name, kw, dom] = line.split('|').map((s) => (s || '').trim());
      const keywords = (kw || '').split(',').map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
      const domains = (dom || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      return name && keywords.length ? { name, keywords, domains } : null;
    }).filter(Boolean);
  }

  $('dangerThreshold').value = settings.dangerThreshold;
  $('warnThreshold').value = settings.warnThreshold;
  $('showWarnBanner').checked = !!settings.showWarnBanner;
  $('rdapEnabled').checked = !!settings.rdapEnabled;
  $('customBrands').value = brandsToText(settings.customBrands);
  $('phishFeedEnabled').checked = settings.phishFeedEnabled !== false;
  $('phishtankAppKey').value = settings.phishtankAppKey || '';
  $('safeBrowsingEnabled').checked = !!settings.safeBrowsingEnabled;
  $('safeBrowsingApiKey').value = settings.safeBrowsingApiKey || '';
  async function feedStatus() {
    const st = await chrome.runtime.sendMessage({ type: 'FEED_STATUS' });
    if (!st) return;
    $('feedStatus').textContent = !st.enabled ? 'Feed disabled.' : st.updating ? 'Updating…' : st.updatedAt ? `${st.count.toLocaleString()} reported addresses, updated ${new Date(st.updatedAt).toLocaleString()}${st.lastError ? ' (last attempt failed: ' + st.lastError + ')' : ''}` : st.lastError ? 'Not downloaded yet: ' + st.lastError : 'Not downloaded yet.';
  }
  feedStatus();
  $('feedUpdate').addEventListener('click', async () => { $('feedStatus').textContent = 'Updating…'; await chrome.runtime.sendMessage({ type: 'FEED_UPDATE' }); feedStatus(); });
  $('chatMonitorEnabled').checked = !!settings.chatMonitorEnabled;
  $('chatMonitorDomains').value = (settings.chatMonitorDomains || []).join('\n');
  renderAllowlist();

  $('addAllow').addEventListener('click', () => {
    const v = $('newAllow').value.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (v && !settings.allowlist.includes(v)) settings.allowlist.push(v);
    $('newAllow').value = '';
    renderAllowlist();
  });
  $('clearCache').addEventListener('click', async () => { await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }); $('status').textContent = 'Cache cleared.'; });
  $('save').addEventListener('click', async () => {
    const danger = Math.max(1, Math.min(100, Number($('dangerThreshold').value) || 60));
    const warn = Math.max(1, Math.min(danger, Number($('warnThreshold').value) || 35));
    settings = await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', patch: {
      dangerThreshold: danger, warnThreshold: warn, showWarnBanner: $('showWarnBanner').checked, rdapEnabled: $('rdapEnabled').checked,
      allowlist: settings.allowlist, customBrands: textToBrands($('customBrands').value),
      phishFeedEnabled: $('phishFeedEnabled').checked, phishtankAppKey: $('phishtankAppKey').value.trim(),
      safeBrowsingEnabled: $('safeBrowsingEnabled').checked && !!$('safeBrowsingApiKey').value.trim(), safeBrowsingApiKey: $('safeBrowsingApiKey').value.trim(),
      chatMonitorEnabled: $('chatMonitorEnabled').checked,
      chatMonitorDomains: $('chatMonitorDomains').value.split('\n').map((l) => l.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]).filter(Boolean),
    } });
    $('dangerThreshold').value = settings.dangerThreshold; $('warnThreshold').value = settings.warnThreshold;
    $('status').textContent = 'Saved.';
    feedStatus();
    setTimeout(() => { $('status').textContent = ''; }, 2000);
  });
})();
