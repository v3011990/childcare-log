import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CareChecklist } from '@/features/records/components/CareChecklist'
import { CaregiverNotesForm } from '@/features/records/components/CaregiverNotesForm'
import { CaregiverSelector } from '@/features/records/components/CaregiverSelector'
import { ChildStatusSelector } from '@/features/records/components/ChildStatusSelector'
import { ExpenseSection } from '@/features/records/components/ExpenseSection'
import { ImportantEventForm } from '@/features/records/components/ImportantEventForm'
import { involvedCaregivers } from '@/features/records/record.utils'
import type { SaveStatus } from '@/features/records/hooks/useTodayRecord'
import type { CareRecordDraft } from '@/features/records/record.types'

interface QuickRecordFormProps {
  draft: CareRecordDraft
  status: SaveStatus
  onChange: (updater: (draft: CareRecordDraft) => CareRecordDraft) => void
  onSave: () => void
  saveLabel?: string
  /** 補記過去的日子時，畫面文案要說「這天」而不是「今天」，避免誤導。 */
  dayWord?: '今天' | '這天'
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: '',
  pending: '',
  saving: '儲存中',
  saved: '已儲存',
  error: '儲存失敗，請再試一次',
}

export function QuickRecordForm({
  draft,
  status,
  onChange,
  onSave,
  saveLabel = '儲存紀錄',
  dayWord = '今天',
}: QuickRecordFormProps) {
  const [showMore, setShowMore] = useState(draft.expenses.length > 0)
  const involved = involvedCaregivers(draft)

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <Card
        title={`${dayWord}主要照顧者`}
        hint={`${dayWord}大部分時間主要由誰照顧？之後每個活動都可以單獨調整。`}
      >
        <CaregiverSelector
          value={draft.primaryCaregiver}
          onChange={(value) => onChange((current) => ({ ...current, primaryCaregiver: value }))}
          ariaLabel="今天主要照顧者"
        />
      </Card>

      <Card title={`${dayWord}做了什麼？`} hint="有做到的勾起來就好，不需要記時間。">
        <CareChecklist
          activities={draft.activities}
          primaryCaregiver={draft.primaryCaregiver}
          dayWord={dayWord}
          onChange={(activities) => onChange((current) => ({ ...current, activities }))}
        />
      </Card>

      <Card title={`孩子${dayWord}狀況`}>
        <ChildStatusSelector
          value={draft.childStatus}
          note={draft.childStatusNote}
          onChange={(childStatus) => onChange((current) => ({ ...current, childStatus }))}
          onNoteChange={(childStatusNote) =>
            onChange((current) => ({ ...current, childStatusNote }))
          }
        />
      </Card>

      <Card title="照顧紀錄" hint="選填。想留下細節時再寫，沒有也沒關係。">
        <CaregiverNotesForm
          draft={draft}
          involved={involved}
          dayWord={dayWord}
          onChange={(caregiverNotes) => onChange((current) => ({ ...current, caregiverNotes }))}
        />
      </Card>

      <Card title={`${dayWord}重要的事情`} hint="平常可以完全不用填。">
        <ImportantEventForm
          events={draft.importantEvents}
          note={draft.importantNote}
          onEventsChange={(importantEvents) =>
            onChange((current) => ({ ...current, importantEvents }))
          }
          onNoteChange={(importantNote) => onChange((current) => ({ ...current, importantNote }))}
        />
      </Card>

      {showMore ? (
        <Card title="費用" hint="不需要每天填。">
          <ExpenseSection
            expenses={draft.expenses}
            defaultPayer={draft.primaryCaregiver}
            onChange={(expenses) => onChange((current) => ({ ...current, expenses }))}
          />
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="min-h-11 rounded-xl text-[14px] text-muted"
        >
          更多紀錄（費用）
        </button>
      )}

      <div className="mt-1 flex flex-col items-center gap-2">
        <Button size="lg" fullWidth onClick={onSave}>
          {saveLabel}
        </Button>
        <p
          aria-live="polite"
          className={`min-h-5 text-[13px] ${status === 'error' ? 'text-danger' : 'text-muted'}`}
        >
          {STATUS_TEXT[status]}
        </p>
      </div>
    </div>
  )
}
