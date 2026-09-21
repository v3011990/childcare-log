import { useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { CaregiverSelector } from '@/features/records/components/CaregiverSelector'
import { CARE_ACTIVITIES, CARE_ACTIVITY_LABELS, CAREGIVER_LABELS } from '@/lib/constants'
import type { CareActivityRecord } from '@/features/records/record.types'
import type { CareActivity, Caregiver } from '@/types/common'

interface CareChecklistProps {
  activities: CareActivityRecord[]
  primaryCaregiver?: Caregiver
  onChange: (activities: CareActivityRecord[]) => void
}

/**
 * 勾選活動時預設帶入「今天主要照顧者」，需要時再點右側標籤改成別人。
 * 預設值一律顯示在畫面上，不會偷偷替使用者填入看不見的資料（SPEC §16.7）。
 */
export function CareChecklist({ activities, primaryCaregiver, onChange }: CareChecklistProps) {
  const [expanded, setExpanded] = useState<CareActivity | null>(null)

  const byActivity = new Map(activities.map((item) => [item.activity, item]))
  const locked = primaryCaregiver === undefined

  const toggle = (activity: CareActivity, checked: boolean) => {
    if (checked) {
      if (!primaryCaregiver) return
      onChange([...activities, { activity, caregiver: primaryCaregiver }])
    } else {
      onChange(activities.filter((item) => item.activity !== activity))
      if (expanded === activity) setExpanded(null)
    }
  }

  const setCaregiver = (activity: CareActivity, caregiver: Caregiver | undefined) => {
    if (!caregiver) return
    onChange(activities.map((item) => (item.activity === activity ? { ...item, caregiver } : item)))
    setExpanded(null)
  }

  return (
    <div>
      {locked && (
        <p className="mb-2 rounded-xl bg-primary-soft px-3 py-2 text-[13px] leading-5 text-muted">
          先選今天的主要照顧者，勾選的活動會預設記在他／她身上，之後可以單獨修改。
        </p>
      )}
      <ul className="divide-y divide-line">
        {CARE_ACTIVITIES.map((activity) => {
          const current = byActivity.get(activity)
          const checked = current !== undefined
          return (
            <li key={activity} className="py-0.5">
              <Checkbox
                checked={checked}
                disabled={locked}
                onChange={(next) => toggle(activity, next)}
                label={CARE_ACTIVITY_LABELS[activity]}
                trailing={
                  current ? (
                    <button
                      type="button"
                      aria-label={`修改「${CARE_ACTIVITY_LABELS[activity]}」的照顧者，目前是${CAREGIVER_LABELS[current.caregiver]}`}
                      onClick={() => setExpanded(expanded === activity ? null : activity)}
                      className="min-h-9 shrink-0 rounded-full border border-line bg-surface px-3 text-[13px] text-muted active:bg-primary-soft"
                    >
                      {CAREGIVER_LABELS[current.caregiver]}
                    </button>
                  ) : null
                }
              />
              {current && expanded === activity && (
                <div className="pt-1 pb-3 pl-9">
                  <CaregiverSelector
                    value={current.caregiver}
                    onChange={(next) => setCaregiver(activity, next)}
                    ariaLabel={`${CARE_ACTIVITY_LABELS[activity]}的照顧者`}
                    size="sm"
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
