---
name: update-scam-catalogue
description: Refresh the extension's scam knowledge (impersonated brands, risky TLDs, scam phrases, chat schemes, monitored marketplaces, shared hosts) from current public reports, add what is missing with tests in all four languages, and record the review. Run before finishing any change to this repository, or on request.
---

# Update the scam catalogue

The extension only knows what is in these files. Scams move fast, so every change to
the repo ends with a short review of them against current public reporting.

| Catalogue | File | What it holds |
| --- | --- | --- |
| Brands | `src/lib/brands.js` | Impersonated brands: `name`, hostname `keywords`, real `domains`. `WHOLE_LABEL_ONLY` for short/generic keywords. Title patterns for ambiguous names in `src/lib/pageSignals.js` (`TITLE_PATTERNS`, `SIMPLE_NAME`, `SKIP_IN_TEXT`). |
| TLDs | `src/lib/tlds.js` | Abuse-heavy top-level domains with weights. |
| Phrases | `src/lib/phrases.js` | Social-engineering and money-fraud wording by category and language (`en`, `pt`, `es`, `fr`). |
| Chat schemes | `src/lib/chatSchemes.js` | Marketplace conversation scripts (`SCHEMES`) and monitored sites (`MARKETPLACES`). |
| Shared hosts | `src/lib/urlmatch.js` | `SHARED_HOSTS`: platforms where one phishing report says nothing about the host. |
| Host red flags | `src/lib/scoring.js` | `HOST_RED_FLAG_TOKENS`. |
| Review log | `catalogue/last-review.json` | Date, sources consulted, what was added. |

## Procedure

1. **Baseline.** Run `node tools/catalogue-report.js`. It prints counts per catalogue,
   days since the last review, and, if a PhishTank CSV is given with `--feed <path>`,
   the most-targeted brands that are missing from `brands.js`. (Download the feed with
   `curl -sSL https://data.phishtank.com/data/online-valid.csv.gz | gzip -dc > /tmp/feed.csv`;
   it is about 2 MB.)
2. **Research** what changed since `catalogue/last-review.json`. Use web search; prefer
   primary sources and the last 60 days. Minimum set:
   - Portugal: Banco de Portugal alerts, Polícia Judiciária, CNCS, DECO Proteste, Portal da Queixa.
   - Spain: INCIBE / OSI. France: cybermalveillance.gouv.fr, Signal-Arnaques. UK: Action Fraud, NCSC. US: FTC consumer alerts.
   - Global: APWG trends report, Spamhaus and Interisle TLD abuse data, PhishTank top targets (step 1), Europol.
   Look for: newly impersonated brands (banks, couriers, utilities, public bodies, marketplaces, payment apps), new TLDs in abuse lists, new wording in SMS/phishing/chat scams, new marketplace platforms, new shared hosting or link-shortener domains used by kits, seasonal campaigns (tax season, Black Friday, events).
3. **Apply** each finding to the right file, following `AGENTS.md`:
   - Brands: add `keywords` (lowercase, no separators) and every real domain the brand uses, including CDN/static domains, so the real site is never flagged. Short or generic keywords go in `WHOLE_LABEL_ONLY`; ambiguous names get a context pattern in `pageSignals.js`.
   - Phrases and chat schemes: write patterns **without accents**, for all four languages, with `\b` only next to ASCII letters. Keep the category weight unless there is a reason to change it.
   - Marketplaces, shared hosts, TLDs: add the registrable domain / TLD.
   - Remove entries that are no longer relevant only if they cause false positives.
4. **Test.** Add or extend unit tests in `test/` for every addition (positive match and a
   benign near-miss). Run `npm test`; it must pass.
5. **Record.** Update `catalogue/last-review.json`: `reviewedAt` (today), `sources`
   (URLs you actually read), `added` (one line per change), `notes` for things checked
   and deliberately not added. Keep the file small; it is a log, not an archive.
6. **Store listing.** If a user-visible category, language or monitored-site list changed,
   apply rule 1 of `AGENTS.md` (`listing.md` description / What's new; assets if the UI changed).
7. **Report** in one short paragraph what was added and what was checked without changes.

If research finds nothing new, still update `reviewedAt` and `sources` so the review is recorded.
