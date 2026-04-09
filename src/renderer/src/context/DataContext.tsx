import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AppDataDTO } from '../env'

const Ctx = createContext<{
  data: AppDataDTO | null
  refresh: () => Promise<void>
}>({ data: null, refresh: async () => {} })

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppDataDTO | null>(null)
  const refresh = useCallback(async () => {
    try {
      const ae = typeof window !== 'undefined' ? window.ae : undefined
      if (!ae?.getData) {
        console.warn(
          '[Astro Epoch] window.ae is missing. Use the Electron app (npm run dev), not the Vite URL alone in a browser.'
        )
        return
      }
      const d = await ae.getData()
      setData(d)
      document.documentElement.setAttribute('data-theme', d.activeThemeId || 'default')
    } catch (e) {
      console.error('[Astro Epoch] Failed to load app data', e)
    }
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])
  return <Ctx.Provider value={{ data, refresh }}>{children}</Ctx.Provider>
}

export function useAppData() {
  return useContext(Ctx)
}
