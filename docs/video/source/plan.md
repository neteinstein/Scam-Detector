# Brag plan: Scam Detector (EN + PT-PT)

## What it is
A Chrome extension that checks every page on your own computer and shows a plain-words warning
banner before a scam site gets your password, card or money. It also reads marketplace chats.

## Who it's for
People who are not technical: parents, grandparents, anyone who has received the
"your parcel is held / your account is limited" text. Everyone else too: a second pair of eyes.

## Angle
"A second pair of eyes, not a guarantee." Calm, reassuring, honest. Show it catching the scam the
viewer has most likely seen this week. End by saying plainly that it misses some scams, so the
viewer stays alert. Feeling safer, not invincible.

## Hook (0 to 4.2s)
A phone text message slides in: the exact lure the extension's own demo uses.
EN: PayPal "account limited, verify within 24 hours" + paypal-secure-login.com.
PT: CTT "encomenda retida, pague €1,99 para reagendar" + ctt-entregas-reagendar.sbs.
Caption: "Looks real, doesn't it?" / "Parece verdadeiro, não parece?" A finger-tap on the link.

## Highlights
1. The page opens in a browser window; the real red banner slides down and the toolbar shield
   turns red. Reasons appear one by one in the extension's own plain-words strings. Cursor
   clicks "Leave this site".
2. Marketplace chat: the "courier will collect it, click the link to receive the payment"
   message; the chat banner explains the scheme.
3. Honesty beat: green shield, "It will miss some scams. No warning does not mean safe."

## Punchline / outro
Logo + "Scam Detector". "A second pair of eyes in your browser." Free, open source, "Get it free on the Chrome Web Store",
in English, Português, Español and Français.

## Tone
`polished` + freeform "a calm friend looking over your shoulder". Few scenes, long holds,
large type (minimum 34px on a 1080p canvas), soft staggered transitions, no jokes at the
viewer's expense.

## Format
Landscape 1920×1080, 30 fps, 24.6 s. Two renders from one composition: `en` and `pt` (pt-PT).

## Visual identity (from the code)
- Danger banner: `#b71c1c` on `#fdecea`, 4px bottom border, round "!" icon, pill score badge
  (src/content.js).
- Shield icon geometry and state colours: green `#2e7d32`, yellow `#f9a825`, red `#d32f2f`
  (tools/make-icons.js).
- Store-asset gradient `#1a237e → #b71c1c`; welcome caution amber `#b45309`.
- Type: system sans stack, which renders as Inter here.
- All on-screen product strings come from `_locales/{en,pt}/messages.json` (non-tech wording).

## Music
100 BPM (beat 0.6 s), D major, composed for this video: soft pad and warm bass, felt-piano
plucks, very light kick on 1 and 3. Tense B-minor colour for the hook, opens to D major
when the banner protects the user, thins out for the honesty beat, resolves on the logo.
Sound effects are pitched in key and sit under the music.

## Storyboard (cuts on beats, beat k at 0.6·k s)
| # | Scene | Start → end | Content | Sequential |
|---|---|---|---|---|
| 1 | Hook | 0.0 → 4.2 (k0–k7) | phone with SMS, caption, tap | bubble k1, caption k4, tap k6 |
| 2 | Warning | 4.2 → 10.8 (k7–k18) | browser + fake page, banner, shield red, 2 reasons, click "Leave" | banner k9, reasons k12, k14, click k16 |
| 3 | Chat | 10.8 → 16.8 (k18–k28) | marketplace chat bubble, chat banner, 2 reasons | bubble k19, banner k21, reasons k23, k25 |
| 4 | Honest | 16.8 → 21.0 (k28–k35) | green shield, "It will miss some scams." / "No warning does not mean safe." | line 1 k29, line 2 k31 |
| 5 | Outro | 21.0 → 24.6 (k35–k41) | logo, name, line, small facts | name k36, line k37, fade from k40 |

Reading check: every line holds ≥ 0.3 s/word after it settles; reason rows are two beats apart
(1.2 s) and then stay on screen.

## Privacy
The fake domains, prices and chat text come from the repository's own demo pages; no real
user data appears.

## Share copy (draft)
EN: That "your account is limited" text looks real. Scam Detector warns you in plain words
before a fake site gets your password or card. It won't catch everything, so stay alert.
