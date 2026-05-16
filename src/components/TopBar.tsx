import { useNavigate } from 'react-router-dom'

type Props = {
  title?: string
  showSearch?: boolean
  showBack?: boolean
}

function QandaLogo() {
  return (
    <div className="flex items-center select-none" aria-label="QANDA">
      <span className="relative inline-flex items-center justify-center w-5 h-5 mr-0.5">
        <span className="absolute inset-0 rounded-full border-[3px] border-black" />
        <span className="absolute right-[-1px] bottom-[-1px] w-2 h-2 rounded-full bg-qanda-orange" />
      </span>
      <span className="font-extrabold tracking-tight text-[18px] text-black">ANDA</span>
    </div>
  )
}

export default function TopBar({ title, showSearch = true, showBack = false }: Props) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="relative flex items-center justify-center h-14 px-4">
        <div className="absolute left-4">
          <QandaLogo />
        </div>
        {title && <h1 className="text-base font-semibold text-gray-900">{title}</h1>}
        {showSearch && (
          <button
            type="button"
            aria-label="검색"
            onClick={() => navigate('/search')}
            className="absolute right-3 p-2"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        )}
      </div>
      {showBack && (
        <div className="px-3 pb-1">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </header>
  )
}
