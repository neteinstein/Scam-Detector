# Privacy tab answers

## Single purpose description

Scam Detector has one purpose: to warn the user when the website they are viewing shows signs of being a scam or phishing site, by analysing the site's domain and page content locally and showing a warning banner and a risk score.

## Permission justifications

**`host_permissions: <all_urls>`** – The extension must analyse the page the user is currently viewing on any website, because scam sites can be hosted anywhere. The content script collects on-page signals (forms, brand references, wording) and renders the warning banner. The service worker also needs this scope to follow the RDAP bootstrap redirect from rdap.org to the registry's own RDAP server (a different host per top-level domain) when looking up a domain's registration date, to download the phishing-reports feed from data.phishtank.com (which redirects to a CDN host), and, only when the user enables it with their own key, to call safebrowsing.googleapis.com. No page content is transmitted; analysis happens in the browser.

**`storage`** – Stores user settings (thresholds, trusted domains, custom brands, chat-monitor toggle) in `chrome.storage.sync`, caches domain-registration lookups in `chrome.storage.local` for seven days so the same domain is not queried repeatedly, and keeps the per-tab analysis result in `chrome.storage.session` so the popup can display it.

**`tabs`** – Needed to read the active tab's URL and id so the popup shows the result for the right tab, to update the toolbar badge per tab, and to clear a tab's result when it navigates or closes.

**`alarms`** – Refreshes the local copy of the phishing-reports feed a few times a day and runs a once-a-day cleanup of expired lookup-cache entries in the service worker.

**`unlimitedStorage`** – The phishing-reports feed (about 50,000 verified addresses from PhishTank, stored as truncated hashes) is around 1–2 MB and can exceed the default 10 MB `chrome.storage.local` quota together with the lookup cache. Nothing is stored other than this feed, the lookup cache and settings.

**Content scripts on `http://*/*` and `https://*/*`** – Same reason as the host permission: the warning must be able to appear on any web page.

## Remote code

**No, I am not using remote code.** All JavaScript is packaged in the extension. The extension loads no external scripts, no eval, no WebAssembly from the network, and no remotely hosted configuration.

## Data usage

Does the extension collect or transmit any of the following user data?

| Category | Answer |
| --- | --- |
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No (the optional chat monitor reads chat text on the page but never stores or transmits it) |
| Location | No |
| Web history | No by default (the current page is analysed in memory; nothing is logged). If the user turns on the optional Google Safe Browsing check and enters their own API key, the address of each page visited is sent to Google's Safe Browsing Lookup API for the check and is not stored by the extension. |
| User activity | No |
| Website content | No (processed locally only; outbound data is limited to the bare domain name sent to the RDAP service and, if the user opts in, the page address sent to Google Safe Browsing). The phishing-reports feed is downloaded from data.phishtank.com; that request carries no user data. |

Certifications (tick all three):

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy URL

Host `privacy-policy.html` from this folder (for example via GitHub Pages) and paste the URL. Recommended: `https://neteinstein.github.io/Scam-Detector/privacy-policy.html`.
