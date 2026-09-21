import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="mx-auto max-w-lg pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
