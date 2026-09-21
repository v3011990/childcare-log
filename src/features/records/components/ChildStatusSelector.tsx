import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup'
import { Textarea } from '@/components/ui/Textarea'
import { CHILD_STATUSES, CHILD_STATUS_LABELS } from '@/lib/constants'
import type { ChildStatus } from '@/types/common'

const OPTIONS: ChipOption<ChildStatus>[] = CHILD_STATUSES.map((status) => ({
  value: status,
  label: CHILD_STATUS_LABELS[status],
}))

interface ChildStatusSelectorProps {
  value: ChildStatus[]
  note?: string
  onChange: (value: ChildStatus[]) => void
  onNoteChange: (note: string) => void
}

/** 可複選（例如生病同時情緒較多）；選了「正常」就代表沒有特別狀況，兩者互斥。 */
export function ChildStatusSelector({
  value,
  note,
  onChange,
  onNoteChange,
}: ChildStatusSelectorProps) {
  const toggle = (status: ChildStatus) => {
    if (value.includes(status)) {
      onChange(value.filter((item) => item !== status))
      return
    }
    if (status === 'normal') {
      onChange(['normal'])
      return
    }
    onChange([...value.filter((item) => item !== 'normal'), status])
  }

  const showNote = value.some((status) => status !== 'normal')

  return (
    <div className="flex flex-col gap-3">
      <ChipGroup options={OPTIONS} selected={value} onToggle={toggle} ariaLabel="孩子今天狀況" />
      {showNote && (
        <Textarea
          id="child-status-note"
          rows={2}
          value={note ?? ''}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="想補充的話可以寫在這裡，例如：下午開始有點咳嗽。"
        />
      )}
    </div>
  )
}
