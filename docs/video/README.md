# Launch videos

Two 25-second videos for people who are not technical: what Scam Detector does, and that it
is a second pair of eyes, not a guarantee.

| Language | Video | Poster |
| --- | --- | --- |
| English | [scam-detector-en.mp4](scam-detector-en.mp4) · [GIF for the README](scam-detector-en.gif) | [scam-detector-en.jpg](scam-detector-en.jpg) |
| Português (Portugal) | [scam-detector-pt.mp4](scam-detector-pt.mp4) | [scam-detector-pt.jpg](scam-detector-pt.jpg) |

Both are 1920×1080, 30 fps, 24.6 s, H.264 + AAC. Frame 0 is the poster, so it is also the
thumbnail on any site that grabs the first frame.

## Story

1. A text message arrives: the PayPal "account limited" lure (EN) or the CTT "parcel held,
   pay €1,99" lure (PT). *Looks real, doesn't it?*
2. The link opens. The red banner slides down, the toolbar shield turns red, "Why?" shows the
   reasons in plain words, and the cursor clicks "Leave this site".
3. A marketplace chat: "I'm abroad, my courier will collect it, click the link to receive the
   payment". The chat banner explains the scheme.
4. Honesty: *It will miss some scams. No warning does not mean a site is safe. Stay alert.*
5. Logo, "A second pair of eyes in your browser", and the Chrome Web Store.

Every product string on screen (banner titles, reasons, buttons, chat warning, the caution
text) is copied from `_locales/en` and `_locales/pt` with "Non-tech terms" wording. The fake
domains and messages are the same ones the repository's own screenshots use.

## Share copy

**English**

> That "your account has been limited" text looks real. Scam Detector warns you in plain
> words before a fake site gets your password or card, and it reads marketplace chats too.
> It won't catch every scam, so stay alert. Free on the Chrome Web Store:
> https://chromewebstore.google.com/detail/scam-detector/lgppgajjfgffahljkkgcnjjelnbgjaod

**Português**

> Aquela mensagem dos CTT a pedir €1,99 parece verdadeira. O Scam Detector avisa-o, em
> palavras simples, antes de um site falso ficar com a sua palavra-passe ou o seu cartão, e
> também lê as conversas em sites de vendas. Não apanha todas as burlas, por isso mantenha-se
> atento. Grátis na Chrome Web Store:
> https://chromewebstore.google.com/detail/scam-detector/lgppgajjfgffahljkkgcnjjelnbgjaod

## Re-rendering

The source is in [`source/`](source/). Re-render it when the banner, the strings or the store
details change. `index.html` draws every frame as a pure function of time
(`render(t)`, `?lang=en|pt`). `synth.py` writes the soundtrack (100 BPM, D major), and every
cut and sound sits on the same beat grid. `render.js` drives Chromium with Playwright and
pipes the frames to ffmpeg.

```bash
cd docs/video/source
python3 synth.py music.wav
ffmpeg -i music.wav -af loudnorm=I=-16:TP=-1.5:LRA=9 -ar 48000 music16.wav
node render.js en video ../scam-detector-en.mp4 music16.wav
node render.js pt video ../scam-detector-pt.mp4 music16.wav
STILLS=stills node render.js en stills 3.7,8.85,14.5,20.5,23.5   # quick visual check
```

Then pull the poster frame (`ffmpeg -ss 8.85 -i <video> -frames:v 1 -q:v 2 <poster>.jpg`) and
overlay it on frame 0. The README shows a silent GIF of the English video so it plays on its own:

```bash
ffmpeg -i ../scam-detector-en.mp4 -vf "fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 ../scam-detector-en.gif
```

Requires Node with Playwright (a dev dependency), Python 3 with numpy,
and ffmpeg. The music and sound effects are synthesised by `synth.py`, so there are no
third-party audio licences. The videos were planned with the
[`/brag`](https://github.com/latent-spaces/brag) skill.
