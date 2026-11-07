# Chrome Web Store submission kit

Everything needed to publish **Scam Detector** on the Chrome Web Store lives in this
folder. Files are organised by the tabs of the developer dashboard
(https://chrome.google.com/webstore/devconsole).

| File | Where it goes |
| --- | --- |
| `../dist/scam-detector-<version>.zip` (run `npm run package`) | **Package → Upload new package** |
| `listing.md` | **Store listing**: title, summary, description, category, language |
| `assets/screenshot-*.png` (1280×800) | **Store listing → Screenshots** (upload in the numbered order) |
| `assets/promo-small-440x280.png` | **Store listing → Small promo tile** (required) |
| `assets/promo-marquee-1400x560.png` | **Store listing → Marquee promo tile** (optional) |
| `../icons/icon128.png` | Store icon (taken from the package automatically) |
| `privacy-policy.md` / `privacy-policy.html` | **Privacy → Privacy policy URL** (host the HTML, see below) |
| `privacy-practices.md` | **Privacy → Single purpose, permission justifications, data usage, remote code** |
| `distribution.md` | **Distribution**: visibility, regions, pricing |

Regenerate screenshots and promo tiles with `npm run store-assets` (uses the bundled
Chromium through Playwright; takes about 20 s).

## Step by step

1. **Developer account.** Sign in at the developer dashboard with the Google account
   that will own the extension and pay the one-time registration fee. For a company
   listing, set up a publisher group / verified publisher under *Account*.
2. **Build the package.** From the repository root:
   ```
   npm test            # all unit tests must pass
   npm run e2e         # banner smoke test in Chromium
   npm run package     # writes dist/scam-detector-<version>.zip
   ```
   Bump `version` in `manifest.json` before every upload; the store rejects a version
   that is not higher than the published one.
3. **Create the item** (*New item* → upload the zip). The manifest name, description,
   version and icon are read from the package.
4. **Store listing tab.** Paste the fields from `listing.md`, upload the screenshots
   from `assets/` in order and the small promo tile. Choose category
   *Privacy & Security* (listed as `Productivity → Privacy` in some dashboard versions)
   and language *English*.
5. **Privacy tab.** Host `privacy-policy.html` somewhere public and paste its URL. The
   simplest option is GitHub Pages for this repository
   (`Settings → Pages → Deploy from branch`, folder `/store-listing`), which gives
   `https://neteinstein.github.io/Scam-Detector/privacy-policy.html`. Then copy the
   answers from `privacy-practices.md` into *Single purpose*, each permission
   justification, the *Data usage* checkboxes and the certification checkbox.
6. **Distribution tab.** Follow `distribution.md`.
7. **Submit for review.** Items that request `<all_urls>` host permissions get a manual
   review that typically takes a few days. The review team may ask why broad host
   access is needed; the justification in `privacy-practices.md` is written to answer
   that. Keep the e2e screenshots handy in case they want to see the banner in action.
8. **After publishing.** Tag the commit (`git tag v<version>`), keep `CHANGELOG`
   entries in the detailed description's *What's new* section, and re-run step 2
   for every update.

## Pre-submission checklist

- [ ] `manifest.json` version bumped; `description` ≤ 132 characters (store limit).
- [ ] `npm test` and `npm run e2e` pass.
- [ ] `npm run package` output inspected: only `manifest.json`, `src/`, `popup/`,
      `options/`, `icons/` are inside (no tests, tools, docs, screenshots).
- [ ] Screenshots regenerated if the UI changed (`npm run store-assets`).
- [ ] Privacy policy URL is reachable without login and matches `privacy-policy.md`.
- [ ] Listing text does not mention other brands as endorsements (brand names appear
      only to describe what the extension detects).
- [ ] No remote code: the extension loads no external scripts (`privacy-practices.md`
      declares this; keep it true).
