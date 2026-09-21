import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  hint?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, hint, action, children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(37,49,46,0.05)] ${className}`}
    >
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {hint && <p className="mt-1 text-[13px] leading-5 text-muted">{hint}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
