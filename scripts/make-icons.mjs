// Generates simple solid PWA icons. Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import zlib from 'node:zlib'

// Minimal PNG writer (RGBA, no compression filter optimization needed)
function makePng(size, rgba) {
  const w = size, h = size
  const stride = w * 4
  const raw = Buffer.alloc(h * (stride + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0 // filter: None
    for (let x = 0; x < w; x++) {
      const off = y * (stride + 1) + 1 + x * 4
      raw[off] = rgba[0]
      raw[off + 1] = rgba[1]
      raw[off + 2] = rgba[2]
      raw[off + 3] = rgba[3]
    }
  }
  const idat = zlib.deflateSync(raw)

  const crc = (buf) => {
    let c = ~0
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i]
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return ~c >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
    const t = Buffer.from(type, 'ascii')
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data])), 0)
    return Buffer.concat([len, t, data, c])
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

mkdirSync('public', { recursive: true })
const orange = [0xff, 0x6b, 0x1a, 0xff]
writeFileSync('public/pwa-192x192.png', makePng(192, orange))
writeFileSync('public/pwa-512x512.png', makePng(512, orange))
writeFileSync('public/apple-touch-icon.png', makePng(180, orange))
console.log('icons generated')
