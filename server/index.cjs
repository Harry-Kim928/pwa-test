// QANDA 튜터 PWA - 교재 검색 백엔드
// BookSearch_ref/server/index.js에서 핵심 검색 로직만 추출/단순화

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { classifyPublisher } = require('./publisherRules.cjs')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 요청 로깅 (간단)
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`${res.statusCode} ${req.method} ${req.url} ${ms}ms`)
  })
  next()
})

// ------------------------------------------------------------------
// 유틸
// ------------------------------------------------------------------
const removeHtmlTags = (str) =>
  (str || '').replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')

const BOOK_CONTRACT_SHEET_ID = '1T-E3iAEySTldYwc0G8-xO-R73322WiMxj1AkxjeeyQw'

// Book_Contract 시트(공개)에서 ISBN으로 계약 상태 조회
//  → ALLOWED / DENIED / EXPIRED / null
async function searchInBookContract(isbn) {
  try {
    const csvUrl =
      `https://docs.google.com/spreadsheets/d/${BOOK_CONTRACT_SHEET_ID}` +
      `/gviz/tq?tqx=out:csv&sheet=bookcontract&range=A:H`

    const res = await fetch(csvUrl)
    if (!res.ok) {
      console.error(`Google Sheets HTTP ${res.status}`)
      return null
    }
    const csv = await res.text()
    const rows = csv.split('\n').map(r => r.split(',').map(c => c.replace(/"/g, '').trim()))
    if (rows.length <= 1) return null

    const dataRows = rows.slice(1)
    for (const row of dataRows) {
      const contractISBN = row[3] || '' // D열
      const relatedISBN = row[4] || ''  // E열
      const status = row[7] || ''       // H열
      if (contractISBN === isbn || relatedISBN === isbn) return status
    }
    return null
  } catch (err) {
    console.error('Book_Contract 조회 오류:', err.message)
    return null
  }
}

// ------------------------------------------------------------------
// /api/naver-book-search?query=...
// ------------------------------------------------------------------
app.get('/api/naver-book-search', async (req, res) => {
  try {
    const raw = (req.query.query || '').toString().trim()
    if (!raw) {
      return res.status(400).json({ success: false, error: '검색어를 입력해주세요.' })
    }
    if (raw.length < 2) {
      return res.status(400).json({ success: false, error: '검색어는 2글자 이상 입력해주세요.' })
    }

    const CLIENT_ID = process.env.NAVER_CLIENT_ID
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: '네이버 API 키가 설정되지 않았습니다. (.env에 NAVER_CLIENT_ID/SECRET 설정)',
      })
    }

    const url =
      `https://openapi.naver.com/v1/search/book.json` +
      `?query=${encodeURIComponent(raw)}&display=10&sort=sim`
    const naverRes = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET,
      },
    })
    if (!naverRes.ok) {
      throw new Error(`네이버 API ${naverRes.status}`)
    }
    const data = await naverRes.json()

    if (!data.items || data.items.length === 0) {
      return res.json({
        success: true,
        query: raw,
        totalResults: 0,
        results: [],
        message: '검색 결과가 없습니다.',
      })
    }

    const processed = await Promise.all(
      data.items.map(async (item) => {
        const book = {
          title: removeHtmlTags(item.title || ''),
          author: removeHtmlTags(item.author || '').split(',')[0].trim(),
          publisher: removeHtmlTags(item.publisher || ''),
          pubdate: removeHtmlTags(item.pubdate || ''),
          isbn: removeHtmlTags(item.isbn || ''),
          price: removeHtmlTags(item.price || ''),
          image: item.image || '',
        }

        const type = classifyPublisher(book.publisher)

        if (type === 'restricted') {
          return {
            ...book,
            publisherType: 'restricted',
            status: 'restricted',
            message: '사용 불가',
          }
        }

        if (type === 'contract-check') {
          const contractStatus = await searchInBookContract(book.isbn)
          if (contractStatus === 'ALLOWED') {
            return {
              ...book,
              publisherType: 'contract-check',
              contractStatus,
              status: 'allowed',
              message: '사용 가능',
            }
          }
          if (contractStatus === 'DENIED' || contractStatus === 'EXPIRED') {
            return {
              ...book,
              publisherType: 'contract-check',
              contractStatus,
              status: 'restricted',
              message: '사용 불가',
            }
          }
          return {
            ...book,
            publisherType: 'contract-check',
            contractStatus: 'NOT_FOUND',
            status: 'contract-needed',
            message: '계약 확인 필요, 고객센터로 문의해주세요.',
          }
        }

        if (type === 'allowed') {
          return {
            ...book,
            publisherType: 'allowed',
            status: 'allowed',
            message: '사용 가능',
          }
        }

        return {
          ...book,
          publisherType: 'not-allowed',
          status: 'not-allowed',
          message: '등록 가능한 출판사가 아닙니다.',
        }
      }),
    )

    // not-allowed는 클라이언트로 내려보내지 않음 (기존 동일)
    const results = processed.filter(b => b.status !== 'not-allowed')

    res.json({
      success: true,
      query: raw,
      totalResults: data.total,
      results,
      filteredCount: processed.length - results.length,
    })
  } catch (err) {
    console.error('검색 오류:', err)
    res.status(500).json({ success: false, error: '검색 중 오류가 발생했습니다.' })
  }
})

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    naverConfigured: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
  })
})

app.listen(PORT, () => {
  console.log(`✅ API server: http://localhost:${PORT}`)
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    console.warn('⚠️ NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 .env에 없습니다. 검색 호출 시 500 반환됩니다.')
  }
})
