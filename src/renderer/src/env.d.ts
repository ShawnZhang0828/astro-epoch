/// <reference types="vite/client" />

export interface ShopItemDTO {
  id: string
  name: string
  description: string
  category: string
  price: number
  galaxyRegion?: 'solar_system' | 'milky_way' | 'exo_systems'
  planetStyleId?: string
  orbiterKey?: string
  atmosphereKey?: string
  themeId?: string
}

export interface AppDataDTO {
  version: number
  stardust: number
  tags: { id: string; name: string; kind: string; createdAt: string }[]
  defaultTagId: string
  sessions: unknown[]
  purchasedItemIds: string[]
  equippedOrbiterIds: string[]
  unlockedPlanetIds: string[]
  unlockedAtmosphereIds: string[]
  activeThemeId: string
  settings: {
    hardcoreDefault: boolean
    monitoringEnabled: boolean
    whitelist: string[]
    blacklist: string[]
    activeAtmosphereKey?: string
    lastFocusPlannedMinutes?: number
    lastFocusTagId?: string
    lastFocusPlanetStyleId?: string
  }
  achievementsUnlocked: string[]
  rarePlanetsUnlocked: string[]
  streakDays: number
  lastStreakDate?: string
  totalOvertimeMinutes: number
}

declare global {
  interface Window {
    ae: {
      getData: () => Promise<AppDataDTO>
      setFocusActive: (active: boolean) => Promise<void>
      previewRewards: (p: { plannedMinutes: number; tagId: string; hardcore: boolean }) => Promise<unknown>
      endSession: (p: {
        plannedMinutes: number
        actualMinutes: number
        tagId: string
        hardcore: boolean
        startedAt: string
        planetStyleId?: string
      }) => Promise<{
        session: unknown
        rewards: unknown
        achievements: { id: string; title: string; rarePlanetId: string; rarePlanetName: string }[]
      }>
      creditBreak: (amount: number) => Promise<number>
      createTag: (name: string, kind: string) => Promise<string>
      setDefaultTag: (tagId: string) => Promise<void>
      buyItem: (itemId: string) => Promise<{ ok: boolean; error?: string; data?: AppDataDTO }>
      listShop: () => Promise<ShopItemDTO[]>
      equipOrbiters: (ids: string[]) => Promise<AppDataDTO>
      setTheme: (themeId: string) => Promise<AppDataDTO>
      updateSettings: (partial: Record<string, unknown>) => Promise<AppDataDTO>
      onSuggestFocus: (cb: (p: { exe: string }) => void) => () => void
    }
  }
}

export {}
