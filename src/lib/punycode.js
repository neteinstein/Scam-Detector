/*
 * Minimal RFC 3492 punycode decoder, used to turn "xn--" IDN labels back
 * into Unicode so homoglyph / confusable checks can run on them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.punycode = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const BASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700, INITIAL_BIAS = 72, INITIAL_N = 128;

  function digit(cp) {
    if (cp - 48 < 10) return cp - 22;
    if (cp - 65 < 26) return cp - 65;
    if (cp - 97 < 26) return cp - 97;
    return BASE;
  }

  function adapt(delta, numPoints, firstTime) {
    let k = 0;
    delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    for (; delta > ((BASE - TMIN) * TMAX) >> 1; k += BASE) delta = Math.floor(delta / (BASE - TMIN));
    return Math.floor(k + ((BASE - TMIN + 1) * delta) / (delta + SKEW));
  }

  function decodeLabel(input) {
    const output = [];
    let basic = input.lastIndexOf('-');
    if (basic < 0) basic = 0;
    for (let j = 0; j < basic; j++) {
      const cp = input.charCodeAt(j);
      if (cp >= 0x80) throw new Error('not-basic');
      output.push(cp);
    }
    let n = INITIAL_N, bias = INITIAL_BIAS, i = 0;
    for (let index = basic > 0 ? basic + 1 : 0; index < input.length;) {
      const oldi = i;
      for (let w = 1, k = BASE; ; k += BASE) {
        if (index >= input.length) throw new Error('invalid-input');
        const d = digit(input.charCodeAt(index++));
        if (d >= BASE) throw new Error('invalid-input');
        i += d * w;
        const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
        if (d < t) break;
        w *= BASE - t;
      }
      const out = output.length + 1;
      bias = adapt(i - oldi, out, oldi === 0);
      n += Math.floor(i / out);
      i %= out;
      output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
  }

  /** Decode a full hostname; labels that are not punycode are returned as is. */
  function toUnicode(hostname) {
    return String(hostname || '')
      .split('.')
      .map((label) => {
        if (!/^xn--/i.test(label)) return label;
        try { return decodeLabel(label.slice(4)); } catch (e) { return label; }
      })
      .join('.');
  }

  function isPunycode(hostname) {
    return /(^|\.)xn--/i.test(String(hostname || ''));
  }

  return { toUnicode, decodeLabel, isPunycode };
});
