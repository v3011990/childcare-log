import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { db } from '@/db/database'
import { getRecordByDate } from '@/db/repository'
import { DEFAULT_CHILD_ID } from '@/lib/constants'
import { todayISO } from '@/lib/dates'

async function resetDatabase() {
  await db.open()
  await Promise.all([db.records.clear(), db.children.clear(), db.settings.clear()])
}

describe('Today Page', () => {
  beforeEach(async () => {
    window.location.hash = '#/today'
    await resetDatabase()
  })

  it('選照顧者、勾活動、寫重要事項後儲存，重新開啟仍然存在', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(await screen.findByRole('button', { name: '媽媽' }))
    await user.click(await screen.findByRole('checkbox', { name: /送托/ }))
    await user.click(screen.getByRole('checkbox', { name: /哄睡/ }))

    await user.click(screen.getByRole('button', { name: '看醫生' }))
    await user.type(await screen.findByPlaceholderText(/簡單寫下發生的經過/), '下午去診所回診')

    await user.click(screen.getByRole('button', { name: '儲存紀錄' }))
    expect(await screen.findByText('已儲存')).toBeInTheDocument()

    const stored = await getRecordByDate(DEFAULT_CHILD_ID, todayISO())
    expect(stored?.primaryCaregiver).toBe('mother')
    expect(stored?.activities).toEqual([
      { activity: 'dropoff', caregivers: ['mother'] },
      { activity: 'bedtime', caregivers: ['mother'] },
    ])
    expect(stored?.importantEvents).toEqual(['doctor'])
    expect(stored?.importantNote).toBe('下午去診所回診')

    // 模擬重新整理
    unmount()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '媽媽' })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByRole('checkbox', { name: /送托/ })).toBeChecked()
    expect(screen.getByDisplayValue('下午去診所回診')).toBeInTheDocument()
  })

  it('沒有選主要照顧者時不能勾活動，避免產生沒有執行者的紀錄', async () => {
    render(<App />)
    expect(await screen.findByRole('checkbox', { name: /送托/ })).toBeDisabled()
  })

  it('活動照顧者預設帶入主要照顧者，可單獨改成別人', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: '媽媽' }))
    await user.click(await screen.findByRole('checkbox', { name: /接托/ }))

    const tag = await screen.findByRole('button', { name: /修改「接托／接學」的照顧者/ })
    await user.click(tag)

    const group = await screen.findByRole('group', { name: '接托／接學的照顧者' })
    await user.click(within(group).getByRole('button', { name: '外婆' }))

    await waitFor(async () => {
      const stored = await getRecordByDate(DEFAULT_CHILD_ID, todayISO())
      expect(stored?.activities).toEqual([
        { activity: 'pickup', caregivers: ['mother', 'grandmother'] },
      ])
    })
  })

  it('完全空白的一天不會建立紀錄', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: '儲存紀錄' }))
    expect(await getRecordByDate(DEFAULT_CHILD_ID, todayISO())).toBeUndefined()
  })
})
