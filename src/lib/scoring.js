/*
 * Turns domain-level intelligence and page observations into a list of
 * weighted signals and a 0–100 risk score with a verdict.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'), require('./brands.js'), require('./tlds.js'), require('./lookalike.js'), require('./punycode.js'));
  else { root.SD = root.SD || {}; root.SD.scoring = factory(root.SD.domain, root.SD.brands, root.SD.tlds, root.SD.lookalike, root.SD.punycode); }
})(typeof self !== 'undefined' ? self : this, function (domain, brands, tlds, lookalike, punycode) {
  const DEFAULT_SETTINGS = { dangerThreshold: 60, warnThreshold: 35, rdapEnabled: true, showWarnBanner: true, allowlist: [], customBrands: [] };

  const HOST_RED_FLAG_TOKENS = new Set([
    'login', 'signin', 'logon', 'secure', 'security', 'verify', 'verification', 'account', 'accounts', 'update', 'support', 'auth',
    'confirm', 'billing', 'wallet', 'recovery', 'unlock', 'locked', 'suspended', 'alert', 'official', 'validate', 'appeal', 'refund',
    'redelivery', 'reschedule', 'parcel', 'tracking', 'giveaway', 'prize', 'claim', 'airdrop', 'bonus', 'reward', 'rewards', 'kyc',
    'helpdesk', 'webmail', 'customer', 'service', 'id', 'portal', 'activate', 'activation',
  ]);

  function signal(id, label, weight, detail, category) {
    return { id, label, weight: Math.round(weight), detail: detail || '', category: category || 'page' };
  }

  function ageLabel(days) {
    if (days < 1) return 'less than a day';
    if (days < 60) return `${Math.floor(days)} day${days >= 2 ? 's' : ''}`;
    if (days < 730) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  }

  /**
   * @param domainInfo { hostname, ageDays|null, registrationDate|null, rdapStatus, registrar }
   * @param pageInfo   output of pageSignals.collect (may be null for a domain-only analysis)
   * @param settings   DEFAULT_SETTINGS-shaped object
   */
  function evaluate(domainInfo, pageInfo, settings) {
    settings = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    const hostname = domain.normalizeHost(domainInfo.hostname);
    const parsed = domain.parse(hostname);
    const signals = [];
    const result = { hostname, registrable: parsed.registrable, score: 0, verdict: 'ok', signals, lookalike: null, ageDays: domainInfo.ageDays == null ? null : domainInfo.ageDays, rdapStatus: domainInfo.rdapStatus || 'unknown', registrationDate: domainInfo.registrationDate || null };

    if (!hostname || domain.isLocalHost(hostname)) { result.verdict = 'skipped'; result.reason = 'local'; return result; }
    if ((settings.allowlist || []).some((d) => domain.isSubdomainOf(hostname, d))) { result.verdict = 'trusted'; result.reason = 'allowlist'; return result; }
    const ownBrand = brands.findByDomain(parsed.registrable) || (settings.customBrands || []).find((b) => (b.domains || []).some((d) => domain.isSubdomainOf(hostname, d)));
    if (ownBrand) { result.verdict = 'trusted'; result.reason = `known ${ownBrand.name} domain`; result.brand = ownBrand.name; return result; }

    const hasCredentialForm = !!(pageInfo && (pageInfo.hasPasswordField || pageInfo.hasCardField || pageInfo.hasSeedPhraseField));
    const https = pageInfo ? pageInfo.isHttps : true;

    // ---- Domain-level --------------------------------------------------
    if (parsed.isIP) signals.push(signal('ip-host', 'Site is addressed by a raw IP address instead of a domain name', 25, hostname, 'domain'));

    const la = lookalike.detect(hostname, settings.customBrands);
    if (la) {
      result.lookalike = la;
      const w = { homoglyph: 35, 'brand-in-domain': 30, 'brand-in-subdomain': 32, typosquat: 28 }[la.reason] || 25;
      signals.push(signal('lookalike', `Domain impersonates ${la.brand}`, w * (0.8 + 0.2 * la.confidence), la.evidence, 'domain'));
    } else if (punycode.isPunycode(hostname)) {
      signals.push(signal('idn', 'Internationalised domain name (non-Latin characters) can hide look-alike letters', 10, punycode.toUnicode(hostname), 'domain'));
    }

    if (domainInfo.ageDays != null) {
      const d = domainInfo.ageDays;
      let w = 0;
      if (d < 7) w = 35; else if (d < 30) w = 30; else if (d < 90) w = 22; else if (d < 180) w = 14; else if (d < 365) w = 8;
      if (w) signals.push(signal('domain-age', `Domain was registered only ${ageLabel(d)} ago`, w, domainInfo.registrationDate ? `Registered ${String(domainInfo.registrationDate).slice(0, 10)}` : '', 'domain'));
    }

    const tldW = tlds.riskWeight(parsed.suffix);
    if (tldW) signals.push(signal('risky-tld', `.${parsed.suffix.split('.').pop()} is a top-level domain heavily used for abuse`, tldW, '', 'domain'));

    if (!parsed.isIP) {
      const toks = lookalike.tokens(hostname).filter((t) => HOST_RED_FLAG_TOKENS.has(t));
      if (toks.length) signals.push(signal('host-keywords', 'Hostname contains words typical of phishing links', Math.min(18, 6 * toks.length), toks.join(', '), 'domain'));

      const hyphens = (parsed.registrable.match(/-/g) || []).length;
      if (hyphens >= 3) signals.push(signal('hyphens', 'Unusually many hyphens in the domain', 8, parsed.registrable, 'domain'));
      else if (hyphens === 2) signals.push(signal('hyphens', 'Several hyphens in the domain', 4, parsed.registrable, 'domain'));

      const subLabels = parsed.subdomain ? parsed.subdomain.split('.').length : 0;
      if (subLabels >= 3) signals.push(signal('deep-subdomain', 'Deeply nested subdomains (often used to hide the real domain)', 8, hostname, 'domain'));

      if (hostname.length > 45) signals.push(signal('long-host', 'Very long hostname', 6, `${hostname.length} characters`, 'domain'));

      if (/\d/.test(parsed.sld) && /[a-z]/.test(parsed.sld) && !/^[a-z]+\d{1,2}$/.test(parsed.sld)) signals.push(signal('digits', 'Domain mixes letters and digits', 4, parsed.sld, 'domain'));

      const ent = domain.shannonEntropy(parsed.sld.replace(/-/g, ''));
      if (parsed.sld.length >= 12 && ent > 3.6 && !/[aeiou]{1}[a-z]*[aeiou]/.test(parsed.sld.slice(0, 8))) signals.push(signal('random-name', 'Domain looks randomly generated', 6, parsed.sld, 'domain'));
    }

    if (!https) signals.push(signal('no-https', 'Connection is not encrypted (HTTP)', hasCredentialForm ? 25 : 10, hasCredentialForm ? 'and the page asks for credentials or card details' : '', 'page'));

    // ---- Page-level ----------------------------------------------------
    if (pageInfo) {
      const young = domainInfo.ageDays != null && domainInfo.ageDays < 180;

      if (pageInfo.hasSeedPhraseField) signals.push(signal('seed-phrase', 'Page asks for a crypto wallet seed / recovery phrase or private key', 35, 'No legitimate service ever asks for this', 'page'));

      if (pageInfo.hasPasswordField) {
        if (la) signals.push(signal('cred-lookalike', `Login form on a domain impersonating ${la.brand}`, 22, 'Classic credential-phishing setup', 'page'));
        if (young) signals.push(signal('cred-young', 'Login form on a very recently registered domain', 15, '', 'page'));
        if (parsed.freeHosting) signals.push(signal('cred-free-host', 'Login form hosted on a free hosting / sandbox service', 12, parsed.suffix, 'page'));
        if (parsed.isIP) signals.push(signal('cred-ip', 'Login form on a raw IP address', 15, '', 'page'));
        if (pageInfo.hasHiddenPasswordField) signals.push(signal('hidden-password', 'Hidden password field present', 6, '', 'page'));
      }
      if (pageInfo.hasCardField) {
        if (la) signals.push(signal('card-lookalike', `Card-details form on a domain impersonating ${la.brand}`, 20, '', 'page'));
        if (young) signals.push(signal('card-young', 'Card-details form on a very recently registered domain', 12, '', 'page'));
        if (parsed.freeHosting) signals.push(signal('card-free-host', 'Card-details form hosted on a free hosting service', 12, parsed.suffix, 'page'));
      }

      const crossCred = (pageInfo.forms || []).find((f) => f.crossDomain && (f.hasPassword || f.hasCard));
      if (crossCred) signals.push(signal('cross-domain-form', 'Credentials are submitted to a different domain', 20, `posts to ${crossCred.actionHost}`, 'page'));
      const httpForm = https && (pageInfo.forms || []).find((f) => f.actionIsHttp && (f.hasPassword || f.hasCard));
      if (httpForm) signals.push(signal('http-form', 'Credentials are submitted over unencrypted HTTP', 20, `posts to ${httpForm.actionHost}`, 'page'));
      const getCred = (pageInfo.forms || []).find((f) => f.method === 'get' && f.hasPassword && f.actionHost);
      if (getCred && !crossCred) signals.push(signal('get-form', 'Password is sent in the URL (GET form)', 6, '', 'page'));

      // Brand references that do not match the domain
      const titleBrands = (pageInfo.titleBrands || []).filter((n) => !(la && la.brand === n) || true);
      if (titleBrands.length) {
        const b = titleBrands[0];
        const w = hasCredentialForm ? 22 : 10;
        signals.push(signal('brand-title', `Page presents itself as ${b} but is not on a ${b} domain`, w, `title/heading: "${(pageInfo.title || pageInfo.siteName || pageInfo.headings || '').slice(0, 80)}"`, 'page'));
      } else {
        const heavy = Object.entries(pageInfo.bodyBrandCounts || {}).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1])[0];
        if (heavy && hasCredentialForm) signals.push(signal('brand-body', `Page repeatedly mentions ${heavy[0]} next to a credential form`, 10, `${heavy[1]} mentions`, 'page'));
      }

      for (const a of (pageInfo.brandAssets || [])) {
        if (a.kind === 'favicon') { signals.push(signal('brand-favicon', `Favicon is loaded from ${a.brand}'s real site`, 20, a.host, 'page')); break; }
      }
      const imgAsset = (pageInfo.brandAssets || []).find((a) => a.kind !== 'favicon');
      if (imgAsset && hasCredentialForm) signals.push(signal('brand-assets', `Logos/styles hot-linked from ${imgAsset.brand}'s real site on a credential page`, 15, imgAsset.host, 'page'));

      // Language
      let phraseTotal = 0;
      const byCat = new Map();
      for (const p of (pageInfo.phrases || [])) {
        const prev = byCat.get(p.category);
        if (prev) { prev.weight = Math.min(prev.weight + Math.round(p.weight / 2), p.weight * 2); prev.detail += ` · "${p.match}"`; continue; }
        byCat.set(p.category, { label: p.label, weight: p.weight, detail: `"${p.match}"`, category: p.category });
      }
      for (const [cat, s] of byCat) {
        if (phraseTotal >= 30) break;
        const w = Math.min(s.weight, 30 - phraseTotal);
        phraseTotal += w;
        signals.push(signal('phrase-' + cat, s.label, w, s.detail, 'page'));
      }

      const L = pageInfo.links || {};
      if (L.total >= 5 && L.dead / L.total > 0.6) signals.push(signal('dead-links', 'Most links on the page go nowhere (fake navigation)', 8, `${L.dead} of ${L.total} links`, 'page'));
      if (L.mismatched) signals.push(signal('link-mismatch', 'Links display one address but lead to another', Math.min(12, 6 + 3 * L.mismatched), (L.mismatchedSamples || []).join('; '), 'page'));
      if (pageInfo.contextMenuBlocked && hasCredentialForm) signals.push(signal('no-context-menu', 'Right-click is disabled on a credential page', 5, '', 'page'));
      if (pageInfo.fakeBadges && (young || !https || la)) signals.push(signal('fake-badges', 'Decorative "secure / verified" badges', 5, `${pageInfo.fakeBadges} badge image(s)`, 'page'));
      if (pageInfo.externalMetaRefresh) signals.push(signal('meta-refresh', 'Page auto-redirects to another domain', 8, pageInfo.externalMetaRefresh, 'page'));
      if (pageInfo.crossOriginFrames >= 3 && hasCredentialForm) signals.push(signal('frames', 'Many third-party frames on a credential page', 5, `${pageInfo.crossOriginFrames} frames`, 'page'));
    }

    // ---- Aggregate -----------------------------------------------------
    let score = signals.reduce((s, x) => s + x.weight, 0);
    // Independent strong indicators reinforce each other.
    const strong = signals.filter((s) => s.weight >= 20).length;
    if (strong >= 2) score += 10;
    if (strong >= 3) score += 10;
    score = Math.max(0, Math.min(100, Math.round(score)));
    result.score = score;
    result.verdict = score >= settings.dangerThreshold ? 'danger' : score >= settings.warnThreshold ? 'warning' : 'ok';
    signals.sort((a, b) => b.weight - a.weight);
    return result;
  }

  return { evaluate, DEFAULT_SETTINGS };
});
