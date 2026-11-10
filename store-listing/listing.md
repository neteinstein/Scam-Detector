# Store listing text

## Title (max 45 characters)

Scam Detector – scam & phishing warnings

## Summary (max 132 characters)

Warns you when a website looks like a scam: new domains, brand impersonation, phishing forms, money-fraud wording and chat scams.

## Category

Privacy & Security

## Language

English (default). The interface (banner, popup, settings) and all explanations also ship in Portuguese, Spanish and French and follow the browser language; detection covers text in the same four languages. The store listing itself can be localised per language in the dashboard (Store listing → Add language) using translations of this file.

## Detailed description

Scam Detector looks at every page you open for the traces scams leave behind and shows a clear warning banner at the top of the page when the risk is high. Everything runs inside your browser.

WHAT IT CHECKS

Domain
• How recently the domain was registered (brand-new domains are the strongest scam signal)
• Impersonation of ~150 frequently abused brands: banks, payment apps, couriers, tax authorities, crypto services, big tech and marketplaces – including typos (gooogle), look-alike characters (paypa1, Cyrillic letters), brand names hidden in subdomains, and "brand-com.xyz" tricks
• Raw IP addresses, high-abuse top-level domains, phishing words in the address, missing HTTPS

Page
• Password, card or crypto seed-phrase forms on look-alike, brand-new, free-hosted or IP-addressed sites
• Credentials sent to another domain or over plain HTTP
• Pages that call themselves a brand they are not, or borrow the real brand's logo and favicon
• Social-engineering wording: urgency, prizes, tech-support alerts, parcel-fee lures, tiny "verification fees"
• Money-fraud templates: guaranteed returns, advance fees to "release" funds, no-credit-check loans with upfront fees, jobs that charge a registration fee, overpayment refunds, lottery and inheritance lures, fake escrow, crypto doubling and airdrops, and fake online brokers ("clone firms") claiming to be licensed by a government
• Fake navigation, deceptive links, decorative "secure" badges

Wording is recognised in English, Portuguese, Spanish and French.

VERIFIED PHISHING REPORTS (on by default)
A local copy of PhishTank's community-verified phishing addresses (about 50,000, refreshed a few times a day) is kept on your device as hashes. A page that is in it, or a site with several verified reports, is flagged immediately, even when it sits on a big platform such as Google Docs or a link shortener. Matching is local: the pages you visit are never sent to PhishTank.

GOOGLE SAFE BROWSING (on by default, needs your own API key)
Once you enter your own Google API key, the extension also asks Google's Safe Browsing Lookup API about each page and shows "Advisory provided by Google" on any warning that comes from it. Non-commercial use only, per Google's terms.

MARKETPLACE CHAT MONITOR (on by default)
On OLX, Vinted, Wallapop, Leboncoin, Marktplaats, eBay, Facebook Marketplace, Idealista and many other classified sites, the extension watches the conversation for the standard scam scripts: "I'll send a courier, click the link to receive the payment", "enter your card details to receive the money", "the payment is held until you pay the insurance", "send me the SMS code", "pay the deposit before the viewing", overpayment refunds and look-alike payment links. A banner explains the scheme and what to do.

IN YOUR LANGUAGE, IN PLAIN WORDS
The banner, popup, settings and every explanation are available in English, Portuguese, Spanish and French and follow your browser's language. "Non-tech terms" (on by default) explains every warning in simple words, without jargon such as domain, HTTP or favicon; turn it off in settings to see the technical wording.

HOW THE WARNING WORKS
Each finding adds to a 0–100 risk score. From 60 you get a red "likely a scam" banner, from 35 an amber "suspicious" one. The toolbar shield changes colour for the current tab: green with a check mark when nothing suspicious was found, yellow when there are minor signals, red when a warning banner is showing, and grey with a check mark on a site you trust. The popup shows the score and lists every finding with its weight. You can dismiss a banner, leave the site in one click, or trust a site so it is never flagged again. Thresholds, the domain-age lookup, trusted sites, the chat monitor and extra brands you want protected are all configurable.

