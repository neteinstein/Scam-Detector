/*
 * Matching of visited URLs against locally stored phishing reports (PhishTank
 * verified-online feed). The feed is stored as truncated SHA-256 hashes of
 * normalised URLs, so the stored data cannot be read back as a list of sites
 * and lookups never leave the browser.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'), require('./brands.js'));
  else { root.SD = root.SD || {}; root.SD.urlmatch = factory(root.SD.domain, root.SD.brands); }
})(typeof self !== 'undefined' ? self : this, function (domain, brands) {
  // Hosts where many unrelated people publish content, so a report against one
  // page says nothing about the host. Host-level matches are never raised for
  // these; URL-level matches still are.
  const SHARED_HOSTS = new Set([
    'qrco.de', 'q-r.to', 'l.ead.me', 'bit.ly', 'bitly.com', 'tinyurl.com', 'cutt.ly', 'rebrand.ly', 't.co', 'goo.gl', 'is.gd', 'ow.ly',
    'rb.gy', 't.ly', 'shorturl.at', 'tiny.cc', 'linktr.ee', 'lnkd.in', 'docs.google.com', 'sites.google.com', 'forms.gle', 'drive.google.com',
    'storage.googleapis.com', 'script.google.com', 'lookerstudio.google.com', 'new.express.adobe.com', 'express.adobe.com', 'www.dropbox.com',
    'dropbox.com', 'dl.dropboxusercontent.com', 'onedrive.live.com', '1drv.ms', 'sharepoint.com', 'forms.office.com', 'sway.office.com',
    'www.canva.com', 'canva.site', 'www.notion.so', 'notion.site', 'square.site', 'weebly.com', 'wixsite.com', 'godaddysites.com',
    'webflow.io', 'glitch.me', 'pages.dev', 'workers.dev', 'web.app', 'firebaseapp.com', 'github.io', 'netlify.app', 'vercel.app',
    'ipfs.io', 'ipfs.dweb.link', 'cloudfront.net', 'amazonaws.com', 'blob.core.windows.net', 'web.core.windows.net', 'azurewebsites.net',
    'r2.dev', 'b-cdn.net', 'surveymonkey.com', 'typeform.com', 'jotform.com', 'hubspotpagebuilder.com', 'mailchi.mp', 'constantcontact.com',
    'telegra.ph', 'medium.com', 'blogspot.com', 'wordpress.com', 'tumblr.com', 'wattpad.com', 'behance.net', 'figma.com', 'docsend.com',
    'discord.com', 'discordapp.com', 'cdn.discordapp.com', 'facebook.com', 'instagram.com', 'youtube.com', 'twitter.com', 'x.com', 'reddit.com',
    'wetransfer.com', 'we.tl', 'box.com', 'app.box.com', 'mega.nz', 'mediafire.com', 'archive.org', 'web.archive.org', 'trycloudflare.com',
    'ngrok.io', 'ngrok-free.app', 'ngrok.app', 'loca.lt', 'duckdns.org', 'replit.app', 'repl.co', 'onrender.com', 'herokuapp.com', 'fly.dev',
    'koyeb.app', 'railway.app', 'deno.dev', 'val.run', 'glide.page', 'softr.app', 'bubbleapps.io', 'carrd.co', 'strikingly.com', 'yolasite.com',
    'weeblysite.com', '000webhostapp.com', 'wuaze.com', 'rf.gd', 'epizy.com', 'infinityfreeapp.com', 'great-site.net', 'free.nf',
    // From PhishTank host statistics (2026-11): QR / link shorteners, form builders, link-in-bio and prototyping tools
    'l.wl.co', 'ipfs.best-practice.se', 'hsforms.com', 'share.hsforms.com', 'share-eu1.hsforms.com', 'qr-codes.io', 'did.li', 'flowcode.com',
    'zpr.io', 'linkin.bio', 'scanned.page', 'linqapp.com', 'powr.io', 'surl.li', 'mockplus.com', 'rp.mockplus.com', 'wetransfer.com',
    'qr.io', 'qrfy.com', 'me-qr.com', 'qr-code-generator.com', 'beaconstac.com', 'linktree.com', 'taplink.cc', 'bio.site', 'lnk.bio',
    'campaign-archive.com', 'list-manage.com', 'flow.page', 'campsite.bio', 'sendgrid.net', 'clickfunnels.com', 'systeme.io', 'groove.cm', 'gitbook.io',
    // Top-100 sites (Tranco, 2026-11) that host user content, redirect links or CDN traffic for many unrelated customers
    'tiktok.com', 'tiktokcdn.com', 'tiktokv.com', 'wa.me', 'whatsapp.com', 'whatsapp.net', 'baidu.com', 'qq.com', 'pinterest.com', 'vimeo.com',
    'wikipedia.org', 'wordpress.org', 'mail.ru', 'dzen.ru', 'yandex.net', 'yandex.ru', 'myfritz.net', 'fastly.net', 'akamaiedge.net',
    'akamaized.net', 'edgekey.net', 'cloudflare.net', 'cdn77.org', 'trafficmanager.net', 'cloudflare.com', 'mozilla.org',
  ]);
  const INDEX_VERSION = 2; // bump when key rules change so stored indexes are rebuilt
  const MAX_HOST_REPORTS_FOR_HOST_SIGNAL = 100; // more than this on one host = a shared platform we do not know about
  const HASH_BYTES = 12;

  function isSharedHost(host) {
    const h = domain.normalizeHost(host);
    if (!h) return true;
    for (const s of SHARED_HOSTS) if (domain.isSubdomainOf(h, s)) return true;
    const p = domain.parse(h);
    if (p.freeHosting) return true;
    const own = brands.findByDomain(p.registrable);
    return !!own;
  }

  /** Normalise a URL to "host/path?query" (no scheme, no fragment, no "www.", no trailing slash). */
  function normalizeUrl(input) {
    let u;
    try { u = new URL(String(input || '').trim()); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    let host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (u.port && u.port !== '80' && u.port !== '443') host += ':' + u.port;
    let path = u.pathname || '/';
    path = path.replace(/\/+$/, '');
    const query = u.search && u.search.length > 1 ? u.search : '';
    return host + path + query;
  }

  function hostOf(normalized) {
    return String(normalized || '').split(/[/?]/)[0].replace(/:\d+$/, '');
  }

  /** Number of path segments in a normalised key ("host/a/b?x" -> 2). */
  function pathDepth(key) {
    const noQuery = String(key || '').split('?')[0];
    const i = noQuery.indexOf('/');
    return i < 0 ? 0 : noQuery.slice(i + 1).split('/').filter(Boolean).length;
  }

  /**
   * True for hosts whose address space is shared by unrelated people: a big
   * brand's own hosts (google.com, docs.google.com, forms.office.com) and the
   * shared platforms themselves (bit.ly, weebly.com). A customer subdomain
   * such as foo.weebly.com belongs to one owner and is not path-shared.
   */
  function isPathShared(host) {
    const h = domain.normalizeHost(host).replace(/^www\./, '').replace(/:\d+$/, '');
    if (!h) return false;
    if (SHARED_HOSTS.has(h)) return true;
    for (const suf of domain.FREE_HOSTING_SUFFIXES) if (h !== suf && h.endsWith('.' + suf)) return false; // a tenant's own site
    return !!brands.findByDomain(domain.parse(h).registrable);
  }

  /**
   * On path-shared hosts a short or query-stripped key covers every visitor of
   * that service: one report of an open redirect (google.com/url?q=evil), a
   * form (forms.office.com/...?id=x) or the home page would flag them all.
   * There, the site root never matches and the query is never dropped from a
   * report.
   */
  function keyAllowed(key, shared) {
    return !shared || pathDepth(key) >= 1;
  }

  /** Keys stored for one reported URL: full form and, if it has a query and the host is not path-shared, the form without it. */
  function storedKeys(url) {
    const n = normalizeUrl(url);
    if (!n) return [];
    const shared = isPathShared(hostOf(n));
    const keys = [n];
    const q = n.indexOf('?');
    if (q >= 0 && !shared) keys.push(n.slice(0, q));
    return keys.filter((k) => keyAllowed(k, shared));
  }

  /** Keys to look up for a visited URL, most specific first: full, without query, then shorter paths. */
  function candidates(url) {
    const n = normalizeUrl(url);
    if (!n) return [];
    const shared = isPathShared(hostOf(n));
    const out = [];
    const seen = new Set();
    const push = (k) => { if (k && !seen.has(k) && keyAllowed(k, shared)) { seen.add(k); out.push(k); } };
    push(n);
    const q = n.indexOf('?');
    const noQuery = q >= 0 ? n.slice(0, q) : n;
    push(noQuery);
    let p = noQuery;
    while (true) {
      const i = p.lastIndexOf('/');
      if (i <= 0) break;
      p = p.slice(0, i);
      push(p);
    }
    return out;
  }

  const subtle = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) || null;
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  function toBase64Url(bytes) {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    const b64 = typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /** Truncated SHA-256 of a key, base64url (16 chars). */
  async function hashKey(key) {
    const digest = await subtle.digest('SHA-256', encoder.encode(key));
    return toBase64Url(new Uint8Array(digest).subarray(0, HASH_BYTES));
  }

  async function hashKeys(keys, chunk) {
    chunk = chunk || 2000;
    const out = [];
    for (let i = 0; i < keys.length; i += chunk) out.push(...await Promise.all(keys.slice(i, i + chunk).map(hashKey)));
    return out;
  }

  /** Minimal CSV parser (RFC 4180 quoting) returning arrays of fields. */
  function parseCsv(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQuotes) {
        if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && s[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  /** Parse the PhishTank "online-valid" CSV into { url, target, verifiedAt } records. */
  function parsePhishTankCsv(text) {
    const rows = parseCsv(text);
    if (!rows.length) return [];
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const iUrl = header.indexOf('url'), iTarget = header.indexOf('target'), iVer = header.indexOf('verification_time'), iOnline = header.indexOf('online'), iVerified = header.indexOf('verified');
    if (iUrl < 0) return [];
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row[iUrl]) continue;
      if (iVerified >= 0 && row[iVerified] && row[iVerified].toLowerCase() !== 'yes') continue;
      if (iOnline >= 0 && row[iOnline] && row[iOnline].toLowerCase() !== 'yes') continue;
      out.push({ url: row[iUrl], target: iTarget >= 0 ? row[iTarget] || '' : '', verifiedAt: iVer >= 0 ? row[iVer] || '' : '' });
    }
    return out;
  }

  /**
   * Build the stored index: { urls: sorted hash array, hosts: {hash: count}, count, targets: {name: count} }.
   * Hosts that are shared platforms are not indexed at host level.
   */
  async function buildIndex(records) {
    const keySet = new Set();
    const hostCounts = new Map();
    const targets = {};
    let count = 0;
    for (const rec of records) {
      const keys = storedKeys(rec.url);
      if (!keys.length) continue;
      count++;
      for (const k of keys) keySet.add(k);
      const host = hostOf(keys[0]);
      hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
      if (rec.target && rec.target !== 'Other') targets[rec.target] = (targets[rec.target] || 0) + 1;
    }
    const urls = (await hashKeys(Array.from(keySet))).sort();
    const hostEntries = Array.from(hostCounts.entries()).filter(([h, n]) => n <= MAX_HOST_REPORTS_FOR_HOST_SIGNAL && !isSharedHost(h));
    const hostHashes = await hashKeys(hostEntries.map(([h]) => h));
    const hosts = {};
    hostEntries.forEach(([, n], i) => { hosts[hostHashes[i]] = n; });
    return { v: INDEX_VERSION, urls, hosts, count, targets };
  }

  function binarySearch(sorted, value) {
    let lo = 0, hi = sorted.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] === value) return true;
      if (sorted[mid] < value) lo = mid + 1; else hi = mid - 1;
    }
    return false;
  }

  /** Look a visited URL up in an index. Returns { kind: 'url'|'host', count, key } or null. */
  async function lookup(index, url) {
    if (!index || !index.urls || !index.urls.length) return null;
    const keys = candidates(url);
    if (!keys.length) return null;
    const hashes = await hashKeys(keys);
    for (let i = 0; i < keys.length; i++) {
      if (binarySearch(index.urls, hashes[i])) return { kind: 'url', count: 1, key: keys[i] };
    }
    const host = hostOf(keys[0]);
    if (host && !isSharedHost(host)) {
      const hh = await hashKey(host);
      const n = index.hosts && index.hosts[hh];
      if (n) return { kind: 'host', count: n, key: host };
    }
    return null;
  }

  return { INDEX_VERSION, SHARED_HOSTS, isSharedHost, isPathShared, normalizeUrl, hostOf, storedKeys, candidates, hashKey, hashKeys, parseCsv, parsePhishTankCsv, buildIndex, lookup };
});
