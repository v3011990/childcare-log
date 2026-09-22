import { useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup'
import {
  CAREGIVERS,
  CAREGIVER_LABELS,
  CARE_ACTIVITIES,
  CARE_ACTIVITY_LABELS,
} from '@/lib/constants'
import type { CareActivityRecord } from '@/features/records/record.types'
import type { CareActivity, Caregiver } from '@/types/common'

const CAREGIVER_OPTIONS: ChipOption<Caregiver>[] = CAREGIVERS.map((caregiver) => ({
  value: caregiver,
  label: CAREGIVER_LABELS[caregiver],
}))

interface CareChecklistProps {
  activities: CareActivityRecord[]
  primaryCaregiver?: Caregiver
  dayWord?: '今天' | '這天'
  onChange: (activities: CareActivityRecord[]) => void
}

/** 標籤上顯示參與者，超過兩位就收合成「＋N」，避免在小螢幕上把整列撐開。 */
function caregiverSummary(caregivers: Caregiver[]): string {
  const labels = caregivers.map((caregiver) => CAREGIVER_LABELS[caregiver])
  if (labels.length <= 2) return labels.join('、')
  return `${labels.slice(0, 2).join('、')} +${labels.length - 2}`
}

/**
 * 勾選活動時預設帶入「今天主要照顧者」，需要時再點右側標籤增減參與的人。
 * 預設值一律顯示在畫面上，不會偷偷替使用者填入看不見的資料（SPEC §16.7）。
 */
export function CareChecklist({
  activities,
  primaryCaregiver,
  dayWord = '今天',
  onChange,
}: CareChecklistProps) {
  const [expanded, setExpanded] = useState<CareActivity | null>(null)

  const byActivity = new Map(activities.map((item) => [item.activity, item]))
  const locked = primaryCaregiver === undefined

  const toggle = (activity: CareActivity, checked: boolean) => {
    if (checked) {
      if (!primaryCaregiver) return
      onChange([...activities, { activity, caregivers: [primaryCaregiver] }])
    } else {
      onChange(activities.filter((item) => item.activity !== activity))
      if (expanded === activity) setExpanded(null)
    }
  }

  /** 多選參與者。取消掉最後一位等同於取消勾選這項活動。 */
  const toggleCaregiver = (activity: CareActivity, caregiver: Caregiver) => {
    const current = byActivity.get(activity)
    if (!current) return

    const next = current.caregivers.includes(caregiver)
      ? current.caregivers.filter((item) => item !== caregiver)
      : [...current.caregivers, caregiver]

    if (next.length === 0) {
      onChange(activities.filter((item) => item.activity !== activity))
      setExpanded(null)
      return
    }

    onChange(
      activities.map((item) => (item.activity === activity ? { ...item, caregivers: next } : item)),
    )
  }

  return (
    <div>
      {locked && (
        <p className="mb-2 rounded-xl bg-primary-soft px-3 py-2 text-[13px] leading-5 text-muted">
          先選{dayWord}的主要照顧者，勾選的活動會預設記在他／她身上，之後可以單獨修改。
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
                      aria-label={`修改「${CARE_ACTIVITY_LABELS[activity]}」的照顧者，目前是${current.caregivers
                        .map((caregiver) => CAREGIVER_LABELS[caregiver])
                        .join('、')}`}
                      onClick={() => setExpanded(expanded === activity ? null : activity)}
                      className="min-h-9 shrink-0 rounded-full border border-line bg-surface px-3 text-[13px] text-muted active:bg-primary-soft"
                    >
                      {caregiverSummary(current.caregivers)}
                    </button>
                  ) : null
                }
              />
              {current && expanded === activity && (
                <div className="flex flex-col gap-2 pt-1 pb-3 pl-9">
                  <ChipGroup
                    options={CAREGIVER_OPTIONS}
                    selected={current.caregivers}
                    onToggle={(caregiver) => toggleCaregiver(activity, caregiver)}
                    ariaLabel={`${CARE_ACTIVITY_LABELS[activity]}的照顧者`}
                    size="sm"
                  />
                  <p className="text-[12px] leading-5 text-muted">
                    可以複選。取消最後一位等於取消勾選這項活動。
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
