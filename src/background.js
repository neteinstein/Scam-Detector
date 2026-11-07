/*
 * Service worker: domain intelligence (RDAP registration age with caching),
 * scoring, per-tab result storage and toolbar badge.
 */
importScripts(
  'lib/punycode.js', 'lib/domain.js', 'lib/brands.js', 'lib/tlds.js', 'lib/phrases.js', 'lib/lookalike.js', 'lib/scoring.js', 'lib/urlmatch.js'
);

const { domain, scoring, urlmatch } = self.SD;
const VERSION = chrome.runtime.getManifest().version;

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

// ------------------------------------------- PhishTank reports feed (local)
// The verified-online feed is downloaded a few times a day and stored as
// truncated hashes. Lookups are local: no visited URL is ever sent out.
const FEED_KEY = 'feed:phishtank';
const FEED_META_KEY = 'feedmeta:phishtank';
const FEED_URL = 'https://data.phishtank.com/data/online-valid.csv.gz';
const FEED_URL_KEYED = (key) => `https://data.phishtank.com/data/${encodeURIComponent(key)}/online-valid.csv.gz`;
const FEED_REFRESH_MINUTES = 6 * 60;
let feedIndexCache = null;   // in-memory copy for this worker lifetime
let feedUpdating = null;

async function getFeedMeta() {
  return (await chrome.storage.local.get(FEED_META_KEY))[FEED_META_KEY] || { updatedAt: 0, count: 0, hosts: 0, etag: '', lastError: '', lastAttempt: 0 };
}

async function loadFeedIndex() {
  if (feedIndexCache) return feedIndexCache;
  const stored = (await chrome.storage.local.get(FEED_KEY))[FEED_KEY];
  // An index built with older matching rules is discarded and rebuilt.
  feedIndexCache = stored && stored.v === urlmatch.INDEX_VERSION ? stored : null;
  return feedIndexCache;
}

async function downloadFeedText(settings) {
  const url = settings.phishtankAppKey ? FEED_URL_KEYED(settings.phishtankAppKey) : FEED_URL;
  const res = await fetch(url, { redirect: 'follow', cache: 'no-store', credentials: 'omit' });
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
  const etag = res.headers.get('etag') || '';
  const type = (res.headers.get('content-type') || '').toLowerCase();
  const finalUrl = res.url || url;
  let text;
  if (type.includes('gzip') || /\.gz(\?|$)/.test(finalUrl)) {
    try {
      text = await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).text();
    } catch (e) {
      // Some proxies decode transparently; fall back to the plain CSV.
      const plain = await fetch(url.replace(/\.gz$/, ''), { redirect: 'follow', cache: 'no-store', credentials: 'omit' });
      if (!plain.ok) throw new Error(`feed HTTP ${plain.status}`);
      text = await plain.text();
    }
  } else {
    text = await res.text();
  }
  return { text, etag };
}

async function updateFeed(force) {
  if (feedUpdating) return feedUpdating;
  feedUpdating = (async () => {
    const settings = await getSettings();
    const meta = await getFeedMeta();
    if (!settings.phishFeedEnabled) return meta;
    const rebuild = !(await loadFeedIndex()); // missing or built with older rules
    if (rebuild) meta.etag = '';
    if (!force && !rebuild && meta.updatedAt && Date.now() - meta.updatedAt < FEED_REFRESH_MINUTES * 60 * 1000) return meta;
    if (!force && meta.lastAttempt && Date.now() - meta.lastAttempt < 15 * 60 * 1000) return meta; // back off after a failure
    meta.lastAttempt = Date.now();
    try {
      const { text, etag } = await downloadFeedText(settings);
      if (etag && etag === meta.etag && meta.count) {
        meta.updatedAt = Date.now(); meta.lastError = '';
      } else {
        const records = urlmatch.parsePhishTankCsv(text);
        if (records.length < 1000) throw new Error('feed looks truncated (' + records.length + ' rows)');
        const index = await urlmatch.buildIndex(records);
        await chrome.storage.local.set({ [FEED_KEY]: index });
        feedIndexCache = index;
        Object.assign(meta, { updatedAt: Date.now(), count: index.count, hosts: Object.keys(index.hosts).length, etag, lastError: '' });
      }
    } catch (e) {
      meta.lastError = String(e && e.message || e).slice(0, 160);
    }
    await chrome.storage.local.set({ [FEED_META_KEY]: meta });
    return meta;
  })().finally(() => { feedUpdating = null; });
  return feedUpdating;
}

async function lookupPhishReport(url, settings) {
  if (!settings.phishFeedEnabled) return null;
  const index = await loadFeedIndex();
  if (!index) { updateFeed(false); return null; }
  const hit = await urlmatch.lookup(index, url);
  if (!hit) return null;
  return { kind: hit.kind, count: hit.count, key: hit.key };
}

// ------------------------------------------- Google Safe Browsing (opt-in)
// Only runs when the user turned it on and supplied their own API key. The
// page URL is sent to Google; results are cached for the duration Google
// allows (never more than 30 minutes).
const SB_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=';
const SB_MAX_CACHE_MS = 30 * 60 * 1000;
const SB_NEGATIVE_CACHE_MS = 5 * 60 * 1000;