PRIVACY
No browsing history, page content or personal data is collected or sent anywhere. Network requests are limited to: an optional lookup of the domain name (never the full address) against the public RDAP registry service to learn the registration date, cached for a week; the periodic download of the PhishTank reports feed, which carries no information about you; and, only once you enter your own key, the Google Safe Browsing check, which does send page addresses to Google. Each can be switched off. No accounts, no analytics, no remote code.

LIMITATIONS
This is a heuristic tool, not a blocklist. A carefully made scam on an old domain can score low and an aggressive marketing page can score in the amber range. Treat a banner as a prompt to look closer, and never enter passwords or payment details on a site you are unsure about.

Open source: https://github.com/neteinstein/Scam-Detector

## What's new (version 1.4.0)

• Scam Detector now also runs in Firefox (desktop 140 and later, Android 142 and later). Every release ships a Chrome package and a Firefox package built from the same code, with the same checks, languages and settings.
• If the browser has not given the extension access to websites (Firefox lets you withhold or revoke it), the popup now says so and offers a one-click button to allow it; until then no page can be checked.
• Catalogue: fake HOKA shoe shops (a Black Friday favourite) and fake Chave Móvel Digital login pages are now recognised.

Version 1.3.2:

• Fixed a false warning on Revolut's own payment-link pages (revolut.me), which were wrongly reported as a fake Revolut site.

Version 1.3.1:

• The toolbar shield itself now changes colour, with no dot or number on top: green with a check mark (nothing found), yellow (minor signals), red (warning showing), grey with a check mark (a site you trust). Pages that cannot be checked show a blue-grey shield.
• New About section at the end of the settings: who makes Scam Detector, a link to send feedback or report a bug, and ways to support its development (Revolut, Buy me a beer).

Version 1.3.0:

• New "Non-tech terms" option, on by default: every warning, explanation and setting is written in simple words. Turn it off to see the technical wording.
• The toolbar icon now shows a colour instead of a number: green (nothing found), yellow (minor signals), red (warning showing), grey with a check mark (a site you trust).
• The marketplace chat monitor is now on by default.
• Google Safe Browsing is now on by default; it starts checking pages as soon as you enter your own API key in settings.
• A welcome page opens after installation. It explains what the extension does and, first of all, what it cannot do: it will miss some scams, especially new tricks nobody has reported yet, so stay alert even when there is no warning.
• Catalogue: fake Continente card and Via Verde toll-payment sites are now recognised.

Version 1.2.2:

• New: detects fake online brokers ("clone firms") that claim to be licensed by a government, and online trading-platform pitches on newly registered sites.
• Fewer false alarms: images and icons a site keeps on its own cloud storage (Google Cloud Storage, Amazon S3, Azure) are no longer mistaken for copies of Google's, Amazon's or Microsoft's own pages.

Version 1.2.1:

• Fixed false alarms on major sites such as google.com: a phishing report about one redirect link or the home page no longer flags every page of a well-known service.
• A site mentioning its own brand ("Google" on google.com) is no longer counted as impersonation.
• No false alarms on mail.ru ("mail" is not a typo of "gmail") or on brand-owned domains such as cloud.microsoft.
• Phishing reports about a single form or page on a shared service (Microsoft Forms, TikTok, WhatsApp links) no longer flag the whole service. Validated against the 100 most visited sites.

Version 1.2.0:

• The whole interface now follows your browser language: English, Portuguese, Spanish and French.
• Every warning explanation, chat-scam advice and settings text is translated.

Version 1.1.0:

• Verified phishing reports: a local copy of PhishTank's feed flags reported pages and sites, with no browsing data sent out.
• Optional Google Safe Browsing check with your own API key.
• Catalogue refresh: 35 more impersonated brands (Allegro, Bradesco, Société Générale, La Banque Postale, Nubank, Optus, Raiffeisen, Poste Italiane, impots.gouv.fr, Ameli…) and better handling of link shorteners and shared hosting.

Version 1.0.0: domain-age lookup, brand impersonation detection, page phishing signals, money-fraud wording in English/Portuguese/Spanish/French, optional marketplace chat monitor.
