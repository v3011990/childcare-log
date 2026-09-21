import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/app/App'
import { db } from '@/db/database'
import { dumpAll } from '@/db/repository'
import { buildCsv } from '@/features/export/csv'
import { parseBackup, serializeBackup } from '@/features/export/json'

async function resetDatabase() {
  await db.open()
  await Promise.all([db.records.clear(), db.children.clear(), db.settings.clear()])
}

describe('爸爸照顧紀錄從輸入到匯出', () => {
  beforeEach(async () => {
    window.location.hash = '#/today'
    await resetDatabase()
  })

  it('儲存後在 History、Detail 與匯出檔案都看得到', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Today：記下今天由爸爸照顧，並寫下他做了什麼
    await user.click(await screen.findByRole('button', { name: '爸爸' }))
    await user.click(await screen.findByRole('checkbox', { name: /陪玩/ }))
    await user.type(
      await screen.findByLabelText('爸爸今天做了什麼？'),
      '陪玩積木一段時間，之後帶去洗澡',
    )
    await user.click(screen.getByRole('button', { name: '儲存紀錄' }))
    expect(await screen.findByText('已儲存')).toBeInTheDocument()

    // History：列表看得到摘要
    await user.click(screen.getByRole('link', { name: '歷史' }))
    const card = await screen.findByRole('link', { name: /主要照顧/ })
    expect(within(card).getByText('陪玩')).toBeInTheDocument()

    // Detail：看得到完整的照顧紀錄
    await user.click(card)
    await waitFor(() => {
      expect(screen.getByText('陪玩積木一段時間，之後帶去洗澡')).toBeInTheDocument()
    })
    expect(screen.getByText('照顧活動')).toBeInTheDocument()

    // Export：JSON 與 CSV 都含這筆資料
    const data = await dumpAll()
    const parsed = parseBackup(serializeBackup(data))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.data.records[0]?.caregiverNotes.father).toBe('陪玩積木一段時間，之後帶去洗澡')
    }
    expect(buildCsv(data.records)).toContain('陪玩積木一段時間，之後帶去洗澡')
  })

  it('刪除紀錄後回到歷史頁，列表不再顯示該筆', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: '外婆' }))
    await user.click(await screen.findByRole('checkbox', { name: /接托/ }))
    await user.click(screen.getByRole('button', { name: '儲存紀錄' }))
    await screen.findByText('已儲存')

    await user.click(screen.getByRole('link', { name: '歷史' }))
    await user.click(await screen.findByRole('link', { name: /主要照顧/ }))
    await user.click(await screen.findByRole('button', { name: '刪除這筆紀錄' }))
    await user.click(await screen.findByRole('button', { name: '刪除' }))

    expect(await screen.findByText(/還沒有紀錄/)).toBeInTheDocument()
  })
})
