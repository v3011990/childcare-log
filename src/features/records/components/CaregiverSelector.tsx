import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup'
import { CAREGIVERS, CAREGIVER_LABELS } from '@/lib/constants'
import type { Caregiver } from '@/types/common'

const OPTIONS: ChipOption<Caregiver>[] = CAREGIVERS.map((caregiver) => ({
  value: caregiver,
  label: CAREGIVER_LABELS[caregiver],
}))

interface CaregiverSelectorProps {
  value?: Caregiver
  onChange: (value: Caregiver | undefined) => void
  ariaLabel: string
  size?: 'md' | 'sm'
}

/**
 * 單選照顧者。再按一次已選的項目可以取消，避免誤觸後無法還原。
 * 選項順序固定，不依使用次數排序，以免暗示誰比較重要。
 */
export function CaregiverSelector({
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: CaregiverSelectorProps) {
  return (
    <ChipGroup
      options={OPTIONS}
      selected={value ? [value] : []}
      onToggle={(next) => onChange(next === value ? undefined : next)}
      ariaLabel={ariaLabel}
      size={size}
    />
  )
}
