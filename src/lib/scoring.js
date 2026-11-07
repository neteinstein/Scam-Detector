/*
 * Turns domain-level intelligence and page observations into a list of
 * weighted signals and a 0–100 risk score with a verdict.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'), require('./brands.js'), require('./tlds.js'), require('./lookalike.js'), require('./punycode.js'));
  else { root.SD = root.SD || {}; root.SD.scoring = factory(root.SD.domain, root.SD.brands, root.SD.tlds, root.SD.lookalike, root.SD.punycode); }
})(typeof self !== 'undefined' ? self : this, function (domain, brands, tlds, lookalike, punycode) {
  const DEFAULT_SETTINGS = { dangerThreshold: 60, warnThreshold: 35, rdapEnabled: true, showWarnBanner: true, allowlist: [], customBrands: [], chatMonitorEnabled: true, chatMonitorDomains: [], phishFeedEnabled: true, phishtankAppKey: '', safeBrowsingEnabled: true, safeBrowsingApiKey: '', plainLanguage: true };

  const HOST_RED_FLAG_TOKENS = new Set([
    'login', 'signin', 'logon', 'secure', 'security', 'verify', 'verification', 'account', 'accounts', 'update', 'support', 'auth',
    'confirm', 'billing', 'wallet', 'recovery', 'unlock', 'locked', 'suspended', 'alert', 'official', 'validate', 'appeal', 'refund',
    'redelivery', 'reschedule', 'parcel', 'tracking', 'giveaway', 'prize', 'claim', 'airdrop', 'bonus', 'reward', 'rewards', 'kyc',
    'helpdesk', 'webmail', 'customer', 'service', 'id', 'portal', 'activate', 'activation',
  ]);

  /**
   * A signal carries English text (label/detail) plus message keys and
   * arguments so the UI can render it in the browser language via chrome.i18n.
   * i18n: { key?, args?, detailKey?, detailArgs? }. key defaults to sig_<id>.
   */
  function signal(id, label, weight, detail, category, i18n) {
    i18n = i18n || {};
    const out = { id, label, weight: Math.round(weight), detail: detail || '', category: category || 'page', key: i18n.key || ('sig_' + id.replace(/-/g, '_')), args: (i18n.args || []).map(String) };
    if (i18n.detailKey) { out.detailKey = i18n.detailKey; out.detailArgs = (i18n.detailArgs || []).map(String); }
    if (i18n.ageKey) { out.ageKey = i18n.ageKey; out.ageArgs = (i18n.ageArgs || []).map(String); }
    return out;
  }

  /** English age text plus the message key/args for localisation. */
  function ageText(days) {
    if (days < 1) return { text: 'less than a day', key: 'age_lt_day', args: [] };
    if (days < 2) return { text: '1 day', key: 'age_day', args: [] };
    if (days < 60) return { text: `${Math.floor(days)} days`, key: 'age_days', args: [Math.floor(days)] };
    if (days < 730) return { text: `${Math.floor(days / 30)} months`, key: 'age_months', args: [Math.floor(days / 30)] };
    return { text: `${Math.floor(days / 365)} years`, key: 'age_years', args: [Math.floor(days / 365)] };
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

    // ---- Reputation sources (evaluated before the brand shortcut: a phishing
    // page hosted on a big platform like docs.google.com must still warn) ----
    const report = domainInfo.phishReport || null;
    if (report && report.kind === 'url') signals.push(signal('phish-report-url', 'Reported and verified as a phishing page by the PhishTank community', 75, report.target ? `impersonating ${report.target}` : '', 'reputation', report.target ? { detailKey: 'det_impersonating', detailArgs: [report.target] } : {}));
    else if (report && report.kind === 'host') signals.push(signal('phish-report-host', `This site has ${report.count} verified phishing report${report.count === 1 ? '' : 's'} on PhishTank`, 45, '', 'reputation', report.count === 1 ? { key: 'sig_phish_report_host_one' } : { key: 'sig_phish_report_host_many', args: [report.count] }));
    const sb = domainInfo.safeBrowsing || null;
    if (sb && Array.isArray(sb.threats) && sb.threats.length) {
      const names = { SOCIAL_ENGINEERING: ['suspected phishing / deceptive site', 'sb_type_social'], MALWARE: ['site that may distribute malware', 'sb_type_malware'], UNWANTED_SOFTWARE: ['site that may install unwanted software', 'sb_type_unwanted'], POTENTIALLY_HARMFUL_APPLICATION: ['potentially harmful application', 'sb_type_pha'] };
      const [label, typeKey] = names[sb.threats[0]] || ['potentially unsafe site', 'sb_type_unknown'];
      const sig = signal('safe-browsing', `Google Safe Browsing lists this page as a ${label}`, 75, 'Advisory provided by Google', 'reputation', { args: [label], detailKey: 'sb_advisory' });
      sig.typeKey = typeKey; // UI substitutes the localised type into $1
      signals.push(sig);
    }
    const urlLevelHit = (report && report.kind === 'url') || (sb && sb.threats && sb.threats.length);

    const ownBrand = brands.findByDomain(parsed.registrable) || (settings.customBrands || []).find((b) => (b.domains || []).some((d) => domain.isSubdomainOf(hostname, d)));
    if (ownBrand && !urlLevelHit) { result.verdict = 'trusted'; result.reason = `known ${ownBrand.name} domain`; result.brand = ownBrand.name; return result; }
    if (ownBrand) result.brand = ownBrand.name;

    const hasCredentialForm = !!(pageInfo && (pageInfo.hasPasswordField || pageInfo.hasCardField || pageInfo.hasSeedPhraseField));
    const https = pageInfo ? pageInfo.isHttps : true;

    // ---- Domain-level --------------------------------------------------
    if (parsed.isIP) signals.push(signal('ip-host', 'Site is addressed by a raw IP address instead of a domain name', 25, hostname, 'domain'));

    const la = ownBrand ? null : lookalike.detect(hostname, settings.customBrands);
    if (la) {
      result.lookalike = la;
      const w = { homoglyph: 35, 'brand-in-domain': 30, 'brand-in-subdomain': 32, typosquat: 28 }[la.reason] || 25;
      signals.push(signal('lookalike', `Domain impersonates ${la.brand}`, w * (0.8 + 0.2 * la.confidence), la.evidence, 'domain', { args: [la.brand], detailKey: la.evidenceKey, detailArgs: la.evidenceArgs }));
    } else if (punycode.isPunycode(hostname)) {
      signals.push(signal('idn', 'Internationalised domain name (non-Latin characters) can hide look-alike letters', 10, punycode.toUnicode(hostname), 'domain'));
    }

    if (domainInfo.ageDays != null) {
      const d = domainInfo.ageDays;
      let w = 0;
      if (d < 7) w = 35; else if (d < 30) w = 30; else if (d < 90) w = 22; else if (d < 180) w = 14; else if (d < 365) w = 8;
      const age = ageText(d);
      if (w) signals.push(signal('domain-age', `Domain was registered only ${age.text} ago`, w, domainInfo.registrationDate ? `Registered ${String(domainInfo.registrationDate).slice(0, 10)}` : '', 'domain', Object.assign({ ageKey: age.key, ageArgs: age.args }, domainInfo.registrationDate ? { detailKey: 'det_registered', detailArgs: [String(domainInfo.registrationDate).slice(0, 10)] } : {})));
    }

    const tldW = tlds.riskWeight(parsed.suffix);
    if (tldW) signals.push(signal('risky-tld', `.${parsed.suffix.split('.').pop()} is a top-level domain heavily used for abuse`, tldW, '', 'domain', { args: [parsed.suffix.split('.').pop()] }));

    if (!parsed.isIP) {
      const toks = lookalike.tokens(hostname).filter((t) => HOST_RED_FLAG_TOKENS.has(t));
      if (toks.length) signals.push(signal('host-keywords', 'Hostname contains words typical of phishing links', Math.min(18, 6 * toks.length), toks.join(', '), 'domain'));

      const hyphens = (parsed.registrable.match(/-/g) || []).length;
      if (hyphens >= 3) signals.push(signal('hyphens', 'Unusually many hyphens in the domain', 8, parsed.registrable, 'domain', { key: 'sig_hyphens_many' }));
      else if (hyphens === 2) signals.push(signal('hyphens', 'Several hyphens in the domain', 4, parsed.registrable, 'domain', { key: 'sig_hyphens_some' }));

      const subLabels = parsed.subdomain ? parsed.subdomain.split('.').length : 0;
      if (subLabels >= 3) signals.push(signal('deep-subdomain', 'Deeply nested subdomains (often used to hide the real domain)', 8, hostname, 'domain'));

      if (hostname.length > 45) signals.push(signal('long-host', 'Very long hostname', 6, `${hostname.length} characters`, 'domain', { detailKey: 'det_chars', detailArgs: [hostname.length] }));

      if (/\d/.test(parsed.sld) && /[a-z]/.test(parsed.sld) && !/^[a-z]+\d{1,2}$/.test(parsed.sld)) signals.push(signal('digits', 'Domain mixes letters and digits', 4, parsed.sld, 'domain'));

      const ent = domain.shannonEntropy(parsed.sld.replace(/-/g, ''));
      if (parsed.sld.length >= 12 && ent > 3.6 && !/[aeiou]{1}[a-z]*[aeiou]/.test(parsed.sld.slice(0, 8))) signals.push(signal('random-name', 'Domain looks randomly generated', 6, parsed.sld, 'domain'));
    }

    if (!https) signals.push(signal('no-https', 'Connection is not encrypted (HTTP)', hasCredentialForm ? 25 : 10, hasCredentialForm ? 'and the page asks for credentials or card details' : '', 'page', hasCredentialForm ? { detailKey: 'det_no_https_cred' } : {}));

    // ---- Page-level ----------------------------------------------------
    if (pageInfo) {
      const young = domainInfo.ageDays != null && domainInfo.ageDays < 180;

      if (pageInfo.hasSeedPhraseField) signals.push(signal('seed-phrase', 'Page asks for a crypto wallet seed / recovery phrase or private key', 35, 'No legitimate service ever asks for this', 'page', { detailKey: 'det_seed' }));

      if (pageInfo.hasPasswordField) {
        if (la) signals.push(signal('cred-lookalike', `Login form on a domain impersonating ${la.brand}`, 22, 'Classic credential-phishing setup', 'page', { args: [la.brand], detailKey: 'det_cred_classic' }));
        if (young) signals.push(signal('cred-young', 'Login form on a very recently registered domain', 15, '', 'page'));
        if (parsed.freeHosting) signals.push(signal('cred-free-host', 'Login form hosted on a free hosting / sandbox service', 12, parsed.suffix, 'page'));
        if (parsed.isIP) signals.push(signal('cred-ip', 'Login form on a raw IP address', 15, '', 'page'));
        if (pageInfo.hasHiddenPasswordField) signals.push(signal('hidden-password', 'Hidden password field present', 6, '', 'page'));
      }
      if (pageInfo.hasCardField) {
        if (la) signals.push(signal('card-lookalike', `Card-details form on a domain impersonating ${la.brand}`, 20, '', 'page', { args: [la.brand] }));
        if (young) signals.push(signal('card-young', 'Card-details form on a very recently registered domain', 12, '', 'page'));
        if (parsed.freeHosting) signals.push(signal('card-free-host', 'Card-details form hosted on a free hosting service', 12, parsed.suffix, 'page'));
      }

      const crossCred = (pageInfo.forms || []).find((f) => f.crossDomain && (f.hasPassword || f.hasCard));
      if (crossCred) signals.push(signal('cross-domain-form', 'Credentials are submitted to a different domain', 20, `posts to ${crossCred.actionHost}`, 'page', { detailKey: 'det_posts_to', detailArgs: [crossCred.actionHost] }));
      const httpForm = https && (pageInfo.forms || []).find((f) => f.actionIsHttp && (f.hasPassword || f.hasCard));
      if (httpForm) signals.push(signal('http-form', 'Credentials are submitted over unencrypted HTTP', 20, `posts to ${httpForm.actionHost}`, 'page', { detailKey: 'det_posts_to', detailArgs: [httpForm.actionHost] }));
      const getCred = (pageInfo.forms || []).find((f) => f.method === 'get' && f.hasPassword && f.actionHost);
      if (getCred && !crossCred) signals.push(signal('get-form', 'Password is sent in the URL (GET form)', 6, '', 'page'));

      // Brand references that do not match the domain
      // A site naming its own brand ("Google" on google.com) is not a mismatch.
      const isOwn = (n) => !!ownBrand && ownBrand.name === n;
      const titleBrands = (pageInfo.titleBrands || []).filter((n) => !isOwn(n));
      if (titleBrands.length) {
        const b = titleBrands[0];
        const w = hasCredentialForm ? 22 : 10;
        const shown = (pageInfo.title || pageInfo.siteName || pageInfo.headings || '').slice(0, 80);
        signals.push(signal('brand-title', `Page presents itself as ${b} but is not on a ${b} domain`, w, `title/heading: "${shown}"`, 'page', { args: [b], detailKey: 'det_title', detailArgs: [shown] }));
      } else {
        const heavy = Object.entries(pageInfo.bodyBrandCounts || {}).filter(([b, n]) => n >= 5 && !isOwn(b)).sort((a, b) => b[1] - a[1])[0];
        if (heavy && hasCredentialForm) signals.push(signal('brand-body', `Page repeatedly mentions ${heavy[0]} next to a credential form`, 10, `${heavy[1]} mentions`, 'page', { args: [heavy[0]], detailKey: 'det_mentions', detailArgs: [heavy[1]] }));
      }

      for (const a of (pageInfo.brandAssets || [])) {
        if (isOwn(a.brand)) continue;
        if (a.kind === 'favicon') { signals.push(signal('brand-favicon', `Favicon is loaded from ${a.brand}'s real site`, 20, a.host, 'page', { args: [a.brand] })); break; }
      }
      const imgAsset = (pageInfo.brandAssets || []).find((a) => a.kind !== 'favicon' && !isOwn(a.brand));
      if (imgAsset && hasCredentialForm) signals.push(signal('brand-assets', `Logos/styles hot-linked from ${imgAsset.brand}'s real site on a credential page`, 15, imgAsset.host, 'page', { args: [imgAsset.brand] }));

      // Language (social engineering + money claims)
      const PHRASE_CAP = 40;
      let phraseTotal = 0;
      const byCat = new Map();
      for (const p of (pageInfo.phrases || [])) {
        const prev = byCat.get(p.category);
        if (prev) { prev.weight = Math.min(prev.weight + Math.round(p.weight / 2), p.weight * 2); prev.detail += ` · "${p.match}"`; continue; }
        byCat.set(p.category, { label: p.label, weight: p.weight, detail: `"${p.match}"`, category: p.category, money: !!p.money });
      }
      const sortedCats = Array.from(byCat.entries()).sort((a, b) => b[1].weight - a[1].weight);
      for (const [cat, s] of sortedCats) {
        if (phraseTotal >= PHRASE_CAP) break;
        const w = Math.min(s.weight, PHRASE_CAP - phraseTotal);
        phraseTotal += w;
        signals.push(signal('phrase-' + cat, s.label, w, s.detail, s.money ? 'money' : 'page', { key: 'phrase_' + cat }));
      }
      // Money claims combined with a way to take your money or data
      const moneyCats = sortedCats.filter(([, s]) => s.money);
      if (moneyCats.length) {
        if (pageInfo.hasCardField || pageInfo.hasPasswordField) signals.push(signal('money-form', 'Asks for card or account details next to money claims', 12, moneyCats.map(([c]) => c).join(', '), 'money'));
        if (moneyCats.length >= 2) signals.push(signal('money-stack', 'Several independent money-scam templates on one page', 10, moneyCats.map(([, s]) => s.label).join('; '), 'money'));
        if (young || parsed.freeHosting) signals.push(signal('money-young', `Money claims on a ${parsed.freeHosting ? 'free-hosting' : 'very recently registered'} site`, 10, '', 'money', { key: parsed.freeHosting ? 'sig_money_young_free' : 'sig_money_young_new' }));
      }

      const L = pageInfo.links || {};
      if (L.total >= 5 && L.dead / L.total > 0.6) signals.push(signal('dead-links', 'Most links on the page go nowhere (fake navigation)', 8, `${L.dead} of ${L.total} links`, 'page', { detailKey: 'det_links', detailArgs: [L.dead, L.total] }));
      if (L.mismatched) signals.push(signal('link-mismatch', 'Links display one address but lead to another', Math.min(12, 6 + 3 * L.mismatched), (L.mismatchedSamples || []).join('; '), 'page'));
      if (pageInfo.contextMenuBlocked && hasCredentialForm) signals.push(signal('no-context-menu', 'Right-click is disabled on a credential page', 5, '', 'page'));
      if (pageInfo.fakeBadges && (young || !https || la)) signals.push(signal('fake-badges', 'Decorative "secure / verified" badges', 5, `${pageInfo.fakeBadges} badge image(s)`, 'page', { detailKey: 'det_badges', detailArgs: [pageInfo.fakeBadges] }));
      if (pageInfo.externalMetaRefresh) signals.push(signal('meta-refresh', 'Page auto-redirects to another domain', 8, pageInfo.externalMetaRefresh, 'page'));
      if (pageInfo.crossOriginFrames >= 3 && hasCredentialForm) signals.push(signal('frames', 'Many third-party frames on a credential page', 5, `${pageInfo.crossOriginFrames} frames`, 'page', { detailKey: 'det_frames', detailArgs: [pageInfo.crossOriginFrames] }));
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

  /**
   * Toolbar state for a result. The whole shield icon changes colour (icons/state/<state>-<size>.png):
   * green check = no risk signals, yellow ! = some signals but no banner,
   * red ! = a warning banner is showing, grey check = trusted, neutral ! = not checked.
   * No badge text: the icon colour carries the meaning.
   */
  const BADGE_COLORS = { green: '#2e7d32', yellow: '#f9a825', red: '#d32f2f', grey: '#757575', neutral: '#546e7a' };
  function iconPaths(state) {
    const p = {};
    for (const size of [16, 32, 48]) p[size] = `/icons/state/${state}-${size}.png`;
    return p;
  }
  function badgeFor(result, settings) {
    let state;
    if (!result || result.verdict === 'skipped' || result.error) state = 'neutral';
    else if (result.verdict === 'trusted') state = 'grey';
    else {
      const showWarn = (settings || result.settings || {}).showWarnBanner !== false;
      const banner = result.verdict === 'danger' || (result.verdict === 'warning' && showWarn);
      state = banner ? 'red' : (result.signals || []).length || result.verdict === 'warning' ? 'yellow' : 'green';
    }
    return { state, text: '', color: BADGE_COLORS[state], icon: iconPaths(state) };
  }

  return { evaluate, badgeFor, DEFAULT_SETTINGS };
});
