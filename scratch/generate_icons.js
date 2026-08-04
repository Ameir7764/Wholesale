const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a valid PNG file with specified width, height, and color gradient
function createPngBuffer(width, height) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6 (RGBA)
  ihdr.writeUInt8(0, 10); // compression 0
  ihdr.writeUInt8(0, 11); // filter 0
  ihdr.writeUInt8(0, 12); // interlace 0

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data: height rows, each row starts with filter byte 0, followed by width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;
  const innerRadius = width * 0.25;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Dark Amber / Indigo Navy (#0b0f19)
      let r = 11;
      let g = 15;
      let b = 25;
      let a = 255;

      // Rounded square mask / Outer Circle
      if (dist <= radius) {
        // Gradient from Amber-500 (#f59e0b) to Amber-600 (#d97706)
        const t = (x + y) / (width + height);
        r = Math.round(245 * (1 - t) + 217 * t);
        g = Math.round(158 * (1 - t) + 119 * t);
        b = Math.round(11 * (1 - t) + 6 * t);

        // Inner icon motif: Wholesale Store roof (triangle + box)
        // Triangle top
        const ty = (y - (cy - radius * 0.4)) / (radius * 0.7);
        const tx = Math.abs(dx) / (radius * 0.5);

        if (ty >= 0 && ty <= 0.5 && tx <= (0.5 - ty * 0.8)) {
          // Dark Navy icon element inside amber circle
          r = 11; g = 15; b = 25;
        } else if (ty > 0.5 && ty <= 0.85 && tx <= 0.4) {
          r = 11; g = 15; b = 25;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);

  const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcBuf);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// CRC32 calculation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    let code = (crc ^ byte) & 0xff;
    for (let j = 0; j < 8; j++) {
      code = code & 1 ? 0xedb88320 ^ (code >>> 1) : code >>> 1;
    }
    crc = (crc >>> 8) ^ code;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPngBuffer(192, 192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPngBuffer(512, 512));
console.log('PNG icons created successfully in public directory!');
