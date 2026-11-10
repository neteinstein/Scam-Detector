# Distribution tab

| Setting | Value | Why |
| --- | --- | --- |
| Visibility | **Public** (use *Unlisted* for a soft launch: installable by link, not searchable) | |
| Payments | Free | No in-app purchases or licensing |
| Distribution regions | All regions | Detection covers English, Portuguese, Spanish and French wording; the UI is English |
| Mature content | No | |
| Ads | None | |

## Supported browsers

| Browser | Minimum | Package |
| --- | --- | --- |
| Chrome and Chromium-based browsers (Edge, Brave, Opera, Vivaldi) | Chrome 116 (`minimum_chrome_version`) | `scam-detector-<version>-chrome.zip` |
| Firefox (desktop) | 140 | `scam-detector-<version>-firefox.zip`, see `firefox.md` |
| Firefox for Android | 142 | same Firefox package |

## Suggested rollout

1. Publish as **Unlisted** first and install from the store link on a few machines to confirm the signed package behaves like the unpacked build (service-worker lifecycle, settings sync).
2. Switch to **Public** once satisfied. Later updates can use *Percentage rollout* (Distribution tab) to reach users gradually.
