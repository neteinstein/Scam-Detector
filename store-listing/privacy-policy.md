# Scam Detector – Privacy Policy

_Last updated: 7 November 2026_

Scam Detector is a browser extension that warns you when a website shows signs of being a scam. This policy explains what the extension does with data.

## What the extension processes

To decide whether a page looks like a scam, the extension reads, **inside your browser**, the address of the page you are viewing and parts of its content: the title, headings, form fields, links, images and visible text. If you enable the optional marketplace chat monitor, the visible text of conversations on supported classified-ad sites is read in the same way. This processing happens in memory on your device. None of it is stored, logged or transmitted.

## What leaves your device

**One optional request: the domain name.** To find out how recently a domain was registered, the extension sends the site's registrable domain name (for example `example.com`, never the full address, page content or any identifier about you) to the public RDAP service at `rdap.org`, which redirects to the registry responsible for that domain. The response is cached on your device for seven days. You can turn this lookup off in the extension's settings; the rest of the analysis keeps working without it.

Nothing else is sent anywhere. The extension has no servers of its own, no accounts, no analytics, no advertising and no crash reporting.

## What is stored on your device

- Your settings (risk thresholds, trusted domains, extra brands, chat-monitor options) in Chrome's extension storage, which Chrome may sync between your own signed-in browsers.
- Cached domain-registration lookups (domain name, registration date, registrar name) for seven days.
- The analysis result for each open tab, kept only for the current browser session.

You can clear the lookup cache from the settings page, and remove everything by uninstalling the extension.

## Third parties

The only third parties involved are the RDAP service operators (rdap.org and the domain registries it redirects to), which receive the domain name as described above and are subject to their own policies. No data is sold or shared with anyone.

## Children

The extension does not knowingly collect any personal data from anyone, including children.

## Changes

If this policy changes, the new version will be published at the same address and the "last updated" date will change.

## Contact

Questions about this policy: pedro.vicente@mindera.com or open an issue at https://github.com/neteinstein/Scam-Detector.
