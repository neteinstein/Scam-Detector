// Builds the Chrome Web Store upload: dist/scam-detector-<version>.zip containing
// only the files the extension needs at runtime. No dependencies.
// Run: node tools/package.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, `scam-detector-${manifest.version}.zip`);

// Everything the manifest references, plus the files those pages load.
const INCLUDE = ['manifest.json', 'src', 'popup', 'options', 'icons'];
const EXCLUDE = /(^|\/)(\.|.*\.map$|.*\.test\.js$)/;

function walk(rel, acc) {
  const abs = path.join(ROOT, rel);
  const st = fs.statSync(abs);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) {
      const r = path.posix.join(rel, name);
      if (!EXCLUDE.test(r)) walk(r, acc);
    }
  } else acc.push(rel);
  return acc;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    let c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function zip(files) {
  const locals = [], centrals = [];
  let offset = 0;
  const { time, date } = dosDateTime(new Date());
  for (const rel of files) {
    const data = fs.readFileSync(path.join(ROOT, rel));
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const name = Buffer.from(rel.replace(/\\/g, '/'), 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(time, 12); central.writeUInt16LE(date, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(body.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, name, body);
    centrals.push(central, name);
    offset += local.length + name.length + body.length;
  }
  const centralStart = offset;
  const centralSize = centrals.reduce((a, b) => a + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(centralStart, 16); end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, ...centrals, end]);
}

const files = INCLUDE.flatMap((p) => walk(p, []));
// Sanity: every file the manifest points at must be in the bundle.
const referenced = [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page, ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap((c) => c.js)];
for (const r of referenced) if (!files.includes(r)) { console.error('manifest references a file that is not packaged: ' + r); process.exit(1); }

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, zip(files));
console.log(`${OUT} (${files.length} files, ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
for (const f of files) console.log('  ' + f);
