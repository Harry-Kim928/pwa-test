import { useEffect, useRef, useState, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { searchBooks, type BookResult, type SearchResponse } from '../lib/bookSearch'

type Category = {
  key: string
  label: string
  Icon: () => JSX.Element
}

const stroke = '#111827'

const BookOpen = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H3z" />
    <path d="M21 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z" />
  </svg>
)

const Clipboard = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 3h6v3H9z" />
    <path d="m9 12 2 2 4-4" />
    <path d="M9 17h4" />
  </svg>
)

const Aa = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 16 9 9l2 7" />
    <path d="M7.5 14h3" />
    <path d="M14 16V10h2a2 2 0 0 1 0 4h-2" />
  </svg>
)

const Bookmark = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
)

const Notebook = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M5 7h-2" />
    <path d="M5 12h-2" />
    <path d="M5 17h-2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
)

const Doc = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </svg>
)

const CATEGORIES: Category[] = [
  { key: 'self', label: '자습서', Icon: BookOpen },
  { key: 'eval', label: '평가문제집', Icon: Clipboard },
  { key: 'vocab', label: '단어장', Icon: Aa },
  { key: 'type', label: '유형서', Icon: Bookmark },
  { key: 'past', label: '기출문제집', Icon: Notebook },
  { key: 'mock', label: '모의고사', Icon: Doc },
]

const FAQS = [
  {
    q: '사용하고 싶은 교재가 검색이 안돼요.',
    a: '교재 풀네임이 아닌 교재명+과목명으로 검색해보세요. 예: "라이트쎈 공통수학1"',
  },
  {
    q: '중등 과목을 교습 중인데 고등 교재를 사용할 수 있나요?',
    a: '학년 구분과 사용 가능 여부는 별개입니다. 검색 후 사용 가능으로 표시된 교재라면 사용 가능합니다.',
  },
  {
    q: '사용할 수 없는 출판사가 궁금해요.',
    a: '비상교육, 다락원, 진학사 등은 사용이 불가합니다. 그 외 출판사는 검색 결과의 배지를 확인해주세요.',
  },
  {
    q: '사용하려고 하는 교재가 모두 사용 불가해요.',
    a: '입시 관련 참고서/문제집만 등록이 가능합니다. NCS, 공인중개사, 소설, 자기계발서 등은 사용하실 수 없습니다.',
  },
]

function statusStyle(status: BookResult['status']) {
  switch (status) {
    case 'allowed':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: '사용 가능' }
    case 'contract-needed':
      return { dot: 'bg-amber-500', text: 'text-amber-700', label: '계약 확인 필요' }
    case 'restricted':
      return { dot: 'bg-rose-500', text: 'text-rose-700', label: '사용 불가' }
    default:
      return { dot: 'bg-gray-400', text: 'text-gray-600', label: '확인 필요' }
  }
}

