/*
 * Collects observations about the current document that the scorer turns
 * into signals. Runs inside the page (content script), so it must be cheap
 * and must never throw.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'), require('./brands.js'), require('./phrases.js'));
  else { root.SD = root.SD || {}; root.SD.pageSignals = factory(root.SD.domain, root.SD.brands, root.SD.phrases); }
})(typeof self !== 'undefined' ? self : this, function (domain, brands, phrases) {
  const MAX_TEXT = 200000;

  // Brand names that are everyday words; only count them in titles when they
  // appear in an account / login context.
  const TITLE_PATTERNS = {
    'Apple': /\b(apple\s*(id|account|icloud|support|store|pay)|icloud)\b/,
    'Visa': /\bvisa\s+(secure|verification|checkout|card verification)\b/,
    'Mastercard': /\bmastercard\s+(securecode|identity check|verification)\b/,
    'Chase': /\bchase\s+(bank|online|account|sign)/,
    'Steam': /\bsteam\s*(community|account|login|powered|guard|wallet|trade)/,
    'Orange': /\borange\s+(mobile|money|bank|telecom|portugal|france|espa|mon compte|fr)\b/,
    'Booking.com': /\bbooking\.com\b/,
    'Wise': /\b(transferwise|wise\s+(account|transfer|login))\b/,
    'Target': /\btarget\.com\b/,
    'ING': /\bing\s+(bank|direct|banking|login|home.?bank)\b/,
    'UPS': /\bups\s+(tracking|delivery|package|parcel|my ?choice|shipment)\b/,
    'AT&T': /\bat&t\b/,
    'CTT': /\bctt\s+(expresso|encomenda|correios|entrega|tracking)\b/,
    'MEO': /\bmeo\b.{0,40}\b(fatura|conta|pagamento|cliente)\b/,
    'NOS': /\bnos\b.{0,40}\b(fatura|conta|pagamento|cliente)\b/,
    'EDP': /\bedp\b.{0,40}\b(fatura|conta|pagamento|cliente|comercial)\b/,
    'Phantom': /\bphantom\s+wallet\b/,
    'Ledger': /\bledger\s+(live|wallet|nano|support)\b/,
    'Evri': /\b(evri|hermes)\s+(parcel|delivery|tracking)\b/,
    'Discord': /\bdiscord\b/,
    'Facebook / Meta': /\b(facebook|instagram|whatsapp|messenger)\b/,
    'X / Twitter': /\b(twitter|x\.com)\b/,
    'Microsoft': /\b(microsoft|office ?365|outlook|onedrive|sharepoint|hotmail|xbox)\b/,
    'Google': /\b(google|gmail|youtube)\b/,
    'Amazon': /\b(amazon|prime video)\b/,
    'Cash App': /\bcash ?app\b/,
    'MB WAY': /\bmb ?way\b/,
    'Caixa Geral de Depósitos': /\b(caixa ?geral|caixadirecta|cgd)\b/,
    'Millennium BCP': /\b(millennium ?bcp|millenniumbcp)\b/,
    'Autoridade Tributária': /\b(portal das finan[çc]as|autoridade tribut[áa]ria|finan[çc]as\b.{0,30}\b(reembolso|d[íi]vida|notifica))/,
    'Segurança Social': /\bseguran[çc]a social\b/,
    'GOV.UK': /\bgov\.uk\b/,
    'Bank of America': /\bbank of america\b/,
    'Wells Fargo': /\bwells fargo\b/,
    'American Express': /\b(american express|amex)\b/,
    'Royal Mail': /\broyal mail\b/,
    'La Poste': /\b(la poste|colissimo)\b/,
    'Deutsche Post': /\bdeutsche post\b/,
    'Deutsche Bank': /\bdeutsche bank\b/,
    'Canada Post': /\bcanada post\b/,
    'Australia Post': /\b(australia post|auspost)\b/,
    'Social Security Administration': /\bsocial security\b/,
    'Western Union': /\bwestern union\b/,
    'Geek Squad': /\bgeek squad\b/,
    'Trust Wallet': /\btrust wallet\b/,
    'Epic Games': /\b(epic games|fortnite)\b/,
    'Best Buy': /\bbest ?buy\b/,
    'Commonwealth Bank': /\b(commonwealth bank|commbank|netbank)\b/,
    'TD Bank': /\btd (bank|canada trust)\b/,
    'Capital One': /\bcapital one\b/,
    'Novo Banco': /\bnovo ?banco\b/,
    'Crédito Agrícola': /\bcr[ée]dito agr[íi]cola\b/,
    'Agencia Tributaria': /\bagencia tributaria\b/,
    'Comcast / Xfinity': /\b(xfinity|comcast)\b/,
    'T-Mobile': /\bt-?mobile\b/,
    'Disney+': /\bdisney\s?(\+|plus)\b/,
    'Blockchain.com': /\bblockchain\.com\b/,
    'Proton': /\bproton ?mail\b/,
    'BPI': /\bbanco ?bpi\b/,
    'BT': /\bbt\s+(internet|broadband|mail|account)\b/,
    'Montepio': /\bmontepio\b/,
    'ActivoBank': /\bactivo ?bank\b/,
    'OLX': /\bolx\b/,
    'Ticketmaster': /\bticketmaster\b/,
    'Allegro': /\ballegro\s*(lokalnie|pay|smart|konto|logowanie)\b|\ballegrolokalnie\b/,
    'Optus': /\boptus\s+(bill|account|my ?optus|sign)/,
    'Free Mobile': /\bfree\s+mobile\b/,
    'Société Générale': /\bsociete generale\b/,
    'La Banque Postale': /\bbanque postale\b/,
    'Crédit Agricole': /\bcredit agricole\b/,
    'BNP Paribas': /\bbnp paribas\b/,
    'Ameli (Assurance Maladie)': /\b(ameli|assurance maladie)\b/,
    'impots.gouv.fr': /\bimpots\.gouv\b|\bdirection generale des finances publiques\b|\bdgfip\b/,
    'ANTAI (amendes)': /\bantai\b|\bamendes\.gouv\b/,
    'Interactive Brokers': /\binteractive brokers\b|\bibkr\b/,
    'ABN AMRO': /\babn amro\b/,
    'Banco do Brasil': /\bbanco do brasil\b/,
    'Swiss Post': /\bswiss post\b|\bpostfinance\b|\bdie post\b|\bla poste suisse\b/,
    'Intesa Sanpaolo': /\bintesa sanpaolo\b/,
    'Poste Italiane': /\bposte italiane\b|\bpostepay\b/,
  };
  // Brands whose names are too generic to look for in page text at all.
  const SKIP_IN_TEXT = new Set(['Continente', 'Via Verde', 'Allegro', 'Optus', 'SMBC', 'DBS', 'AEON', 'ABSA', 'Huntington', 'Raiffeisen', 'Hermes (DE)', 'Free Mobile', 'Postbank', 'DKB', 'Zoom', 'Slack', 'Stripe', 'Klarna', 'Uber', 'Temu', 'Shein', 'Canva', 'Kraken', 'Okta', 'Yahoo', 'GitHub', 'Shopify', 'Airbnb', 'Vinted', 'Wallapop', 'Leboncoin', 'Marktplaats', 'Gumtree', 'Craigslist', 'AliExpress', 'Walmart', 'Costco', 'eBay', 'Spotify', 'Netflix', 'Dropbox', 'DocuSign', 'Adobe', 'Telegram', 'LinkedIn', 'Nintendo', 'PlayStation', 'Roblox', 'Uniswap', 'OpenSea', 'MetaMask', 'Trezor', 'Coinbase', 'Binance', 'Revolut', 'N26', 'Zelle', 'Venmo', 'PayPal', 'Norton', 'McAfee', 'Verizon', 'Vodafone', 'IRS', 'HMRC', 'DVLA', 'Medicare', 'USPS', 'FedEx', 'DHL', 'PostNL', 'Correos', 'Santander', 'BBVA', 'CaixaBank', 'HSBC', 'Barclays', 'Lloyds', 'NatWest', 'Halifax', 'RBC', 'MoneyGram']);
  // ...except these get the simple word-boundary check on their name.
  const SIMPLE_NAME = new Set(['PayPal', 'Netflix', 'Dropbox', 'DocuSign', 'Adobe', 'Telegram', 'LinkedIn', 'Nintendo', 'PlayStation', 'Roblox', 'Uniswap', 'OpenSea', 'MetaMask', 'Trezor', 'Coinbase', 'Binance', 'Revolut', 'N26', 'Zelle', 'Venmo', 'Norton', 'McAfee', 'Verizon', 'Vodafone', 'IRS', 'HMRC', 'DVLA', 'Medicare', 'USPS', 'FedEx', 'DHL', 'PostNL', 'Correos', 'Santander', 'BBVA', 'CaixaBank', 'HSBC', 'Barclays', 'Lloyds', 'NatWest', 'Halifax', 'RBC', 'MoneyGram', 'Spotify', 'eBay', 'Walmart', 'Costco', 'AliExpress', 'Netflix', 'Okta', 'Kraken', 'Yahoo', 'GitHub', 'Shopify', 'Airbnb', 'Vinted', 'Klarna', 'Stripe', 'Zoom', 'Slack']);

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function plainName(name) {
    let n = String(name).toLowerCase();
    try { n = n.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { /* ignore */ }
    return n;
  }

  function brandPattern(b) {
    if (TITLE_PATTERNS[b.name]) return TITLE_PATTERNS[b.name];
    if (SIMPLE_NAME.has(b.name)) return new RegExp('\\b' + escapeRe(plainName(b.name)) + '\\b');
    if (SKIP_IN_TEXT.has(b.name)) return null;
    return new RegExp('\\b' + escapeRe(plainName(b.name)) + '\\b');
  }

  function brandsInText(text, allBrands) {
    allBrands = allBrands || brands.BRANDS;
    const t = plainName(text || '');
    const out = [];
    for (const b of allBrands) {
      const re = brandPattern(b);
      if (re && re.test(t)) out.push(b.name);
    }
    return out;
  }

  function countBrandMentions(text, allBrands) {
    allBrands = allBrands || brands.BRANDS;
    const t = plainName(text || '');
    const out = {};
    for (const b of allBrands) {
      const re = brandPattern(b);
      if (!re) continue;
      const g = new RegExp(re.source, 'g');
      const m = t.match(g);
      if (m && m.length) out[b.name] = m.length;
    }
    return out;
  }

  function safeHost(url, base) {
    try { return new URL(url, base).hostname.toLowerCase(); } catch (e) { return ''; }
  }

  function attr(el, name) { return (el && el.getAttribute && el.getAttribute(name)) || ''; }

  function isCardInput(input) {
    const s = [attr(input, 'autocomplete'), attr(input, 'name'), attr(input, 'id'), attr(input, 'placeholder'), attr(input, 'aria-label')].join(' ').toLowerCase();
    return /cc-number|card[-_ ]?(number|num|no)|cardnumber|creditcard|credit[-_ ]?card|cvv|cvc|cc-csc|card[-_ ]?code|numero.{0,6}cart[aã]o|n[úu]mero.{0,6}tarjeta/.test(s);
  }

  function isSeedInput(input) {
    const s = [attr(input, 'name'), attr(input, 'id'), attr(input, 'placeholder'), attr(input, 'aria-label')].join(' ').toLowerCase();
    return /seed|mnemonic|recovery.?phrase|secret.?phrase|private.?key|12.?words?|24.?words?|frase.?(secreta|de recupera)/.test(s);
  }

  function isCredentialInput(input) {
    if (!input) return false;
    const type = (attr(input, 'type') || 'text').toLowerCase();
    if (type === 'password') return true;
    const s = [attr(input, 'autocomplete'), attr(input, 'name'), attr(input, 'id')].join(' ').toLowerCase();
    return /current-password|new-password|passw|senha|contrase/.test(s);
  }

  function isVisible(el) {
    try {
      const r = el.getBoundingClientRect();
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity || 1) > 0.05;
    } catch (e) { return true; }
  }

  /** Main entry: returns a plain serialisable object. */
  const TENANT_STORAGE_HOSTS = Array.from(domain.FREE_HOSTING_SUFFIXES).concat(['firebasestorage.googleapis.com']);

  function collect(doc, loc, extraBrands) {
    const allBrands = extraBrands && extraBrands.length ? brands.BRANDS.concat(extraBrands) : brands.BRANDS;
    const base = loc.href;
    const here = domain.parse(loc.hostname);
    const info = {
      url: loc.href, isHttps: loc.protocol === 'https:', title: '', siteName: '', headings: '',
      hasPasswordField: false, hasCardField: false, hasSeedPhraseField: false, hasHiddenPasswordField: false,
      forms: [], crossOriginFrames: 0, crossOriginFramesWithSameOriginForms: 0,
      titleBrands: [], bodyBrandCounts: {}, brandAssets: [], phrases: [],
      links: { total: 0, dead: 0, mismatched: 0, mismatchedSamples: [] },
      contextMenuBlocked: false, fakeBadges: 0, textLength: 0, externalMetaRefresh: '', copyright: '',
    };

    try { info.title = String(doc.title || '').slice(0, 300); } catch (e) { /* ignore */ }
    try {
      const og = doc.querySelector('meta[property="og:site_name"], meta[name="application-name"], meta[name="apple-mobile-web-app-title"]');
      info.siteName = og ? attr(og, 'content').slice(0, 200) : '';
    } catch (e) { /* ignore */ }
    try {
      info.headings = Array.from(doc.querySelectorAll('h1, h2')).slice(0, 10).map((h) => (h.textContent || '').trim()).join(' | ').slice(0, 500);
    } catch (e) { /* ignore */ }

    let text = '';
    try { text = (doc.body && doc.body.innerText) || ''; } catch (e) { /* ignore */ }
    if (!text) { try { text = (doc.body && doc.body.textContent) || ''; } catch (e) { /* ignore */ } }
    text = String(text).slice(0, MAX_TEXT);
    info.textLength = text.length;
    const lower = text.toLowerCase();

    const copyrightMatch = lower.match(/(©|\(c\)|copyright)\s*(\d{4}(\s*[-–]\s*\d{4})?)?\s*([^\n]{0,80})/);
    info.copyright = copyrightMatch ? copyrightMatch[0].slice(0, 120) : '';

    // Inputs & forms
    try {
      const inputs = Array.from(doc.querySelectorAll('input, textarea'));
      for (const input of inputs) {
        const type = (attr(input, 'type') || 'text').toLowerCase();
        if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'checkbox' || type === 'radio') continue;
        if (isCredentialInput(input)) {
          info.hasPasswordField = true;
          if (!isVisible(input)) info.hasHiddenPasswordField = true;
        }
        if (isCardInput(input)) info.hasCardField = true;
        if (isSeedInput(input)) info.hasSeedPhraseField = true;
      }
      const forms = Array.from(doc.querySelectorAll('form')).slice(0, 25);
      for (const form of forms) {
        const action = attr(form, 'action');
        const actionHost = action ? safeHost(action, base) : loc.hostname.toLowerCase();
        const actionParsed = domain.parse(actionHost);
        const fInputs = Array.from(form.querySelectorAll('input, textarea'));
        const hasPassword = fInputs.some(isCredentialInput);
        const hasCard = fInputs.some(isCardInput);
        let actionIsHttp = false;
        try { actionIsHttp = action ? new URL(action, base).protocol === 'http:' : loc.protocol === 'http:'; } catch (e) { /* ignore */ }
        info.forms.push({
          actionHost, crossDomain: !!actionHost && actionParsed.registrable !== here.registrable,
          hasPassword, hasCard, actionIsHttp, method: (attr(form, 'method') || 'get').toLowerCase(),
        });
      }
    } catch (e) { /* ignore */ }

    // Frames
    try {
      const frames = Array.from(doc.querySelectorAll('iframe')).slice(0, 50);
      for (const f of frames) {
        const src = attr(f, 'src');
        if (!src || src.startsWith('about:') || src.startsWith('javascript:')) continue;
        const h = safeHost(src, base);
        if (h && domain.parse(h).registrable !== here.registrable) info.crossOriginFrames++;
      }
    } catch (e) { /* ignore */ }

    // Brand mentions
    try {
      const headText = [info.title, info.siteName, info.headings, info.copyright].join(' | ');
      info.titleBrands = brandsInText(headText, allBrands);
      info.bodyBrandCounts = countBrandMentions(lower, allBrands);
    } catch (e) { /* ignore */ }

    // Brand assets hot-linked from the real brand's domain
    try {
      const assets = [];
      for (const el of Array.from(doc.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]'))) assets.push({ kind: 'favicon', url: attr(el, 'href') });
      for (const el of Array.from(doc.querySelectorAll('img[src]')).slice(0, 200)) assets.push({ kind: 'image', url: attr(el, 'src'), alt: (attr(el, 'alt') + ' ' + attr(el, 'src')).toLowerCase() });
      for (const el of Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]')).slice(0, 50)) assets.push({ kind: 'stylesheet', url: attr(el, 'href') });
      const seen = new Set();
      for (const a of assets) {
        if (!a.url || a.url.startsWith('data:') || a.url.startsWith('blob:')) continue;
        const h = safeHost(a.url, base);
        if (!h) continue;
        const reg = domain.parse(h).registrable;
        if (reg === here.registrable) continue;
        // Customer storage on a brand's cloud (storage.googleapis.com,
        // s3.amazonaws.com, blob.core.windows.net) is not the brand's own site.
        const tenantStorage = TENANT_STORAGE_HOSTS.some((suf) => h === suf || h.endsWith('.' + suf));
        const owner = tenantStorage ? null : brands.findByDomain(reg);
        if (owner && !owner.domains.some((d) => domain.isSubdomainOf(here.host, d))) {
          const key = owner.name + ':' + a.kind;
          if (!seen.has(key)) { seen.add(key); info.brandAssets.push({ brand: owner.name, host: h, kind: a.kind }); }
        }
        if (a.kind === 'image' && /norton|mcafee|trustwave|truste|verisign|secure-?badge|trust-?badge|ssl-?secure|verified-?seal|safe-?shopping|guarantee/.test(a.alt || '')) info.fakeBadges++;
      }
    } catch (e) { /* ignore */ }

    // Links: dead anchors and text/href host mismatch
    try {
      const anchors = Array.from(doc.querySelectorAll('a[href]')).slice(0, 500);
      for (const a of anchors) {
        const href = attr(a, 'href').trim();
        info.links.total++;
        if (href === '#' || href === '' || /^javascript:/i.test(href)) { info.links.dead++; continue; }
        const txt = (a.textContent || '').trim().toLowerCase();
        const m = txt.match(/^(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?:[/?#]|$)/);
        if (m) {
          const textReg = domain.parse(m[1]).registrable;
          const hrefHost = safeHost(href, base);
          const hrefReg = hrefHost ? domain.parse(hrefHost).registrable : '';
          if (hrefReg && textReg && hrefReg !== textReg) {
            info.links.mismatched++;
            if (info.links.mismatchedSamples.length < 3) info.links.mismatchedSamples.push(`${m[1]} → ${hrefHost}`);
          }
        }
      }
    } catch (e) { /* ignore */ }

    // Behavioural tells
    try {
      const b = doc.body;
      info.contextMenuBlocked = !!(b && (b.getAttribute('oncontextmenu') || '').includes('false')) || !!(doc.documentElement && (doc.documentElement.getAttribute('oncontextmenu') || '').includes('false'));
      const refresh = doc.querySelector('meta[http-equiv="refresh" i]');
      if (refresh) {
        const c = attr(refresh, 'content');
        const m = c.match(/url\s*=\s*['"]?([^'"]+)/i);
        if (m) { const h = safeHost(m[1], base); if (h && domain.parse(h).registrable !== here.registrable) info.externalMetaRefresh = h; }
      }
    } catch (e) { /* ignore */ }

    // Language
    try { info.phrases = phrases.scan(lower); } catch (e) { /* ignore */ }

    return info;
  }

  return { collect, brandsInText, countBrandMentions, TITLE_PATTERNS };
});
