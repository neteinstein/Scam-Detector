/*
 * Hostname utilities: registrable-domain extraction (compact public suffix
 * subset), IP detection, and structural features of a hostname.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.domain = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  // Multi-label public suffixes we care about. Anything not listed is treated
  // as a single-label suffix (".com", ".xyz", ...). This is a deliberately
  // compact subset of the Public Suffix List that covers the common cases.
  const MULTI_LABEL_SUFFIXES = new Set([
    'co.uk', 'org.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'ac.uk', 'gov.uk', 'nhs.uk', 'sch.uk',
    'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au',
    'co.nz', 'net.nz', 'org.nz', 'govt.nz',
    'com.br', 'net.br', 'org.br', 'gov.br',
    'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
    'co.kr', 'or.kr', 'go.kr',
    'com.cn', 'net.cn', 'org.cn', 'gov.cn',
    'com.hk', 'org.hk', 'com.tw', 'org.tw', 'com.sg', 'com.my', 'com.ph', 'co.id', 'co.th', 'co.in', 'com.vn',
    'com.mx', 'com.ar', 'com.co', 'com.pe', 'com.ve', 'com.ec', 'com.uy', 'com.bo', 'com.py', 'com.gt',
    'co.za', 'org.za', 'com.ng', 'com.eg', 'co.ke', 'com.gh',
    'com.tr', 'com.pl', 'com.ua', 'com.ru', 'org.ru', 'com.pt', 'edu.pt', 'gov.pt', 'org.pt', 'com.es', 'org.es', 'gob.es',
    'com.gr', 'co.il', 'org.il', 'ac.il', 'com.sa', 'com.ae', 'com.pk', 'com.bd', 'com.np', 'com.lk',
    'com.de', 'co.at', 'or.at', 'co.hu', 'com.ro', 'com.cy', 'com.mt', 'com.ee', 'com.lv', 'com.lt',
    'gov.in', 'nic.in', 'ac.in', 'edu.in', 'res.in',
    'github.io', 'gitlab.io', 'pages.dev', 'netlify.app', 'vercel.app', 'herokuapp.com', 'web.app', 'firebaseapp.com',
    'blogspot.com', 'wordpress.com', 'wixsite.com', 'weebly.com', 'webflow.io', 'glitch.me', 'repl.co', 'replit.app',
    'azurewebsites.net', 'cloudfront.net', 'amazonaws.com', 'appspot.com', 'surge.sh', 'carrd.co', 'notion.site',
    'godaddysites.com', 'squarespace.com', 'myshopify.com', 'bigcartel.com', 'workers.dev', 'r2.dev', 'ngrok.io',
    'ngrok-free.app', 'ngrok.app', 'duckdns.org', 'no-ip.org', 'ddns.net', 'hopto.org', 'sites.google.com',
    'web.core.windows.net', 'blob.core.windows.net', 's3.amazonaws.com', 'storage.googleapis.com', 'ipfs.io',
    'ipfs.dweb.link', 'weeblysite.com', 'yolasite.com', 'strikingly.com', 'ucoz.net', 'ucoz.com', '000webhostapp.com',
    'wuaze.com', 'rf.gd', 'epizy.com', 'infinityfreeapp.com', 'great-site.net', 'free.nf', 'onrender.com', 'fly.dev',
    'koyeb.app', 'railway.app', 'deno.dev', 'val.run', 'pages.github.io', 'b-cdn.net', 'linodeobjects.com', 'digitaloceanspaces.com',
  ]);

  // Hosting / sandbox suffixes where the first label is a free tenant name, so a
  // registrable-domain style check gives weak evidence about who runs the site.
  const FREE_HOSTING_SUFFIXES = new Set([
    'github.io', 'gitlab.io', 'pages.dev', 'netlify.app', 'vercel.app', 'herokuapp.com', 'web.app', 'firebaseapp.com',
    'blogspot.com', 'wordpress.com', 'wixsite.com', 'weebly.com', 'webflow.io', 'glitch.me', 'repl.co', 'replit.app',
    'azurewebsites.net', 'appspot.com', 'surge.sh', 'carrd.co', 'notion.site', 'godaddysites.com', 'workers.dev', 'r2.dev',
    'ngrok.io', 'ngrok-free.app', 'ngrok.app', 'duckdns.org', 'no-ip.org', 'ddns.net', 'hopto.org', 'sites.google.com',
    'web.core.windows.net', 'blob.core.windows.net', 's3.amazonaws.com', 'storage.googleapis.com', 'ipfs.io', 'ipfs.dweb.link',
    'weeblysite.com', 'yolasite.com', 'strikingly.com', 'ucoz.net', 'ucoz.com', '000webhostapp.com', 'wuaze.com', 'rf.gd',
    'epizy.com', 'infinityfreeapp.com', 'great-site.net', 'free.nf', 'onrender.com', 'fly.dev', 'koyeb.app', 'railway.app',
    'deno.dev', 'val.run', 'b-cdn.net', 'linodeobjects.com', 'digitaloceanspaces.com', 'cloudfront.net', 'amazonaws.com',
  ]);

  function normalizeHost(hostname) {
    return String(hostname || '').trim().toLowerCase().replace(/\.$/, '').replace(/^\[|\]$/g, '');
  }

  function isIPv4(host) {
    return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(host);
  }

  function isIPv6(host) {
    return /^[0-9a-f:]+$/i.test(host) && host.includes(':');
  }

  function isIPAddress(hostname) {
    const h = normalizeHost(hostname);
    return isIPv4(h) || isIPv6(h);
  }

  function isLocalHost(hostname) {
    const h = normalizeHost(hostname);
    if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.test')) return true;
    if (isIPv6(h)) return h === '::1' || /^f[cd]/i.test(h) || /^fe80/i.test(h);
    if (isIPv4(h)) {
      const [a, b] = h.split('.').map(Number);
      return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254) || a === 0;
    }
    return false;
  }

  /**
   * Split a hostname into { labels, suffix, sld, registrable, subdomain }.
   * registrable is the "eTLD+1" (e.g. "example.co.uk").
   */
  function parse(hostname) {
    const host = normalizeHost(hostname);
    const labels = host ? host.split('.') : [];
    const result = { host, labels, suffix: '', sld: '', registrable: '', subdomain: '', isIP: false, freeHosting: false };
    if (!host) return result;
    if (isIPv4(host) || isIPv6(host)) {
      result.isIP = true;
      result.registrable = host;
      return result;
    }
    if (labels.length === 1) {
      result.registrable = host;
      result.sld = host;
      return result;
    }
    let suffixLabels = 1;
    for (let n = Math.min(3, labels.length - 1); n >= 2; n--) {
      const candidate = labels.slice(-n).join('.');
      if (MULTI_LABEL_SUFFIXES.has(candidate)) { suffixLabels = n; break; }
    }
    if (suffixLabels >= labels.length) suffixLabels = labels.length - 1;
    result.suffix = labels.slice(-suffixLabels).join('.');
    result.sld = labels[labels.length - suffixLabels - 1];
    result.registrable = labels.slice(-(suffixLabels + 1)).join('.');
    result.subdomain = labels.slice(0, labels.length - suffixLabels - 1).join('.');
    result.freeHosting = FREE_HOSTING_SUFFIXES.has(result.suffix);
    return result;
  }

  /** True if host is exactly domain or a subdomain of it. */
  function isSubdomainOf(host, domain) {
    const h = normalizeHost(host), d = normalizeHost(domain);
    return h === d || h.endsWith('.' + d);
  }

  /** Optimal-string-alignment (Damerau-Levenshtein) distance. */
  function levenshtein(a, b) {
    a = String(a); b = String(b);
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const d = [];
    for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (let j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }

  function shannonEntropy(str) {
    const s = String(str || '');
    if (!s.length) return 0;
    const freq = new Map();
    for (const ch of s) freq.set(ch, (freq.get(ch) || 0) + 1);
    let h = 0;
    for (const n of freq.values()) { const p = n / s.length; h -= p * Math.log2(p); }
    return h;
  }

  return { parse, normalizeHost, isIPAddress, isLocalHost, isSubdomainOf, levenshtein, shannonEntropy, MULTI_LABEL_SUFFIXES, FREE_HOSTING_SUFFIXES };
});
