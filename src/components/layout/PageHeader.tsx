import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  back?: ReactNode
}

export function PageHeader({ title, subtitle, action, back }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {back}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
