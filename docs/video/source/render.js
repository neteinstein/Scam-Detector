// Usage: node render.js <lang> stills <t1,t2,...>   |   node render.js <lang> video <out.mp4> <audio.wav>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const [lang, mode, arg, audio] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?lang=' + lang);
  await page.evaluate(() => window.ready);
  if (mode === 'stills') {
    for (const t of arg.split(',').map(Number)) {
      await page.evaluate((t) => window.render(t), t);
      await page.screenshot({ path: path.join(__dirname, process.env.STILLS || 'stills', `${lang}-${t.toFixed(2)}.png`) });
    }
  } else {
    const fps = 30; const dur = await page.evaluate(() => window.DURATION); const n = Math.round(dur * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-i', audio,
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-tune', 'animation',
      '-c:a', 'aac', '-b:a', '192k', '-t', String(n / fps), '-movflags', '+faststart', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => window.render(t), i / fps);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 90 === 0) console.log(lang, 'frame', i, '/', n);
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  }
  await browser.close();
})();
