import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'

type IconProps = { active: boolean }

const MegaphoneIcon = ({ active }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
    <path d="M14 7s2 1.5 2 5-2 5-2 5" />
    <path d="M17 4s4 3 4 8-4 8-4 8" />
  </svg>
)

const HandIcon = ({ active }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 11V6a1.5 1.5 0 0 1 3 0v5" />
    <path d="M10 11V4.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M13 11V5.5a1.5 1.5 0 0 1 3 0V13" />
    <path d="M16 11.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-1.5a1.5 1.5 0 0 1 3 0" />
  </svg>
)

const GridIcon = ({ active }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.2" />
    <rect x="14" y="3" width="7" height="7" rx="1.2" />
    <rect x="3" y="14" width="7" height="7" rx="1.2" />
    <rect x="14" y="14" width="7" height="7" rx="1.2" />
  </svg>
)

const BookSearchIcon = ({ active }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="14" height="16" rx="1.5" />
    <path d="M7 7h6" />
    <path d="M7 11h6" />
    <circle cx="16" cy="17" r="3.2" />
    <path d="M18.3 19.3 21 22" />
  </svg>
)

const ProfileIcon = ({ active }: IconProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#111827' : 'none'} stroke={active ? '#111827' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
)

type NavItem = {
  to: string
  label: string
  Icon: (p: IconProps) => JSX.Element
}

const ITEMS: NavItem[] = [
  { to: '/notice', label: '공지', Icon: MegaphoneIcon },
  { to: '/greeting', label: '인사', Icon: HandIcon },
  { to: '/menu', label: '메뉴', Icon: GridIcon },
  { to: '/search', label: '교재검색', Icon: BookSearchIcon },
  { to: '/', label: '마이', Icon: ProfileIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200">
      <div className="mx-auto max-w-md flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 flex items-center justify-center h-full"
            aria-label={label}
          >
            {({ isActive }) => (
              <span className="flex flex-col items-center justify-center">
                <Icon active={isActive} />
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
