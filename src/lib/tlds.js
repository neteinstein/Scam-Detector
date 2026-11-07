/*
 * TLD risk weighting. These are TLDs with a consistently high share of
 * phishing / malware registrations relative to legitimate use (Spamhaus,
 * Interisle "Phishing Landscape" and APWG reports). Presence alone is a weak
 * signal; it adds weight mostly when combined with other indicators.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SD = root.SD || {}; root.SD.tlds = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const HIGH_RISK = new Set([
    'tk', 'ml', 'ga', 'cf', 'gq', // Freenom free TLDs
    'zip', 'mov', // file-extension TLDs
    'top', 'xyz', 'buzz', 'icu', 'cam', 'rest', 'monster', 'quest', 'cfd', 'sbs', 'bond', 'lol', 'click', 'link',
    'surf', 'fit', 'cyou', 'cc', 'pw', 'ws', 'work', 'loan', 'men', 'date', 'racing', 'party', 'download', 'review', 'stream',
    'gdn', 'win', 'bid', 'trade', 'webcam', 'science', 'accountant', 'faith', 'cricket', 'kim', 'country', 'christmas',
    'host', 'website', 'space', 'site', 'online', 'tech', 'store', 'fun', 'uno', 'live', 'shop', 'vip', 'pics', 'autos',
    'boats', 'hair', 'beauty', 'makeup', 'skin', 'quest', 'motorcycles', 'yachts', 'homes', 'lat', 'ru', 'su', 'cn',
    'wang', 'ren', 'xin', 'icu', 'mom', 'best', 'guru', 'rocks', 'ninja', 'wiki', 'asia', 'biz', 'info', 'mobi', 'cloud',
  ]);
  // Weights: free / file-extension TLDs are worst, generic cheap TLDs moderate.
  const WEIGHTS = {
    tk: 14, ml: 14, ga: 14, cf: 14, gq: 14, zip: 14, mov: 12,
    top: 12, xyz: 10, buzz: 12, icu: 12, cam: 12, rest: 12, monster: 12, quest: 12, cfd: 12, sbs: 12, bond: 12, lol: 10,
    click: 10, link: 10, surf: 10, fit: 10, cyou: 12, cc: 8, pw: 12, ws: 8, work: 10, loan: 12, men: 12, date: 12, racing: 12,
    party: 12, download: 12, review: 10, stream: 10, gdn: 12, win: 12, bid: 12, trade: 12, webcam: 12, science: 10, accountant: 12,
    faith: 12, cricket: 12, kim: 10, country: 12, christmas: 10, host: 6, website: 6, space: 6, site: 6, online: 6, tech: 5,
    store: 5, fun: 8, uno: 8, live: 5, shop: 5, vip: 8, pics: 8, autos: 8, boats: 8, hair: 8, beauty: 8, makeup: 8, skin: 8,
    motorcycles: 8, yachts: 8, homes: 8, lat: 8, ru: 4, su: 8, cn: 4, wang: 8, ren: 8, xin: 8, mom: 8, best: 6, guru: 5,
    rocks: 5, ninja: 5, wiki: 5, asia: 5, biz: 5, info: 5, mobi: 6, cloud: 4,
  };

  function riskWeight(suffix) {
    const tld = String(suffix || '').toLowerCase().split('.').pop();
    return WEIGHTS[tld] || 0;
  }

  return { HIGH_RISK, WEIGHTS, riskWeight };
});
