import { useNavigate } from 'react-router-dom'
import PushOptIn from '../components/PushOptIn'
import TopBar from '../components/TopBar'
import { useTutor } from '../hooks/useTutor'

type MenuKey =
  | 'notice'
  | 'guide'
  | 'penalty'
  | 'terms'
  | 'status'
  | 'search'
  | 'faq'
  | 'reference'

const MENU: { key: MenuKey; label: string; to?: string }[] = [
  { key: 'notice', label: '공지사항' },
  { key: 'guide', label: '가이드북' },
  { key: 'penalty', label: '페널티' },
  { key: 'terms', label: '이용약관' },
  { key: 'status', label: '학적변경' },
  { key: 'search', label: '교재검색', to: '/search' },
  { key: 'faq', label: 'FAQ' },
  { key: 'reference', label: '참고자료' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { tutor, loading } = useTutor()

  const name = tutor?.name ?? (loading ? '' : '튜터')
  const affiliation = [tutor?.university, tutor?.major].filter(Boolean).join(' ')

  return (
    <div className="min-h-full pb-16">
      <TopBar title="마이페이지" />

      <section className="px-4 pt-2">
        <div className="bg-qanda-orange rounded-lg text-white text-center py-5">
          <div className="text-lg font-bold min-h-[1.5rem]">{name}</div>
          <div className="mt-1 text-xs opacity-90 min-h-[1rem]">
            {affiliation || (loading ? '' : '소속 정보 없음')}
          </div>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 bg-white text-gray-900 text-[11px] font-medium rounded-full px-3 py-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            내 정보
          </button>
        </div>
      </section>

      <section className="px-4 mt-5">
        <PushOptIn />
      </section>

      <section className="px-4 mt-8">
        <div className="grid grid-cols-4 gap-y-10 gap-x-2 text-center">
          {MENU.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => item.to && navigate(item.to)}
              className="text-[13px] text-gray-900 active:opacity-60"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}
