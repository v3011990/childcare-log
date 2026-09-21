import type { ReactNode } from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
  /** 右側附加內容（例如該活動的照顧者標籤）。 */
  trailing?: ReactNode
}

export function Checkbox({ checked, onChange, label, disabled = false, trailing }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        className={`flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl px-1 ${
          disabled ? 'cursor-not-allowed opacity-45' : 'active:bg-primary-soft'
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden="true"
          className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            checked
              ? 'border-primary bg-primary text-white'
              : 'border-line bg-card text-transparent'
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[15px] text-ink">{label}</span>
      </label>
      {trailing}
    </div>
  )
}
