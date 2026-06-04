// Generates PWA icons matching the QANDA logo (black ring + orange dot).
// Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'
import zlib from 'node:zlib'

function blend(buf, off, color) {
  const a = color[3] / 255
  const inv = 1 - a
  buf[off]     = Math.round(buf[off]     * inv + color[0] * a)
  buf[off + 1] = Math.round(buf[off + 1] * inv + color[1] * a)
  buf[off + 2] = Math.round(buf[off + 2] * inv + color[2] * a)
  buf[off + 3] = Math.min(255, buf[off + 3] + Math.round(color[3] * inv))
}

function drawCircle(buf, w, cx, cy, r, color) {
  const minX = Math.max(0, Math.floor(cx - r - 1))
  const maxX = Math.min(w - 1, Math.ceil(cx + r + 1))
  const minY = Math.max(0, Math.floor(cy - r - 1))
  const maxY = Math.min(w - 1, Math.ceil(cy + r + 1))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      const edge = r - d
      let alpha
      if (edge >= 0.5) alpha = 1
      else if (edge > -0.5) alpha = edge + 0.5
      else continue
      const off = (y * w + x) * 4
      blend(buf, off, [color[0], color[1], color[2], Math.round(color[3] * alpha)])
    }
  }
}

function fill(buf, color) {
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = color[0]
    buf[i + 1] = color[1]
    buf[i + 2] = color[2]
    buf[i + 3] = color[3]
  }
}

function renderLogo(size, bg) {
  const buf = Buffer.alloc(size * size * 4)
  if (bg) fill(buf, bg)
  const s = size / 100
  drawCircle(buf, size, 49 * s, 49 * s, 36 * s, [0, 0, 0, 255])
  drawCircle(buf, size, 49 * s, 49 * s, 13 * s, [255, 255, 255, 255])
  drawCircle(buf, size, 74 * s, 74 * s, 13 * s, [0xff, 0x6b, 0x1a, 255])
  return buf
}

function makePng(size, rgba) {
  const w = size, h = size
  const stride = w * 4
  const raw = Buffer.alloc(h * (stride + 1))
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
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
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

mkdirSync('public', { recursive: true })
const WHITE = [255, 255, 255, 255]
writeFileSync('public/pwa-192x192.png', makePng(192, renderLogo(192, WHITE)))
writeFileSync('public/pwa-512x512.png', makePng(512, renderLogo(512, WHITE)))
writeFileSync('public/apple-touch-icon.png', makePng(180, renderLogo(180, WHITE)))
console.log('icons generated')
