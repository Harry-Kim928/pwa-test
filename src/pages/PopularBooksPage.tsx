import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar'

type Level = '중등' | '고등'

const CATEGORIES = [
  { key: 'self', label: '자습서' },
  { key: 'eval', label: '평가문제집' },
  { key: 'vocab', label: '단어장' },
  { key: 'type', label: '유형서' },
  { key: 'past', label: '기출문제집' },
  { key: 'mock', label: '모의고사' },
] as const

const SUBJECTS = ['국어', '수학', '영어', '사회', '과학'] as const
const GRADES = ['1학년', '2학년', '3학년'] as const

type DummyBook = {
  title: string
  publisher: string
  isbn: string
}

// 더미 데이터 — DB 연결 전까지 선택에 따라 살짝씩 다른 책 10개 노출
function makeDummyBooks(category: string, level: Level, subject: string, grade: string): DummyBook[] {
  const levelLabel = level === '중등' ? '중학교' : '고등학교'
  const gradeNo = grade.charAt(0)
  const tag = category

  return [
    { title: `${levelLabel} ${subject} ${tag} (강옥기)`, publisher: '동아출판', isbn: '9789872387672' },
    { title: `미래엔 교과서 ${level} ${subject}${gradeNo} ${tag}`, publisher: '미래엔', isbn: '9789872387673' },
    { title: `${levelLabel} ${subject} ${gradeNo} (황선옥)`, publisher: '미래에듀', isbn: '9789872387674' },
    { title: `${levelLabel} ${subject} ${gradeNo} ${tag} 장경윤 교과서편`, publisher: '지학사', isbn: '9789872387675' },
    { title: `${levelLabel} ${tag} ${subject} ${gradeNo} (김동재)`, publisher: '천재교과서', isbn: '9789872387676' },
    { title: `${level === '중등' ? '중학' : '고등'} ${subject} ${gradeNo} ${tag} (류재진)`, publisher: '비유와상징', isbn: '9789872387677' },
    { title: `개념원리 ${level} ${subject} ${tag}`, publisher: '개념원리', isbn: '9789872387678' },
    { title: `${tag} ${level} ${subject} ${grade} 완성`, publisher: '좋은책신사고', isbn: '9789872387679' },
    { title: `${level} ${subject} ${gradeNo}학년 ${tag} 베스트`, publisher: '천재교육', isbn: '9789872387680' },
    { title: `${level} ${subject} ${tag} 종합편`, publisher: '동아출판', isbn: '9789872387681' },
  ]
}

