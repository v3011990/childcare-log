import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base text-ink outline-none placeholder:text-muted/70 focus:border-primary ${className}`}
        {...rest}
      />
    </div>
  )
}
