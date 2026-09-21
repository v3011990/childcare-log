import { RouterProvider, createHashRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { routes } from '@/app/routes'

/**
 * 使用 hash router：PWA 離線開啟時不依賴伺服器端的 rewrite 規則，
 * 直接用檔案系統或任何靜態空間託管都能正常運作。
 */
const router = createHashRouter(routes)

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
