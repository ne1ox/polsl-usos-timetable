// Rasterize the same compact shapes as public/icon.svg, with a maskable safe area.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

type Color = [number, number, number];
const BACKGROUND: Color = [21, 76, 142];
const WHITE: Color = [255, 255, 255];
const ACCENT: Color = [170, 202, 240];
const SQUARES = [
  [138, 138],
  [282, 138],
  [138, 282],
] as const;

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(name: string, data: Buffer) {
  const type = Buffer.from(name);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([size, type, data, check]);
}

function inSquare(x: number, y: number, left: number, top: number) {
  const width = 92;
  const radius = 20;
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius));
  const dy = Math.max(top + radius - y, 0, y - (top + width - radius));
  return (
    x >= left &&
    x <= left + width &&
    y >= top &&
    y <= top + width &&
    dx * dx + dy * dy <= radius * radius
  );
}

function sampleColor(x: number, y: number): Color {
  if (SQUARES.some(([left, top]) => inSquare(x, y, left, top))) {
    return WHITE;
  }
  if ((x - 328) ** 2 + (y - 328) ** 2 <= 46 ** 2) {
    return ACCENT;
  }
  return BACKGROUND;
}

function pixelColor(x: number, y: number, size: number): Color {
  const color: Color = [0, 0, 0];
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 3; sx++) {
      const px = ((x + (sx + 0.5) / 3) * 512) / size;
      const py = ((y + (sy + 0.5) / 3) * 512) / size;
      sampleColor(px, py).forEach((channel, index) => {
        color[index]! += channel / 9;
      });
    }
  }
  return color;
}

function rasterize(size: number) {
  const scanlines = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pixelColor(x, y, size).forEach((channel, index) => {
        scanlines[y * (size * 3 + 1) + 1 + x * 3 + index] = Math.round(channel);
      });
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(scanlines)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable.png', 512],
  ['apple-touch-icon.png', 180],
] as const) {
  writeFileSync(new URL('../public/' + name, import.meta.url), rasterize(size));
}
