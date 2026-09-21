import { Navigate, type RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TodayPage } from '@/pages/TodayPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { RecordDetailPage } from '@/pages/RecordDetailPage'
import { StatisticsPage } from '@/pages/StatisticsPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'history/:recordId', element: <RecordDetailPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/today" replace /> },
    ],
  },
]
