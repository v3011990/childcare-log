import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ensureDefaultChild } from '@/db/database'
import { DEFAULT_CHILD_ID, DEFAULT_CHILD_NAME } from '@/lib/constants'

interface ChildContextValue {
  childId: string
  childName: string
  ready: boolean
  refresh: () => void
}

const ChildContext = createContext<ChildContextValue>({
  childId: DEFAULT_CHILD_ID,
  childName: DEFAULT_CHILD_NAME,
  ready: false,
  refresh: () => {},
})

/**
 * 第一版只有單一孩子，這層負責在 App 啟動時建立預設的 child，
 * 讓所有頁面都拿得到穩定的 childId。
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [childName, setChildName] = useState(DEFAULT_CHILD_NAME)
  const [ready, setReady] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    ensureDefaultChild()
      .then((child) => {
        if (cancelled) return
        setChildName(child.name)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  return (
    <ChildContext.Provider
      value={{
        childId: DEFAULT_CHILD_ID,
        childName,
        ready,
        refresh: () => setTick((value) => value + 1),
      }}
    >
      {children}
    </ChildContext.Provider>
  )
}

export function useActiveChild(): ChildContextValue {
  return useContext(ChildContext)
}
