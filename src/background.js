/*
 * Service worker: domain intelligence (RDAP registration age with caching),
 * scoring, per-tab result storage and toolbar badge.
 */
importScripts(
  'lib/punycode.js', 'lib/domain.js', 'lib/brands.js', 'lib/tlds.js', 'lib/phrases.js', 'lib/lookalike.js', 'lib/scoring.js'
);

const { domain, scoring } = self.SD;

const RDAP_BOOTSTRAP = 'https://rdap.org/domain/';
const RDAP_TIMEOUT_MS = 7000;
const CACHE_TTL_OK_MS = 7 * 24 * 60 * 60 * 1000;      // registration dates do not change
const CACHE_TTL_FAIL_MS = 6 * 60 * 60 * 1000;         // retry failed lookups after a while
const CACHE_PREFIX = 'rdap:';
const RESULT_PREFIX = 'result:';

// ---------------------------------------------------------------- settings
async function getSettings() {
  const stored = await chrome.storage.sync.get('settings');
  return Object.assign({}, scoring.DEFAULT_SETTINGS, stored.settings || {});
}

async function saveSettings(patch) {
  const current = await getSettings();
  const next = Object.assign({}, current, patch);
  await chrome.storage.sync.set({ settings: next });
  return next;
}

// ------------------------------------------------------------------- RDAP
function parseRdapRegistration(json) {
  const events = Array.isArray(json && json.events) ? json.events : [];
  const reg = events.find((e) => /^registration$/i.test(e.eventAction || ''));
  if (reg && reg.eventDate) return reg.eventDate;
  // Some registries only expose "last changed" / "expiration"; expiration - 1y
  // is a weak proxy for the most recent renewal, which we do not use.
  return null;
}

function registrarName(json) {
  try {
    const ents = Array.isArray(json.entities) ? json.entities : [];
    const r = ents.find((e) => (e.roles || []).includes('registrar'));
    const vcard = r && Array.isArray(r.vcardArray) ? r.vcardArray[1] : null;
    const fn = vcard && vcard.find((x) => x[0] === 'fn');
    return fn ? String(fn[3]).slice(0, 80) : '';
  } catch (e) { return ''; }
}

async function fetchRdap(registrable) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RDAP_TIMEOUT_MS);
  try {
    const res = await fetch(RDAP_BOOTSTRAP + encodeURIComponent(registrable), {
      headers: { Accept: 'application/rdap+json, application/json' }, signal: ctrl.signal, redirect: 'follow', cache: 'no-store', credentials: 'omit',
    });
    if (res.status === 404) return { status: 'not-found' };
    if (!res.ok) return { status: 'error', detail: `HTTP ${res.status}` };
    const json = await res.json();
    const registrationDate = parseRdapRegistration(json);
    return { status: registrationDate ? 'ok' : 'no-date', registrationDate, registrar: registrarName(json) };
  } catch (e) {
    return { status: e.name === 'AbortError' ? 'timeout' : 'error', detail: String(e && e.message || e).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

async function lookupDomainAge(registrable) {
  const key = CACHE_PREFIX + registrable;
  const cached = (await chrome.storage.local.get(key))[key];
  const now = Date.now();
  if (cached && cached.expires > now) return cached.value;
  const value = await fetchRdap(registrable);
  value.fetchedAt = now;
  const ttl = value.status === 'ok' || value.status === 'no-date' || value.status === 'not-found' ? CACHE_TTL_OK_MS : CACHE_TTL_FAIL_MS;
  await chrome.storage.local.set({ [key]: { value, expires: now + ttl } });
  return value;
}

async function buildDomainInfo(hostname, settings) {
  const parsed = domain.parse(hostname);
  const info = { hostname, registrable: parsed.registrable, ageDays: null, registrationDate: null, rdapStatus: 'skipped', registrar: '' };
  if (!settings.rdapEnabled) { info.rdapStatus = 'disabled'; return info; }
  if (parsed.isIP || domain.isLocalHost(hostname) || !parsed.registrable.includes('.')) return info;
  // Free-hosting tenants: the registrable domain belongs to the host, not the site.
  if (parsed.freeHosting) { info.rdapStatus = 'free-hosting'; return info; }
  const r = await lookupDomainAge(parsed.registrable);
  info.rdapStatus = r.status;
  info.registrar = r.registrar || '';
  if (r.status === 'ok' && r.registrationDate) {
    const t = Date.parse(r.registrationDate);
    if (!Number.isNaN(t)) {
      info.registrationDate = r.registrationDate;
      info.ageDays = Math.max(0, (Date.now() - t) / 86400000);
    }
  }
  return info;
}

// --------------------------------------------------------------- analysis
async function analyze(url, pageInfo, tabId) {
  let hostname = '', protocol = '';
  try { const u = new URL(url); hostname = u.hostname; protocol = u.protocol; } catch (e) { /* ignore */ }
  if (protocol !== 'http:' && protocol !== 'https:') {
    const skipped = { hostname, url, score: 0, verdict: 'skipped', reason: 'non-web', signals: [], analyzedAt: Date.now() };
    if (tabId != null) { await chrome.storage.session.set({ [RESULT_PREFIX + tabId]: skipped }); updateBadge(tabId, skipped); }
    return skipped;
  }
  const settings = await getSettings();
  const domainInfo = await buildDomainInfo(hostname, settings);
  const result = scoring.evaluate(domainInfo, pageInfo, settings);
  result.url = url;
  result.registrar = domainInfo.registrar;
  result.analyzedAt = Date.now();
  result.settings = { dangerThreshold: settings.dangerThreshold, warnThreshold: settings.warnThreshold, showWarnBanner: settings.showWarnBanner };
  if (tabId != null) {
    await chrome.storage.session.set({ [RESULT_PREFIX + tabId]: result });
    updateBadge(tabId, result);
  }
  return result;
}

function updateBadge(tabId, result) {
  const colors = { danger: '#d32f2f', warning: '#f59e0b', ok: '#2e7d32', trusted: '#2e7d32', skipped: '#9e9e9e' };
  const text = result.verdict === 'danger' || result.verdict === 'warning' ? String(result.score) : result.verdict === 'trusted' ? '✓' : '';
  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ tabId, color: colors[result.verdict] || '#9e9e9e' }).catch(() => {});
  if (chrome.action.setBadgeTextColor) chrome.action.setBadgeTextColor({ tabId, color: '#ffffff' }).catch(() => {});
}

