export interface ChipOption<T extends string> {
  value: T
  label: string
}

interface ChipGroupProps<T extends string> {
  options: readonly ChipOption<T>[]
  /** 已選取的值。單選時傳入 0 或 1 個。 */
  selected: readonly T[]
  onToggle: (value: T) => void
  disabled?: boolean
  ariaLabel: string
  size?: 'md' | 'sm'
}

/**
 * 手機優先的選項列：每個項目至少 44px 高，超出寬度自動換行，
 * 不使用下拉選單或多層 modal（SPEC §19、§25）。
 */
export function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
  disabled = false,
  ariaLabel,
  size = 'md',
}: ChipGroupProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onToggle(option.value)}
            className={`rounded-full border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              size === 'sm' ? 'min-h-9 px-3 text-[13px]' : 'min-h-11 px-4 text-[15px]'
            } ${
              isSelected
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-card text-ink active:bg-primary-soft'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
