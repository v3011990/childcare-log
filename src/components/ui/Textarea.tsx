import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, id, className = '', rows = 3, ...rest }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[13px] text-muted">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full resize-y rounded-xl border border-line bg-card px-3 py-2.5 text-base leading-6 text-ink outline-none placeholder:text-muted/70 focus:border-primary ${className}`}
        {...rest}
      />
    </div>
  )
}
