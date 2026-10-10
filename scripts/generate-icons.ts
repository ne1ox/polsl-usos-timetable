// Dependency-free rasterization of our code-native icon, including a maskable safe area.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = value >>> 1 ^ (value & 1 ? 0xedb88320 : 0); }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(name: string, data: Buffer) {
  const type = Buffer.from(name); const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const check = Buffer.alloc(4); check.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([size, type, data, check]);
}
function roundRect(x: number, y: number, left: number, top: number, width: number, radius: number) {
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius));
  const dy = Math.max(top + radius - y, 0, y - (top + width - radius));
  return x >= left && x <= left + width && y >= top && y <= top + width && dx * dx + dy * dy <= radius * radius;
}
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable.png', 512], ['apple-touch-icon.png', 180]] as const) {
  const scanlines = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const color = [0, 0, 0];
    for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
      const px = (x + (sx + .5) / 3) * 512 / size; const py = (y + (sy + .5) / 3) * 512 / size;
      const white = [[124, 124], [276, 124], [124, 276]].some(([left, top]) => roundRect(px, py, left!, top!, 112, 24));
      const green = (px - 332) ** 2 + (py - 332) ** 2 <= 56 ** 2;
      const sample = white ? [255, 255, 255] : green ? [198, 223, 158] : [36, 92, 71];
      for (let c = 0; c < 3; c++) color[c]! += sample[c]! / 9;
    }
    for (let c = 0; c < 3; c++) scanlines[y * (size * 3 + 1) + 1 + x * 3 + c] = Math.round(color[c]!);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  writeFileSync(new URL(`../public/${name}`, import.meta.url), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0)),
  ]));
}
