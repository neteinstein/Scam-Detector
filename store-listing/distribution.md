# Distribution tab

| Setting | Value | Why |
| --- | --- | --- |
| Visibility | **Public** (use *Unlisted* for a soft launch: installable by link, not searchable) | |
| Payments | Free | No in-app purchases or licensing |
| Distribution regions | All regions | Detection covers English, Portuguese, Spanish and French wording; the UI is English |
| Mature content | No | |
| Ads | None | |

## Suggested rollout

1. Publish as **Unlisted** first and install from the store link on a few machines to confirm the signed package behaves like the unpacked build (service-worker lifecycle, settings sync).
2. Switch to **Public** once satisfied. Later updates can use *Percentage rollout* (Distribution tab) to reach users gradually.