// --------------------------------------------------------------- messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg && msg.type) {
        case 'ANALYZE_PAGE': {
          const tabId = sender.tab ? sender.tab.id : null;
          sendResponse(await analyze(msg.url || (sender.tab && sender.tab.url), msg.pageInfo, tabId));
          break;
        }
        case 'GET_RESULT': {
          const tabId = msg.tabId;
          const key = RESULT_PREFIX + tabId;
          let result = (await chrome.storage.session.get(key))[key] || null;
          if (!result && msg.url) result = await analyze(msg.url, null, tabId);
          sendResponse(result);
          break;
        }
        case 'RESCAN': {
          const tabId = msg.tabId;
          try { await chrome.tabs.sendMessage(tabId, { type: 'RESCAN' }); } catch (e) { /* no content script (e.g. chrome:// page) */ }
          sendResponse({ ok: true });
          break;
        }
        case 'GET_SETTINGS':
          sendResponse(await getSettings());
          break;
        case 'SAVE_SETTINGS':
          sendResponse(await saveSettings(msg.patch || {}));
          break;
        case 'TRUST_DOMAIN': {
          const s = await getSettings();
          const d = domain.parse(msg.hostname).registrable || domain.normalizeHost(msg.hostname);
          if (d && !s.allowlist.includes(d)) s.allowlist = s.allowlist.concat([d]);
          await saveSettings({ allowlist: s.allowlist });
          if (msg.tabId != null) {
            const key = RESULT_PREFIX + msg.tabId;
            const r = (await chrome.storage.session.get(key))[key];
            if (r) { r.verdict = 'trusted'; r.reason = 'allowlist'; await chrome.storage.session.set({ [key]: r }); updateBadge(msg.tabId, r); }
          }
          sendResponse({ ok: true, domain: d });
          break;
        }
        case 'UNTRUST_DOMAIN': {
          const s = await getSettings();
          await saveSettings({ allowlist: s.allowlist.filter((x) => x !== msg.domain) });
          sendResponse({ ok: true });
          break;
        }
        case 'CLEAR_CACHE': {
          const all = await chrome.storage.local.get(null);
          await chrome.storage.local.remove(Object.keys(all).filter((k) => k.startsWith(CACHE_PREFIX)));
          sendResponse({ ok: true });
          break;
        }
        default:
          sendResponse({ error: 'unknown message' });
      }
    } catch (e) {
      sendResponse({ error: String(e && e.message || e) });
    }
  })();
  return true; // keep the channel open for the async response
});

// Clear stale per-tab results so the popup never shows another page's verdict.
chrome.tabs.onRemoved.addListener((tabId) => { chrome.storage.session.remove(RESULT_PREFIX + tabId).catch(() => {}); });
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading' && change.url) {
    chrome.storage.session.remove(RESULT_PREFIX + tabId).catch(() => {});
    chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  }
});

// Periodic cache sweep so storage.local does not grow forever.
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('sweep-cache', { periodInMinutes: 24 * 60 }); });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'sweep-cache') return;
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const stale = Object.entries(all).filter(([k, v]) => k.startsWith(CACHE_PREFIX) && v && v.expires < now).map(([k]) => k);
  if (stale.length) await chrome.storage.local.remove(stale);
});
