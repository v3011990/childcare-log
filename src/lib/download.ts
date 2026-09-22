/** 在瀏覽器觸發檔案下載。資料只會留在使用者裝置上，不會送到任何伺服器。 */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()

  // 立刻 revoke 會和瀏覽器接手下載的時機賽跑，導致檔名退回成「download」、
  // 甚至下載失敗。延後一拍再清掉 object URL。
  setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, 1000)
}
