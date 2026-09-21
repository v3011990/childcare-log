import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup'
import { Textarea } from '@/components/ui/Textarea'
import { IMPORTANT_EVENT_LABELS, IMPORTANT_EVENT_TAGS } from '@/lib/constants'
import type { ImportantEventTag } from '@/types/common'

const OPTIONS: ChipOption<ImportantEventTag>[] = IMPORTANT_EVENT_TAGS.map((tag) => ({
  value: tag,
  label: IMPORTANT_EVENT_LABELS[tag],
}))

interface ImportantEventFormProps {
  events: ImportantEventTag[]
  note?: string
  onEventsChange: (events: ImportantEventTag[]) => void
  onNoteChange: (note: string) => void
}

/**
 * 平常什麼都不用填；選了標籤才展開文字輸入（SPEC §10）。
 * placeholder 以「發生了什麼」為主，不引導使用者評價任何人（SPEC §2.3）。
 */
export function ImportantEventForm({
  events,
  note,
  onEventsChange,
  onNoteChange,
}: ImportantEventFormProps) {
  const toggle = (tag: ImportantEventTag) => {
    onEventsChange(events.includes(tag) ? events.filter((item) => item !== tag) : [...events, tag])
  }

  return (
    <div className="flex flex-col gap-3">
      <ChipGroup
        options={OPTIONS}
        selected={events}
        onToggle={toggle}
        ariaLabel="今天重要的事情"
        size="sm"
      />
      {events.length > 0 && (
        <Textarea
          id="important-note"
          rows={3}
          value={note ?? ''}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="簡單寫下發生的經過就好，例如：下午去診所看醫生，量到 38.2 度。"
        />
      )}
    </div>
  )
}
