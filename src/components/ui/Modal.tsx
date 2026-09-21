import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: ReactNode
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
}

/**
 * 只用於「刪除紀錄」「匯入備份」「清除所有資料」這類不可逆操作。
 * 一般儲存流程不跳任何確認視窗（SPEC §25）。
 */
export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-3 sm:items-center">
      <button
        type="button"
        aria-label="關閉"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl bg-card p-5 outline-none"
      >
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-2 text-sm leading-6 whitespace-pre-line text-muted">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}