export default function TextbookSearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [results, setResults] = useState<BookResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const runSearch = async (q: string) => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)
    try {
      const data: SearchResponse = await searchBooks(q, ctrl.signal)
      if (data.success) {
        const filtered = (data.results || []).filter(b => b.status !== 'not-allowed')
        setResults(filtered)
      } else {
        setError(data.error || '검색 중 오류가 발생했습니다.')
        setResults([])
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('네트워크 오류가 발생했습니다.')
        setResults([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      setResults(null)
      setError(null)
      setLoading(false)
      return
    }
    if (trimmed.length < 2) {
      setResults(null)
      setError(null)
      return
    }
    setLoading(true)
    debounceRef.current = window.setTimeout(() => {
      runSearch(trimmed)
    }, 600)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => () => abortRef.current?.abort(), [])

  const showResults = query.trim().length >= 2
  const trimmed = query.trim()

  return (
    <div className="min-h-full pb-24">
      <TopBar showSearch={false} />

      <section className="px-5 pt-2">
        <h2 className="text-xl font-bold leading-snug text-gray-900">
          사용하고 싶은
          <br />
          교재명을 입력하세요.
        </h2>
        <p className="mt-3 text-[12px] text-gray-400">
          ISBN(13자리 코드)를 입력하시면 더욱 정확한 검색이 가능합니다.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const t = query.trim()
            if (t.length >= 2) runSearch(t)
          }}
          className="mt-6 relative"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="교재명 또는 ISBN"
            className="w-full bg-transparent border-b-2 border-qanda-orange py-2 pr-9 text-sm text-gray-900 outline-none placeholder:text-gray-300"
            enterKeyHint="search"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
        </form>
      </section>

      {showResults && (
        <section className="px-5 mt-6">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border-b border-amber-100 rounded-t-xl">
              <span aria-hidden>⚠️</span>
              <p className="text-[11px] leading-relaxed text-amber-900">
                <span className="font-semibold">주의!</span> 입시 관련 참고서/문제집만 등록 가능합니다. NCS, 공인중개사, 소설, 자기계발서 등은 사용할 수 없습니다.
              </p>
            </div>

            {loading ? (
              <div className="p-6 text-center text-[13px] text-gray-500">검색 중...</div>
            ) : error ? (
              <div className="p-6 text-center text-[13px] text-rose-600">{error}</div>
            ) : results && results.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-[13px] font-semibold text-gray-900">검색 결과가 없습니다</div>
                <div className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                  교재 풀네임이 아닌 <span className="font-semibold">교재명+과목명</span>으로 검색해보세요.
                  <br />
                  <span className="text-gray-400">예) 라이트쎈 공통수학1</span>
                </div>
              </div>
            ) : results && results.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-500">
                  <span>검색 결과</span>
                  <span>{results.length}개</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {results.map((book, i) => {
                    const s = statusStyle(book.status)
                    const isAvailable = book.status === 'allowed'
                    const naverUrl = isAvailable
                      ? `https://search.naver.com/search.naver?query=${encodeURIComponent(book.title)}`
                      : null
                    return (
                      <li key={`${book.isbn}-${i}`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (naverUrl) window.open(naverUrl, '_blank', 'noopener,noreferrer')
                          }}
                          disabled={!isAvailable}
                          className="w-full text-left flex gap-3 p-3 active:bg-gray-50 disabled:cursor-default"
                        >
                          <div className="flex-shrink-0 w-14 h-[76px] rounded-md overflow-hidden bg-gray-100">
                            {book.image ? (
                              <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-gray-900 leading-snug line-clamp-2">
                              {book.title}
                            </div>
                            <div className="mt-1 text-[11px] text-gray-500 truncate">
                              {book.author || '저자 정보 없음'} · {book.publisher}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate">ISBN: {book.isbn || '정보 없음'}</div>
                            <div className="mt-2 inline-flex items-center gap-1">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              <span className={`text-[11px] font-medium ${s.text}`}>{book.message}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : trimmed.length < 2 ? (
              <div className="p-6 text-center text-[12px] text-gray-400">2글자 이상 입력해주세요.</div>
            ) : null}
          </div>
        </section>
      )}

      <section className="px-5 mt-10">
        <h3 className="text-[15px] font-bold text-gray-900">인기 교재 카테고리</h3>
        <div className="mt-4 grid grid-cols-3 gap-y-6">
          {CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(`/popular?cat=${key}`)}
              className="flex flex-col items-center gap-2 active:opacity-60"
            >
              <Icon />
              <span className="text-[12px] text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 mt-10">
        <h3 className="text-[15px] font-bold text-gray-900">교재 FAQ</h3>
        <ul className="mt-3 divide-y divide-gray-200 border-t border-gray-200">
          {FAQS.map((item, i) => (
            <li key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left"
                aria-expanded={openIdx === i}
              >
                <span className="text-[12px] text-gray-800 pr-3">Q. {item.q}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="pb-3 pr-6 text-[12px] leading-relaxed text-gray-600">
                  A. {item.a}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
