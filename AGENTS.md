# Rules for agents working in this repository

These rules apply to every automated agent (Claude Code, Copilot, Cursor, Codex, …)
and to humans using them. `CLAUDE.md` imports this file.

## 1. Keep `store-listing/` in sync with the code

`store-listing/` is the Chrome Web Store submission kit. It must always describe the
extension **as it is in the working tree**. Whenever you change anything in this repo,
finish by checking whether the kit needs an update, and make that update **in the same
commit**. Then run `npm run check-listing` (also part of `npm test`); it fails when the
kit and the code disagree.

| If you changed… | then update… |
| --- | --- |
| `manifest.json` → `permissions`, `host_permissions`, `content_scripts.matches`, `optional_permissions` | `store-listing/privacy-practices.md`: add, remove or reword the justification for every permission. Each permission name must appear in backticks in that file. |
| `manifest.json` → `description` | `store-listing/listing.md` → *Summary* (must be identical, ≤ 132 chars). |
| `manifest.json` → `version` | `store-listing/listing.md` → *What's new (version X)* with a short changelog for that version. |
| `manifest.json` → `name` | `store-listing/listing.md` → *Title* (≤ 45 chars). |
| A user-facing feature, signal category, language, or monitored-site list (`src/lib/*.js`, `src/content.js`, `src/background.js`) | `store-listing/listing.md` → *Detailed description* and *What's new*. Keep claims accurate: never list a check the code does not perform. |
| What data is read, stored, cached, synced or sent over the network (any `fetch`, `chrome.storage`, new host) | `store-listing/privacy-policy.md` **and** regenerate `privacy-policy.html` from it (keep both identical in content), bump the *Last updated* date, and update the *Data usage* table and *Remote code* answer in `privacy-practices.md`. |
| Anything visible in the banner, popup or options page (`popup/`, `options/`, banner code in `src/content.js`, `icons/`) | Regenerate the screenshots and tiles: `npm run store-assets`. Commit the new PNGs. |
| The packaged file set (new runtime file or folder) | `tools/package.js` → `INCLUDE`, and confirm `npm run package` lists the file. |
| Supported browsers / Chrome minimum version | `store-listing/listing.md` and `distribution.md`. |

Nothing in `store-listing/` may promise behaviour the code does not have, and the code
must not do anything the privacy policy does not disclose. When in doubt, disclose.

## 2. Keep the scam catalogue current

The detection is only as good as the lists it ships: brands, TLDs, phrases, chat schemes,
marketplaces, shared hosts. **Before finishing any change to this repository, run the
`update-scam-catalogue` skill** (`.claude/skills/update-scam-catalogue/SKILL.md`; other
agents follow the same file by hand). It reviews current public scam reporting, adds what
is missing with tests in all four languages, and records the review in
`catalogue/last-review.json`. `node tools/catalogue-report.js` shows the state and flags a
review older than 30 days; `npm test` prints a warning in that case.

## 3. General

- Run `npm test` before committing. Add or adjust unit tests in `test/` for every change
  to `src/lib/`.
- Pure logic lives in `src/lib/` with the UMD wrapper so it runs in the service worker,
  content scripts and Node tests without a build step. Do not introduce bundlers or
  runtime dependencies.
- Phrase and chat-scheme patterns are written without accents (text is
  diacritic-stripped before matching) and must be added for all four languages
  (en, pt, es, fr) when a category is added or changed.
- Never load remote code; the store declaration says the extension has none.
- Do not put model identifiers or tool names in commit messages, code comments or
  store text.
