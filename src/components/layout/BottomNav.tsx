import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: 'today' | 'history' | 'statistics' | 'settings'
  primary?: boolean
}

const ITEMS: NavItem[] = [
  { to: '/today', label: '今日', icon: 'today', primary: true },
  { to: '/history', label: '歷史', icon: 'history' },
  { to: '/statistics', label: '統計', icon: 'statistics' },
  { to: '/settings', label: '設定', icon: 'settings' },
]

const PATHS: Record<NavItem['icon'], string> = {
  today: 'M4 5.5h16v15H4zM4 10h16M8 3v4M16 3v4',
  history: 'M12 7v5l3.5 2M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4',
  statistics: 'M5 20V11M12 20V5M19 20v-6',
  settings: 'M5 7h14M5 12h14M5 17h14M9 4.5v5M15 9.5v5M9 14.5v5',
}

export function BottomNav() {
  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive && item.primary ? 2.2 : 1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={item.primary ? 'size-7' : 'size-6'}
                  >
                    <path d={PATHS[item.icon]} />
                  </svg>
                  <span
                    className={`${item.primary ? 'text-[13px] font-semibold' : 'text-[12px]'} leading-4`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
