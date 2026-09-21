import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  CAREGIVERS,
  CAREGIVER_LABELS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/constants'
import { createExpense } from '@/features/records/record.utils'
import type { Expense } from '@/features/records/record.types'
import type { Caregiver, ExpenseCategory } from '@/types/common'

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((category) => ({
  value: category,
  label: EXPENSE_CATEGORY_LABELS[category],
}))

const PAYER_OPTIONS = CAREGIVERS.map((caregiver) => ({
  value: caregiver,
  label: CAREGIVER_LABELS[caregiver],
}))

interface ExpenseSectionProps {
  expenses: Expense[]
  defaultPayer?: Caregiver
  onChange: (expenses: Expense[]) => void
}

/** 費用不是每日必填，放在「更多紀錄」裡，同一天可以記多筆（SPEC §11）。 */
export function ExpenseSection({ expenses, defaultPayer, onChange }: ExpenseSectionProps) {
  const patch = (id: string, changes: Partial<Expense>) => {
    onChange(expenses.map((expense) => (expense.id === id ? { ...expense, ...changes } : expense)))
  }

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense, index) => (
        <div key={expense.id} className="flex flex-col gap-3 rounded-xl bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted">第 {index + 1} 筆</span>
            <button
              type="button"
              onClick={() => onChange(expenses.filter((item) => item.id !== expense.id))}
              className="min-h-9 rounded-lg px-2 text-[13px] text-danger"
            >
              移除
            </button>
          </div>
          <Input
            id={`expense-amount-${expense.id}`}
            label="金額"
            type="number"
            inputMode="numeric"
            min={0}
            value={Number.isFinite(expense.amount) ? String(expense.amount) : ''}
            onChange={(event) => patch(expense.id, { amount: Number(event.target.value || 0) })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              id={`expense-category-${expense.id}`}
              label="類別"
              options={CATEGORY_OPTIONS}
              value={expense.category}
              onChange={(event) =>
                patch(expense.id, { category: event.target.value as ExpenseCategory })
              }
            />
            <Select
              id={`expense-payer-${expense.id}`}
              label="付款人"
              options={PAYER_OPTIONS}
              value={expense.payer}
              onChange={(event) => patch(expense.id, { payer: event.target.value as Caregiver })}
            />
          </div>
          <Input
            id={`expense-note-${expense.id}`}
            label="備註（選填）"
            value={expense.note ?? ''}
            onChange={(event) => patch(expense.id, { note: event.target.value })}
            placeholder="例如：診所掛號費"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...expenses, createExpense(defaultPayer)])}
        className="min-h-11 self-start rounded-xl px-1 text-left text-[14px] text-primary"
      >
        ＋ 新增一筆費用
      </button>
    </div>
  )
}
