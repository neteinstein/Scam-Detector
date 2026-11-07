# Store listing text

## Title (max 45 characters)

Scam Detector – scam & phishing warnings

## Summary (max 132 characters)

Warns you when a website looks like a scam: new domains, brand impersonation, phishing forms, money-fraud wording and chat scams.

## Category

Privacy & Security

## Language

English (the extension's detection also covers Portuguese, Spanish and French text)

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
• Money-fraud templates: guaranteed returns, advance fees to "release" funds, no-credit-check loans with upfront fees, jobs that charge a registration fee, overpayment refunds, lottery and inheritance lures, fake escrow, crypto doubling and airdrops
• Fake navigation, deceptive links, decorative "secure" badges

Wording is recognised in English, Portuguese, Spanish and French.

VERIFIED PHISHING REPORTS (on by default)
A local copy of PhishTank's community-verified phishing addresses (about 50,000, refreshed a few times a day) is kept on your device as hashes. A page that is in it, or a site with several verified reports, is flagged immediately, even when it sits on a big platform such as Google Docs or a link shortener. Matching is local: the pages you visit are never sent to PhishTank.

GOOGLE SAFE BROWSING (optional, off by default)
If you enter your own Google API key, the extension also asks Google's Safe Browsing Lookup API about each page and shows "Advisory provided by Google" on any warning that comes from it. Non-commercial use only, per Google's terms.

MARKETPLACE CHAT MONITOR (optional, off by default)
On OLX, Vinted, Wallapop, Leboncoin, Marktplaats, eBay, Facebook Marketplace, Idealista and many other classified sites, the extension can watch the conversation for the standard scam scripts: "I'll send a courier, click the link to receive the payment", "enter your card details to receive the money", "the payment is held until you pay the insurance", "send me the SMS code", "pay the deposit before the viewing", overpayment refunds and look-alike payment links. A banner explains the scheme and what to do.

HOW THE WARNING WORKS
Each finding adds to a 0–100 risk score. From 60 you get a red "likely a scam" banner, from 35 an amber "suspicious" one. The toolbar badge shows the score for the current tab and the popup lists every finding with its weight. You can dismiss a banner, leave the site in one click, or trust a site so it is never flagged again. Thresholds, the domain-age lookup, trusted sites, the chat monitor and extra brands you want protected are all configurable.

PRIVACY
No browsing history, page content or personal data is collected or sent anywhere. Network requests are limited to: an optional lookup of the domain name (never the full address) against the public RDAP registry service to learn the registration date, cached for a week; the periodic download of the PhishTank reports feed, which carries no information about you; and, only if you opt in with your own key, the Google Safe Browsing check, which does send page addresses to Google. Each can be switched off. No accounts, no analytics, no remote code.

LIMITATIONS
This is a heuristic tool, not a blocklist. A carefully made scam on an old domain can score low and an aggressive marketing page can score in the amber range. Treat a banner as a prompt to look closer, and never enter passwords or payment details on a site you are unsure about.

Open source: https://github.com/neteinstein/Scam-Detector

## What's new (version 1.1.0)

• Verified phishing reports: a local copy of PhishTank's feed flags reported pages and sites, with no browsing data sent out.
• Optional Google Safe Browsing check with your own API key.
• Catalogue refresh: 35 more impersonated brands (Allegro, Bradesco, Société Générale, La Banque Postale, Nubank, Optus, Raiffeisen, Poste Italiane, impots.gouv.fr, Ameli…) and better handling of link shorteners and shared hosting.

Version 1.0.0: domain-age lookup, brand impersonation detection, page phishing signals, money-fraud wording in English/Portuguese/Spanish/French, optional marketplace chat monitor.
