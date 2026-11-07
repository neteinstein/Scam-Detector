/*
 * Brand impersonation detection for hostnames: keyword embedding, typosquats
 * (edit distance), homoglyph / confusable substitution and IDN confusables.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'), require('./brands.js'), require('./punycode.js'));
  else { root.SD = root.SD || {}; root.SD.lookalike = factory(root.SD.domain, root.SD.brands, root.SD.punycode); }
})(typeof self !== 'undefined' ? self : this, function (domain, brands, punycode) {
  // Characters that are routinely swapped for look-alikes in domain names.
  const ASCII_CONFUSABLES = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '2': 'z', '6': 'b', 'l': 'l', '|': 'l' };
  const MULTI_CONFUSABLES = [['rn', 'm'], ['vv', 'w'], ['cl', 'd'], ['nn', 'm'], ['ii', 'u']];
  // Unicode confusables (Cyrillic, Greek, Latin extended, full-width...) → ASCII
  const UNICODE_CONFUSABLES = {
    'а': 'a', 'ɑ': 'a', 'α': 'a', 'ạ': 'a', 'ả': 'a', 'ä': 'a', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'å': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a',
    'ь': 'b', 'ƅ': 'b', 'ḅ': 'b',
    'с': 'c', 'ϲ': 'c', 'ƈ': 'c', 'ċ': 'c', 'ç': 'c', 'ć': 'c', 'č': 'c',
    'ԁ': 'd', 'ɗ': 'd', 'đ': 'd', 'ď': 'd',
    'е': 'e', 'ё': 'e', 'ҽ': 'e', 'ε': 'e', 'ẹ': 'e', 'ë': 'e', 'è': 'e', 'é': 'e', 'ê': 'e', 'ē': 'e', 'ė': 'e', 'ę': 'e', 'ě': 'e',
    'ғ': 'f', 'ƒ': 'f',
    'ց': 'g', 'ɡ': 'g', 'ġ': 'g', 'ğ': 'g', 'ģ': 'g',
    'һ': 'h', 'հ': 'h', 'ḥ': 'h', 'ħ': 'h',
    'і': 'i', 'ɩ': 'i', 'ι': 'i', 'ị': 'i', 'ï': 'i', 'ì': 'i', 'í': 'i', 'î': 'i', 'ī': 'i', 'ı': 'i', 'į': 'i', 'ǐ': 'i',
    'ј': 'j', 'ϳ': 'j',
    'κ': 'k', 'к': 'k', 'ķ': 'k',
    'ӏ': 'l', 'ḷ': 'l', 'ł': 'l', 'ľ': 'l', 'ĺ': 'l',
    'м': 'm', 'ṃ': 'm',
    'п': 'n', 'ո': 'n', 'ṇ': 'n', 'ñ': 'n', 'ń': 'n', 'ň': 'n', 'ņ': 'n',
    'о': 'o', 'ο': 'o', 'օ': 'o', 'ọ': 'o', 'ö': 'o', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o', 'ō': 'o', 'ő': 'o', 'ǒ': 'o',
    'р': 'p', 'ρ': 'p', 'ṗ': 'p',
    'ԛ': 'q',
    'г': 'r', 'ṛ': 'r', 'ŕ': 'r', 'ř': 'r',
    'ѕ': 's', 'ś': 's', 'ṣ': 's', 'ş': 's', 'š': 's', 'ș': 's',
    'т': 't', 'ţ': 't', 'ť': 't', 'ț': 't', 'ṭ': 't',
    'υ': 'u', 'ս': 'u', 'ụ': 'u', 'ü': 'u', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ū': 'u', 'ů': 'u', 'ű': 'u', 'ų': 'u', 'ǔ': 'u',
    'ν': 'v', 'ѵ': 'v', 'ṿ': 'v',
    'ԝ': 'w', 'ω': 'w', 'ẁ': 'w', 'ẃ': 'w', 'ẅ': 'w', 'ŵ': 'w',
    'х': 'x', 'χ': 'x', 'ẋ': 'x',
    'у': 'y', 'ү': 'y', 'γ': 'y', 'ỵ': 'y', 'ÿ': 'y', 'ý': 'y', 'ŷ': 'y',
    'ʐ': 'z', 'ż': 'z', 'ź': 'z', 'ž': 'z', 'ẓ': 'z',
  };

  function stripDiacritics(s) {
    try { return s.normalize('NFKD').replace(/[̀-ͯ]/g, ''); } catch (e) { return s; }
  }

  /** Map a label to its ASCII "skeleton" so confusables compare equal. */
  function skeleton(label) {
    let s = stripDiacritics(String(label || '').toLowerCase());
    s = Array.from(s).map((ch) => UNICODE_CONFUSABLES[ch] || ch).join('');
    s = Array.from(s).map((ch) => ASCII_CONFUSABLES[ch] || ch).join('');
    for (const [from, to] of MULTI_CONFUSABLES) s = s.split(from).join(to);
    return s;
  }

  function hasNonAscii(s) {
    return /[^\x00-\x7f]/.test(s);
  }

  /** Split a host into tokens on dots, hyphens and underscores. */
  function tokens(host) {
    return String(host || '').toLowerCase().split(/[.\-_]+/).filter(Boolean);
  }

  function tokenEmbedsKeyword(token, keyword) {
    if (token === keyword) return 'exact';
    if (brands.WHOLE_LABEL_ONLY.has(keyword)) return null;
    if (!token.includes(keyword)) return null;
    // Keyword embedded with a suspicious word or digits glued on: "paypalverify", "appleid2024"
    const rest = token.replace(keyword, '|').split('|').filter(Boolean);
    const okRest = rest.every((r) => /^\d+$/.test(r) || brands.SUSPICIOUS_TOKENS.includes(r) || r.length <= 2);
    return okRest ? 'embedded' : null;
  }

  /**
   * Analyse a hostname for impersonation of a known brand.
   * Returns { brand, reason, confidence, evidence } or null.
   */
  function detect(hostname, extraBrands) {
    const parsed = domain.parse(hostname);
    if (!parsed.host || parsed.isIP) return null;
    const allBrands = extraBrands && extraBrands.length ? brands.BRANDS.concat(extraBrands) : brands.BRANDS;

    // The real thing (or a subdomain of it) is never an impersonation.
    for (const b of allBrands) for (const d of b.domains) if (domain.isSubdomainOf(parsed.host, d)) return null;

    const unicodeHost = punycode.toUnicode(parsed.host);
    const unicodeParsed = domain.parse(unicodeHost);
    const sldSkeleton = skeleton(unicodeParsed.sld || parsed.sld);
    const hostTokens = tokens(parsed.host);
    const unicodeTokens = tokens(unicodeHost).map(skeleton);
    const isIdn = punycode.isPunycode(parsed.host) || hasNonAscii(unicodeHost);

    const findings = [];

    for (const b of allBrands) {
      for (const kw of b.keywords) {
        // 1. IDN / homoglyph: skeleton of the registrable SLD equals the brand keyword
        if (sldSkeleton === kw && (unicodeParsed.sld || parsed.sld) !== kw) {
          findings.push({ brand: b.name, reason: 'homoglyph', confidence: 0.95, evidence: `"${unicodeParsed.sld || parsed.sld}" looks like "${kw}"`, evidenceKey: 'ev_homoglyph', evidenceArgs: [unicodeParsed.sld || parsed.sld, kw] });
          continue;
        }
        // 2. Keyword embedded in any host token (subdomain or registrable)
        for (const t of hostTokens) {
          const how = tokenEmbedsKeyword(t, kw);
          if (how) {
            const inSubdomain = parsed.subdomain && tokens(parsed.subdomain).includes(t);
            findings.push({ brand: b.name, reason: inSubdomain ? 'brand-in-subdomain' : 'brand-in-domain', confidence: how === 'exact' ? 0.9 : 0.85, evidence: `hostname contains "${kw}" but is not a ${b.name} domain`, evidenceKey: 'ev_contains', evidenceArgs: [kw, b.name] });
            break;
          }
        }
        // 2b. Same check on confusable-normalised tokens (e.g. "paypa1-login")
        for (const t of unicodeTokens) {
          if (t !== kw && hostTokens.includes(t)) continue; // already handled above
          const how = tokenEmbedsKeyword(t, kw);
          if (how && !hostTokens.includes(t)) {
            findings.push({ brand: b.name, reason: 'homoglyph', confidence: 0.9, evidence: `hostname token normalises to "${kw}"`, evidenceKey: 'ev_normalises', evidenceArgs: [kw] });
            break;
          }
        }
        // 3. Typosquat of the registrable SLD (gooogle, paypai, amazom, faceboook)
        const sld = unicodeParsed.sld || parsed.sld;
        if (kw.length >= 5 && sld && sld !== kw) {
          const dist = domain.levenshtein(sldSkeleton, kw);
          const maxDist = kw.length >= 9 ? 2 : 1;
          if (dist > 0 && dist <= maxDist) {
            findings.push({ brand: b.name, reason: 'typosquat', confidence: dist === 1 ? 0.85 : 0.7, evidence: `"${sld}" is ${dist} edit${dist > 1 ? 's' : ''} away from "${kw}"`, evidenceKey: 'ev_typosquat', evidenceArgs: [sld, String(dist), kw] });
          }
          // "paypal-com", "paypalcom", "amazon-de" style: SLD = brand + tld glued
          const glued = sld.replace(/-/g, '');
          if (glued !== kw && glued.startsWith(kw) && /^(com|net|org|co|uk|de|fr|es|pt|it|nl|app|io|us|ca|au|br)$/.test(glued.slice(kw.length))) {
            findings.push({ brand: b.name, reason: 'brand-in-domain', confidence: 0.9, evidence: `"${sld}" mimics "${kw}.${glued.slice(kw.length)}"`, evidenceKey: 'ev_glued', evidenceArgs: [sld, kw + '.' + glued.slice(kw.length)] });
          }
        }
      }
    }

    if (!findings.length) return null;
    findings.sort((a, b) => b.confidence - a.confidence);
    const best = Object.assign({}, findings[0]);
    best.isIdn = isIdn;
    best.all = findings.map((f) => Object.assign({}, f));
    return best;
  }

  return { detect, skeleton, tokens, UNICODE_CONFUSABLES };
});
