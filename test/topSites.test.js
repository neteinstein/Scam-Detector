const test = require('node:test');
const assert = require('node:assert/strict');
const scoring = require('../src/lib/scoring.js');
const lookalike = require('../src/lib/lookalike.js');
const brands = require('../src/lib/brands.js');

// Tranco top 100 (2026-11-07). None of these may reach the warning level on
// domain signals alone, nor when the page has an ordinary login form.
const TOP_SITES = [
  'google.com', 'cloudflare.com', 'ezviz7.com', 'amazonaws.com', 'facebook.com', 'fbcdn.net', 'gstatic.com',
  'googleapis.com', 'hicloudcam.com', 'youtube.com', 'microsoft.com', 'apple.com', 'akamai.net', 'instagram.com',
  'akamaiedge.net', 'twitter.com', 'linkedin.com', 'azure.com', 'triplinkintl.com', 'gwfb.net', 'akadns.net',
  'domaincontrol.com', 'mail.ru', 'googlevideo.com', 'googletagmanager.com', 'appsflyersdk.com', 'gtld-servers.net',
  'cloudfront.net', 'amazon.com', 'shiabank.com', 'office.com', 'dzen.ru', 'sharepoint.com', 'live.com', 'github.com',
  'aaplimg.com', 'trafficmanager.net', 'lsrelayaccess.com', 'wikipedia.org', 'cloud.microsoft', 'fastly.net',
  'apple-dns.net', 'netflix.com', 'whatsapp.net', 'office.net', 'w2rt6byl5nf1opmc-a.com', 'bing.com', 'x.com',
  'googleusercontent.com', 'pv-cdn.net', 'doubleclick.net', 'youtu.be', 'googlesyndication.com', 'pinterest.com',
  'windows.net', 'icloud.com', 'cloudflare.net', 'myfritz.net', 'gandi.net', 'goo.gl', 'adobe.com', 'zoom.us',
  'tiktok.com', 'microsoftonline.com', 'h264.io', 'whatsapp.com', 'wordpress.org', 'windowsupdate.com',
  'googledomains.com', 'yahoo.com', 'gvt1.com', 'wa.me', 'skype.com', 'edgekey.net', 'digicert.com', 'tiktokcdn.com',
  'spotify.com', 'opera.com', 'roblox.com', 'a2z.com', 'b-cdn.net', 'amazonvideo.com', 'epicgames.com', 'tiktokv.com',
  'workers.dev', 'vimeo.com', 'ntp.org', 'baidu.com', 'blogspot.com', '3gppnetwork.org', 'qq.com', 'aws.dev',
  'mozilla.org', 'msn.com', 'nginx.org', 'akam.net', 'f5.com', 'yandex.net', 'cdn77.org', 'wordpress.com',
];

const loginPage = { isHttps: true, hasPasswordField: true, hasCardField: false, hasSeedPhraseField: false, forms: [], titleBrands: [], bodyBrandCounts: {}, brandAssets: [], phrases: [], links: {} };

test('top-100 sites are not flagged, with or without a login form', () => {
  const settings = scoring.DEFAULT_SETTINGS;
  for (const d of TOP_SITES) {
    for (const host of [d, 'www.' + d]) {
      for (const ageDays of [4000, null]) {
        for (const page of [null, loginPage]) {
          const r = scoring.evaluate({ hostname: host, ageDays, rdapStatus: ageDays ? 'ok' : 'unknown' }, page, {});
          assert.ok(r.score < settings.warnThreshold, `${host} scored ${r.score}: ${r.signals.map((s) => s.id).join(', ')}`);
        }
      }
    }
  }
});

test('a generic word is not a typo of a brand (mail.ru is not gmail)', () => {
  assert.equal(lookalike.detect('mail.ru'), null);
  assert.equal(lookalike.detect('drive.com'), null);
  assert.equal(lookalike.detect('gmaill.com').brand, 'Google', 'real typosquats still caught');
});

test('closed brand top-level domains belong to the brand', () => {
  assert.equal(brands.findByDomain('cloud.microsoft').name, 'Microsoft');
  assert.equal(brands.findByDomain('about.google').name, 'Google');
  assert.equal(brands.findByDomain('microsoft'), null);
  assert.equal(scoring.evaluate({ hostname: 'www.cloud.microsoft' }, null, {}).verdict, 'trusted');
});
