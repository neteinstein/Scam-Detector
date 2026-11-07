/*
 * Tiny wrapper over chrome.i18n with English fallbacks, shared by the
 * content script, popup and options page. Signals and chat schemes carry
 * message keys + arguments (see scoring.js / chatSchemes.js) so they render
 * in the browser's UI language.
 *
 * Plain-language mode ("Non-tech terms", on by default): when a message
 * `<key>_plain` exists it is used instead of `<key>`, so the same code shows
 * jargon-free wording. Messages without a plain variant are shown as they are.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.i18n = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  let plain = true;
  /** Turn plain-language wording on or off (from the plainLanguage setting). */
  function setPlain(on) { plain = on !== false; }
  function isPlain() { return plain; }

  function has() { return typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getMessage === 'function'; }

  /** Translate `key` with substitutions; returns `fallback` (or the key) when no message exists. */
  function t(key, args, fallback) {
    if (has()) {
      try {
        const subs = (args || []).map(String);
        const m = (plain && chrome.i18n.getMessage(key + '_plain', subs)) || chrome.i18n.getMessage(key, subs);
        if (m) return m;
      } catch (e) { /* fall through */ }
    }
    return fallback != null ? fallback : key;
  }

  /** Localised label of a scoring signal. */
  function signalLabel(s) {
    if (!s) return '';
    if (s.id === 'domain-age' && s.ageKey) return t(s.key, [t(s.ageKey, s.ageArgs, '')], s.label);
    if (s.id === 'safe-browsing' && s.typeKey) return t(s.key, [t(s.typeKey, [], s.args && s.args[0])], s.label);
    return t(s.key || ('sig_' + String(s.id).replace(/-/g, '_')), s.args, s.label);
  }

  /** Localised detail of a scoring signal (dynamic details such as hostnames are left as they are). */
  function signalDetail(s) {
    if (!s) return '';
    if (s.detailKey) return t(s.detailKey, s.detailArgs, s.detail);
    return s.detail || '';
  }

  function chatTitle(c) { return c ? t(c.titleKey, c.titleArgs, c.title) : ''; }
  function chatAdvice(c) { return c ? t(c.adviceKey, c.adviceArgs, c.advice) : ''; }

  /** Fill elements carrying data-i18n / data-i18n-placeholder / data-i18n-title attributes. */
  function applyToDocument(doc) {
    doc = doc || document;
    for (const el of doc.querySelectorAll('[data-i18n]')) { const m = t(el.getAttribute('data-i18n'), [], null); if (m) el.textContent = m; }
    for (const el of doc.querySelectorAll('[data-i18n-placeholder]')) { const m = t(el.getAttribute('data-i18n-placeholder'), [], null); if (m) el.setAttribute('placeholder', m); }
    for (const el of doc.querySelectorAll('[data-i18n-title]')) { const m = t(el.getAttribute('data-i18n-title'), [], null); if (m) el.setAttribute('title', m); }
    if (doc.title && doc.querySelector('title[data-i18n]')) doc.title = t(doc.querySelector('title[data-i18n]').getAttribute('data-i18n'), [], doc.title);
  }

  return { t, setPlain, isPlain, signalLabel, signalDetail, chatTitle, chatAdvice, applyToDocument };
});
