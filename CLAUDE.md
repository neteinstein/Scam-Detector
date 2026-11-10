@AGENTS.md

Project: Scam Detector, a Manifest V3 extension for Chrome and Firefox (one source tree; `npm run package` builds both zips). No build step; `npm test` runs
unit tests plus `tools/check-store-listing.js`, which enforces rule 1 of AGENTS.md
(the Chrome Web Store kit in `store-listing/` must match the code). Before finishing
any change, apply the table in AGENTS.md rule 1, run the `update-scam-catalogue` skill
(rule 2) and run `npm test`.
