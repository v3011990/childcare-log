import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-primary text-white active:bg-primary-dark disabled:bg-line disabled:text-muted',
  secondary: 'bg-card text-ink border border-line active:bg-primary-soft',
  ghost: 'bg-transparent text-muted active:bg-primary-soft',
  danger: 'bg-danger-soft text-danger border border-danger/30 active:bg-danger/15',
}

const SIZE_CLASS: Record<Size, string> = {
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-13 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