export default function PopularBooksPage() {
  const [params, setParams] = useSearchParams()
  const categoryKey = params.get('cat') || CATEGORIES[0].key
  const category =
    CATEGORIES.find(c => c.key === categoryKey) ?? CATEGORIES[0]

  const [sel, setSel] = useState<{ level: Level; subject: string; grade: string }>({
    level: '중등',
    subject: '수학',
    grade: '1학년',
  })

  // picker 슬라이드 상태
  const [pickerOpen, setPickerOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const openNow = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setPickerOpen(true)
  }
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setPickerOpen(false)
      closeTimer.current = null
    }, 180) as unknown as number
  }
  const closeNow = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setPickerOpen(false)
  }

  const books = useMemo(
    () => makeDummyBooks(category.label, sel.level, sel.subject, sel.grade),
    [category.label, sel.level, sel.subject, sel.grade],
  )

  const breadcrumb = `${category.label}, ${sel.level} ${sel.subject}, ${sel.grade} 인기 교재 ${books.length}건`

  const handleNaver = (title: string) => {
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(title)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-full pb-20 bg-white">
      <TopBar showSearch={false} showBack />

      <section className="px-4 pt-1">
        <h1 className="text-xl font-bold text-qanda-orange">{category.label} 인기 교재</h1>
        <p className="mt-2 text-[12px] text-gray-500">
          콴다과외에서 가장 많이 사용된 교재는 무엇일까요?
        </p>
      </section>

      <div className="relative mt-4 grid grid-cols-[76px_1fr] border-t border-gray-200 min-h-[460px]">
        {/* ── 카테고리 (상시) ────────────────────────────── */}
        <aside
          className="relative z-30 border-r border-gray-200 py-1 bg-white"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          {CATEGORIES.map(c => {
            const active = c.key === categoryKey
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setParams({ cat: c.key })}
                className={`w-full flex items-center justify-between px-2 py-3 text-[12px] ${
                  active ? 'text-qanda-orange font-semibold' : 'text-gray-700'
                }`}
              >
                <span className="truncate">{c.label}</span>
                <span className={`text-[10px] ${active ? 'text-qanda-orange' : 'text-gray-300'}`}>›</span>
              </button>
            )
          })}
        </aside>

        {/* ── 책 리스트 (본문) ────────────────────────────── */}
        <section className="py-2 pl-3 pr-3 min-w-0">
          {/* breadcrumb 칩 — 탭하면 picker 토글 (모바일 진입점) */}
          <button
            type="button"
            onClick={() => (pickerOpen ? closeNow() : openNow())}
            aria-expanded={pickerOpen}
            className="w-full flex items-center justify-between text-[11px] text-qanda-orange font-medium border-b border-qanda-orange/40 pb-2 active:opacity-70"
          >
            <span className="text-left">{breadcrumb}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`flex-shrink-0 ml-2 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <ul className="mt-2 divide-y divide-gray-100">
            {books.map((b, i) => (
              <li key={`${b.isbn}-${i}`} className="py-3">
                <div className="flex gap-2.5">
                  <div className="relative flex-shrink-0 w-14 h-[76px] rounded bg-gray-200">
                    <span className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center rounded-full bg-qanda-orange text-white text-[10px] font-bold shadow">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-900 leading-snug line-clamp-2">
                      {b.title}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 truncate">{b.publisher}</div>
                    <div className="text-[11px] text-gray-400 truncate">{b.isbn}</div>
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => handleNaver(b.title)}
                        className="text-[11px] border border-qanda-orange text-qanda-orange rounded px-2 py-0.5 active:bg-orange-50"
                      >
                        네이버 바로가기
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── backdrop (picker 열려있을 때 책 영역 가림) ─── */}
        {pickerOpen && (
          <button
            type="button"
            onClick={closeNow}
            aria-label="필터 닫기"
            className="absolute top-0 bottom-0 left-[76px] right-0 z-10 bg-black/10"
          />
        )}

        {/* ── 가운데 picker (오버레이, 슬라이드) ─────────── */}
        <aside
          aria-hidden={!pickerOpen}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          className={[
            'absolute top-0 bottom-0 left-[76px] w-[180px] z-20',
            'bg-white border-r border-gray-200 shadow-[8px_0_20px_-12px_rgba(0,0,0,0.15)]',
            'transition-transform duration-200 will-change-transform',
            pickerOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
          ].join(' ')}
        >
          <div className="py-2 text-[12px] overflow-y-auto h-full">
            {(['중등', '고등'] as Level[]).map(lv => (
              <div key={lv} className="px-2 mb-3">
                <div className="px-1 pb-1.5 mb-1 border-b border-gray-300 text-gray-900 font-medium">
                  {lv}
                </div>
                {SUBJECTS.map(s => {
                  const isCurrentSubject = sel.level === lv && sel.subject === s
                  return (
                    <div key={s}>
                      <button
                        type="button"
                        onClick={() =>
                          setSel(prev => ({
                            level: lv,
                            subject: s,
                            grade:
                              prev.level === lv && prev.subject === s ? prev.grade : '1학년',
                          }))
                        }
                        className={`w-full text-left px-1 py-1.5 ${
                          isCurrentSubject
                            ? 'text-qanda-orange font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {s}
                      </button>
                      {isCurrentSubject && (
                        <div className="pl-2">
                          {GRADES.map(g => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setSel(prev => ({ ...prev, grade: g }))
                                closeNow()
                              }}
                              className={`block w-full text-left px-1 py-1 text-[11px] ${
                                sel.grade === g
                                  ? 'text-qanda-orange font-semibold'
                                  : 'text-gray-500'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