function parseDuration(d) {
  const m = String(d || '').match(/^([\d.]+)s$/);
  return m ? Number(m[1]) * 1000 : 0;
}

async function lookupSafeBrowsing(url, settings) {
  if (!settings.safeBrowsingEnabled || !settings.safeBrowsingApiKey) return undefined;
  const cacheKey = 'sb:' + (await urlmatch.hashKey(url));
  const cached = (await chrome.storage.session.get(cacheKey))[cacheKey];
  if (cached && cached.until > Date.now()) return { threats: cached.threats, cached: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(SB_ENDPOINT + encodeURIComponent(settings.safeBrowsingApiKey), {
      method: 'POST', signal: ctrl.signal, credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'scam-detector-extension', clientVersion: VERSION },
        threatInfo: {
          threatTypes: ['SOCIAL_ENGINEERING', 'MALWARE', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'], threatEntries: [{ url }],
        },
      }),
    });
    if (!res.ok) return { threats: [], error: `HTTP ${res.status}` };
    const json = await res.json();
    const matches = Array.isArray(json.matches) ? json.matches : [];
    const threats = Array.from(new Set(matches.map((m) => m.threatType)));
    const ttl = matches.length ? Math.min(SB_MAX_CACHE_MS, Math.max(...matches.map((m) => parseDuration(m.cacheDuration))) || SB_NEGATIVE_CACHE_MS) : SB_NEGATIVE_CACHE_MS;
    await chrome.storage.session.set({ [cacheKey]: { threats, until: Date.now() + ttl } });
    return { threats };
  } catch (e) {
    return { threats: [], error: String(e && e.message || e).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
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
  const [domainInfo, phishReport, safeBrowsing] = await Promise.all([
    buildDomainInfo(hostname, settings), lookupPhishReport(url, settings), lookupSafeBrowsing(url, settings),
  ]);
  domainInfo.phishReport = phishReport;
  domainInfo.safeBrowsing = safeBrowsing;
  const result = scoring.evaluate(domainInfo, pageInfo, settings);
  result.url = url;
  result.registrar = domainInfo.registrar;
  result.phishReport = phishReport;
  result.safeBrowsing = safeBrowsing === undefined ? null : { threats: safeBrowsing.threats || [], error: safeBrowsing.error || '' };
  const feedMeta = await getFeedMeta();
  result.feed = { enabled: !!settings.phishFeedEnabled, updatedAt: feedMeta.updatedAt, count: feedMeta.count, lastError: feedMeta.lastError };
  result.analyzedAt = Date.now();
  result.settings = { dangerThreshold: settings.dangerThreshold, warnThreshold: settings.warnThreshold, showWarnBanner: settings.showWarnBanner };
  if (tabId != null) {
    await chrome.storage.session.set({ [RESULT_PREFIX + tabId]: result });
    updateBadge(tabId, result);
  }
  return result;
}

function updateBadge(tabId, result) {
  const b = scoring.badgeFor(result);
  chrome.action.setBadgeText({ tabId, text: b.text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ tabId, color: b.color }).catch(() => {});
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
          const trustTab = msg.tabId != null ? msg.tabId : (sender && sender.tab ? sender.tab.id : null);
          if (trustTab != null) {
            const key = RESULT_PREFIX + trustTab;
            const r = (await chrome.storage.session.get(key))[key];
            if (r) { r.verdict = 'trusted'; r.reason = 'allowlist'; await chrome.storage.session.set({ [key]: r }); updateBadge(trustTab, r); }
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
        case 'FEED_STATUS': {
          const s = await getSettings();
          const meta = await getFeedMeta();
          sendResponse(Object.assign({ enabled: !!s.phishFeedEnabled, updating: !!feedUpdating }, meta));
          break;
        }
        case 'FEED_UPDATE': {
          sendResponse(await updateFeed(true));
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

// Periodic jobs: feed refresh and lookup-cache sweep.
chrome.runtime.onInstalled.addListener((details) => {
  // First install: explain what the extension does and, above all, what it cannot catch.
  if (details && details.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') }).catch(() => {});
  chrome.alarms.create('sweep-cache', { periodInMinutes: 24 * 60 });
  chrome.alarms.create('feed-update', { delayInMinutes: 1, periodInMinutes: FEED_REFRESH_MINUTES });
  updateFeed(false);
});
chrome.runtime.onStartup.addListener(() => { updateFeed(false); });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'feed-update') { await updateFeed(false); return; }
  if (alarm.name !== 'sweep-cache') return;
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const stale = Object.entries(all).filter(([k, v]) => k.startsWith(CACHE_PREFIX) && v && v.expires < now).map(([k]) => k);
  if (stale.length) await chrome.storage.local.remove(stale);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) {
    const next = (changes.settings.newValue || {});
    const prev = (changes.settings.oldValue || {});
    if (next.phishFeedEnabled && (!prev.phishFeedEnabled || next.phishtankAppKey !== prev.phishtankAppKey)) updateFeed(true);
    if (!next.phishFeedEnabled && prev.phishFeedEnabled) { chrome.storage.local.remove([FEED_KEY, FEED_META_KEY]); feedIndexCache = null; }
  }
});
