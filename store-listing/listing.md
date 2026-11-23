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
• Impersonation of ~200 frequently abused brands: banks, payment apps, couriers, toll operators, tax and traffic authorities, crypto services, big tech and marketplaces – including typos (gooogle), look-alike characters (paypa1, Cyrillic letters), brand names hidden in subdomains or glued to phishing words, and "brand-com.xyz" tricks
• Raw IP addresses, high-abuse top-level domains, phishing words in the address, missing HTTPS

Page
• Password, card or crypto seed-phrase forms on look-alike, brand-new, free-hosted (including AI and no-code site builders) or IP-addressed sites
• Fake "verify you are human" pages that tell you to press Win+R or open Terminal and paste a command (the "ClickFix" malware trick), and "I'm not a robot" boxes with no real CAPTCHA behind them
• Credentials sent to another domain or over plain HTTP
• Pages that call themselves a brand they are not, or borrow the real brand's logo and favicon
• Social-engineering wording: urgency, prizes, tech-support alerts, parcel-fee lures, tiny "verification fees", fake closing-down sales with 70–99% off
• Money-fraud templates: guaranteed returns, advance fees to "release" funds, no-credit-check loans with upfront fees, jobs that charge a registration fee, overpayment refunds, lottery and inheritance lures, fake escrow, crypto doubling and airdrops, fake online brokers ("clone firms") claiming to be licensed by a government, unpaid toll and traffic-fine demands, and "we recover your lost money" recovery scams
• Fake navigation, deceptive links, decorative "secure" badges

Wording is recognised in English, Portuguese, Spanish and French. Pages that warn about scams (news, consumer advice, forums such as Reddit's r/Scams) quote scam wording, so there it counts for much less.

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

## What's new (version 1.5.1)

• Fix: Amazon's country stores such as amazon.ae, amazon.sa, amazon.eg, amazon.com.tr, amazon.sg and amazon.ie were wrongly called fake. The extension now knows the country sites of about 40 global brands (Google's 190 country domains, eBay, Airbnb, Ticketmaster, Nintendo, Vinted, Mercado Libre, Walmart, HSBC, Vodafone and more), checked against the 200,000 most visited websites, and no longer flags well-known sites that merely share a brand's name (nos.nl, hermes.com).
• Websites in more countries (Qatar, Costa Rica, El Salvador, Panama, Lebanon…) are now told apart correctly instead of being treated as one site.
• New wording check in all four languages: fake "payment accepted – if this wasn't you, cancel here" messages.
• Catalogue: Aramex, Emirates Post and Noon (Gulf parcel and shopping scams), Portugal's IMT and Germany's Deutsche Rentenversicherung.

Version 1.5.0:

• New: recognises "ClickFix" pages, the fake "verify you are human" or "fix this error" screens that tell you to press Win+R (or open Terminal) and paste a command, which installs password-stealing malware. Also flags "I'm not a robot" boxes that have no real CAPTCHA behind them, a gate phishing kits use to hide from security scanners.
• New wording checks in English, Portuguese, Spanish and French: unpaid toll and traffic-fine demands (among the most reported scam text messages), "we can recover the money you lost" recovery scams, and fake closing-down sales with 70–99% off.
• Fewer false alarms on pages that warn about scams, such as news articles, consumer advice and Reddit's r/Scams, which quote scam wording.
• Catalogue: E-ZPass, SunPass, Spain's DGT (traffic fines) and Seguridad Social, Portugal's SNS 24, InPost, PKO BP, WeTransfer, RuneScape and Poshmark. Better at spotting brand names glued to phishing words or misspelt in rotating subdomains, and knows about 40 more site builders and free subdomain services that host phishing (Lovable, Bolt, Framer, Wix Studio, Square Online, GitBook, Cloudflare tunnels…). Government websites are no longer mistaken for impersonations.

Version 1.4.0:

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
