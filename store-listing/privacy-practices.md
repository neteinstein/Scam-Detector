# Privacy tab answers

## Single purpose description

Scam Detector has one purpose: to warn the user when the website they are viewing shows signs of being a scam or phishing site, by analysing the site's domain and page content locally and showing a warning banner and a risk score.

## Permission justifications

**`host_permissions: <all_urls>`** – The extension must analyse the page the user is currently viewing on any website, because scam sites can be hosted anywhere. The content script collects on-page signals (forms, brand references, wording) and renders the warning banner. The service worker also needs this scope to follow the RDAP bootstrap redirect from rdap.org to the registry's own RDAP server (a different host per top-level domain) when looking up a domain's registration date. No page content is transmitted; analysis happens in the browser.

**`storage`** – Stores user settings (thresholds, trusted domains, custom brands, chat-monitor toggle) in `chrome.storage.sync`, caches domain-registration lookups in `chrome.storage.local` for seven days so the same domain is not queried repeatedly, and keeps the per-tab analysis result in `chrome.storage.session` so the popup can display it.

**`tabs`** – Needed to read the active tab's URL and id so the popup shows the result for the right tab, to update the toolbar badge per tab, and to clear a tab's result when it navigates or closes.

**`alarms`** – Runs a once-a-day cleanup of expired lookup-cache entries in the service worker.

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
| Web history | No (the current page is analysed in memory; nothing is logged) |
| User activity | No |
| Website content | No (processed locally only; the only outbound data is the bare domain name sent to the RDAP service, which is not website content) |

Certifications (tick all three):

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy URL

Host `privacy-policy.html` from this folder (for example via GitHub Pages) and paste the URL. Recommended: `https://neteinstein.github.io/Scam-Detector/privacy-policy.html`.
