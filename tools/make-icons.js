// Generates the toolbar icons (a shield with an exclamation mark) as PNGs
// without any dependencies. Run: node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Shield shape in unit coordinates (0..1), supersampled for anti-aliasing.
function inShield(u, v) {
  if (v < 0.08 || u < 0.1 || u > 0.9) return false;
  if (v < 0.55) return true;
  // lower part: pointed bottom
  const t = (v - 0.55) / 0.42; // 0..1
  const half = 0.4 * (1 - t * t);
  return Math.abs(u - 0.5) <= half && v <= 0.97;
}
function inMark(u, v) {
  const x = Math.abs(u - 0.5);
  if (x < 0.075 && v > 0.26 && v < 0.6) return true;          // bar
  const dx = u - 0.5, dy = v - 0.73;
  return dx * dx + dy * dy < 0.0075;                            // dot
}
function pixelFactory(size) {
  const SS = 4;
  return (px, py) => {
    let shield = 0, mark = 0;
    for (let i = 0; i < SS; i++) for (let j = 0; j < SS; j++) {
      const u = (px - 0.5 + (i + 0.5) / SS) / size, v = (py - 0.5 + (j + 0.5) / SS) / size;
      if (inShield(u, v)) { shield++; if (inMark(u, v)) mark++; }
    }
    const a = shield / (SS * SS), m = mark / (SS * SS);
    const base = [211, 47, 47];      // red shield
    const r = Math.round(base[0] * (1 - m) + 255 * m), g = Math.round(base[1] * (1 - m) + 255 * m), b = Math.round(base[2] * (1 - m) + 255 * m);
    return [r, g, b, Math.round(a * 255)];
  };
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const size of [16, 32, 48, 128]) fs.writeFileSync(path.join(out, `icon${size}.png`), png(size, pixelFactory(size)));
console.log('icons written to', out);
