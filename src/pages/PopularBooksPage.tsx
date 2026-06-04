import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { supabase } from '../lib/supabase'

type Level = '중등' | '고등'
type Subject = '국어' | '수학' | '영어' | '사회' | '과학'

const CATEGORIES = [
  { key: 'self', label: '자습서' },
  { key: 'eval', label: '평가문제집' },
  { key: 'vocab', label: '단어장' },
  { key: 'type', label: '유형서' },
  { key: 'past', label: '기출문제집' },
  { key: 'mock', label: '모의고사' },
] as const

const SUBJECTS: readonly Subject[] = ['국어', '수학', '영어', '사회', '과학']

type Textbook = {
  id: string
  title: string
  publisher: string
  isbn: string
  image_url: string | null
}

export default function PopularBooksPage() {
  const [params, setParams] = useSearchParams()
  const categoryKey = params.get('cat') || CATEGORIES[0].key
  const category = CATEGORIES.find(c => c.key === categoryKey) ?? CATEGORIES[0]

  const [sel, setSel] = useState<{ level: Level; subject: Subject }>({
    level: '중등',
    subject: '수학',
  })

  const [books, setBooks] = useState<Textbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    supabase
      .from('textbooks')
      .select('id, title, publisher, isbn, image_url')
      .eq('level', sel.level)
      .eq('subject', sel.subject)
      .eq('category', category.label)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          setBooks([])
        } else {
          setBooks((data || []) as Textbook[])
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sel.level, sel.subject, category.label])

  const breadcrumb = `${category.label}, ${sel.level} ${sel.subject} 인기 교재 ${books.length}건`

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

        <section className="py-2 pl-3 pr-3 min-w-0">
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

          {loading ? (
            <div className="mt-8 text-center text-[12px] text-gray-400">로딩 중...</div>
          ) : error ? (
            <div className="mt-8 text-center text-[12px] text-rose-600">{error}</div>
          ) : books.length === 0 ? (
            <div className="mt-8 text-center text-[12px] text-gray-400">
              해당 카테고리에 등록된 교재가 없습니다.
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-gray-100">
              {books.map((b) => (
                <li key={b.id} className="py-3">
                  <div className="flex gap-2.5">
                    <div className="relative flex-shrink-0 w-14 h-[76px] rounded bg-gray-200 overflow-hidden">
                      {b.image_url ? (
                        <img
                          src={b.image_url}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
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
          )}
        </section>

        {pickerOpen && (
          <button
            type="button"
            onClick={closeNow}
            aria-label="필터 닫기"
            className="absolute top-0 bottom-0 left-[76px] right-0 z-10 bg-black/10"
          />
        )}

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
                  const isCurrent = sel.level === lv && sel.subject === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSel({ level: lv, subject: s })
                        closeNow()
                      }}
                      className={`w-full text-left px-1 py-1.5 ${
                        isCurrent ? 'text-qanda-orange font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {s}
                    </button>
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
