import { useState } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { CaregiverSelector } from '@/features/records/components/CaregiverSelector'
import { CAREGIVERS, CAREGIVER_LABELS } from '@/lib/constants'
import type { CareRecordDraft } from '@/features/records/record.types'
import type { Caregiver } from '@/types/common'

interface CaregiverNotesFormProps {
  draft: CareRecordDraft
  involved: Caregiver[]
  dayWord?: '今天' | '這天'
  onChange: (notes: Partial<Record<Caregiver, string>>) => void
}

/**
 * 每位今天有參與的照顧者各一格，任何一方都能被記錄，也都不是必填（SPEC §2.5）。
 * 需要記錄沒有出現在活動清單裡的人時，可以自行加一格。
 */
export function CaregiverNotesForm({
  draft,
  involved,
  dayWord = '今天',
  onChange,
}: CaregiverNotesFormProps) {
  const [extra, setExtra] = useState<Caregiver[]>([])
  const [picking, setPicking] = useState(false)

  const shown = CAREGIVERS.filter(
    (caregiver) =>
      involved.includes(caregiver) ||
      extra.includes(caregiver) ||
      draft.caregiverNotes[caregiver] !== undefined,
  )

  const setNote = (caregiver: Caregiver, value: string) => {
    onChange({ ...draft.caregiverNotes, [caregiver]: value })
  }

  const addCaregiver = (caregiver: Caregiver | undefined) => {
    if (caregiver && !extra.includes(caregiver)) setExtra([...extra, caregiver])
    setPicking(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {shown.length === 0 && (
        <p className="text-[13px] leading-5 text-muted">
          選好主要照顧者或勾選活動之後，這裡會出現對應的紀錄欄位。
        </p>
      )}

      {shown.map((caregiver) => (
        <Textarea
          key={caregiver}
          id={`caregiver-note-${caregiver}`}
          label={`${CAREGIVER_LABELS[caregiver]}${dayWord}做了什麼？`}
          rows={2}
          value={draft.caregiverNotes[caregiver] ?? ''}
          onChange={(event) => setNote(caregiver, event.target.value)}
          placeholder="寫下實際發生的事就好，例如：陪玩積木一段時間，之後帶去洗澡。"
        />
      ))}

      {picking ? (
        <CaregiverSelector
          value={undefined}
          onChange={addCaregiver}
          ariaLabel="選擇要新增紀錄的照顧者"
          size="sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="min-h-11 self-start rounded-xl px-1 text-left text-[14px] text-primary"
        >
          ＋ 新增其他照顧者的紀錄
        </button>
      )}
    </div>
  )
}
