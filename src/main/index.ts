import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { getItemById, SHOP_ITEMS } from './catalog'
import { checkAchievements, computeSessionRewards, updateStreak } from './rewards'
import { getData, initStore, mutate, save } from './store'
import { setFocusSessionActive, startWindowMonitor } from './window-monitor'
import type { FocusSession } from './types'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Astro Epoch'
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  const url = process.env.ELECTRON_RENDERER_URL
  if (url) {
    mainWindow.loadURL(url)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function orbiterKeysFromData(data: ReturnType<typeof getData>): string[] {
  const keys: string[] = []
  for (const id of data.equippedOrbiterIds) {
    const item = getItemById(id)
    if (item?.orbiterKey === 'logic_bonus') keys.push('logic_bonus')
    if (item?.orbiterKey === 'endurance_drop') keys.push('endurance_drop')
  }
  return keys
}

app.whenReady().then(() => {
  initStore(app.getPath('userData'))
  createWindow()
  if (mainWindow) startWindowMonitor(mainWindow)

  ipcMain.handle('data:get', () => getData())
  ipcMain.handle('focus:set-active', (_e, active: boolean) => {
    setFocusSessionActive(active)
  })

  ipcMain.handle(
    'rewards:preview',
    (_e, payload: { plannedMinutes: number; tagId: string; hardcore: boolean }) => {
      const data = getData()
      const tag = data.tags.find((t) => t.id === payload.tagId)
      return computeSessionRewards({
        plannedMinutes: payload.plannedMinutes,
        actualMinutes: payload.plannedMinutes,
        hardcore: payload.hardcore,
        tag,
        equippedOrbiterKeys: orbiterKeysFromData(data)
      })
    }
  )

  ipcMain.handle(
    'session:end',
    (
      _e,
      payload: {
        plannedMinutes: number
        actualMinutes: number
        tagId: string
        hardcore: boolean
        startedAt: string
        planetStyleId?: string
      }
    ) => {
      const data = getData()
      const tag = data.tags.find((t) => t.id === payload.tagId) ?? data.tags.find((t) => t.id === data.defaultTagId)
      const rewards = computeSessionRewards({
        plannedMinutes: payload.plannedMinutes,
        actualMinutes: payload.actualMinutes,
        hardcore: payload.hardcore,
        tag,
        equippedOrbiterKeys: orbiterKeysFromData(data)
      })

      const session: FocusSession = {
        id: `s-${Date.now()}`,
        startedAt: payload.startedAt,
        endedAt: new Date().toISOString(),
        plannedMinutes: payload.plannedMinutes,
        actualMinutes: payload.actualMinutes,
        tagId: tag?.id ?? data.defaultTagId,
        hardcore: payload.hardcore,
        completedFullDuration: rewards.completedFullDuration,
        exitedEarly: rewards.exitedEarly,
        stardustEarned: rewards.stardust,
        overtimeMinutes: rewards.overtimeMinutes,
        planetStyleId: payload.planetStyleId
      }

      mutate((d) => {
        d.sessions.push(session)
        d.stardust += rewards.stardust
        if (payload.actualMinutes > 0) updateStreak(d, session.endedAt)
      })

      const d2 = getData()
      const ach = checkAchievements(d2, session)
      save(d2)
      return { session, rewards, achievements: ach.newlyUnlocked }
    }
  )

  ipcMain.handle('break:credit', (_e, amount: number) => {
    mutate((d) => {
      d.stardust += amount
    })
    return getData().stardust
  })

  ipcMain.handle('tag:create', (_e, name: string, kind: string) => {
    const id = `tag-${Date.now()}`
    mutate((d) => {
      d.tags.push({
        id,
        name: name.trim() || 'Untitled',
        kind: (kind as 'programming' | 'writing' | 'research' | 'general') || 'general',
        createdAt: new Date().toISOString()
      })
    })
    return id
  })

  ipcMain.handle('tag:set-default', (_e, tagId: string) => {
    mutate((d) => {
      if (d.tags.some((t) => t.id === tagId)) d.defaultTagId = tagId
    })
  })

  ipcMain.handle('shop:buy', (_e, itemId: string) => {
    const item = getItemById(itemId)
    if (!item) return { ok: false, error: 'Unknown item' }
    const data = getData()
    if (data.purchasedItemIds.includes(itemId)) return { ok: false, error: 'Already owned' }
    if (data.stardust < item.price) return { ok: false, error: 'Not enough Stardust' }
    mutate((d) => {
      d.stardust -= item.price
      d.purchasedItemIds.push(itemId)
      if (item.category === 'planet_core' && item.planetStyleId && !d.unlockedPlanetIds.includes(item.planetStyleId)) {
        d.unlockedPlanetIds.push(item.planetStyleId)
      }
      if (item.category === 'atmosphere' && item.atmosphereKey && !d.unlockedAtmosphereIds.includes(item.atmosphereKey)) {
        d.unlockedAtmosphereIds.push(item.atmosphereKey)
      }
    })
    return { ok: true, data: getData() }
  })

  ipcMain.handle('shop:list', () => SHOP_ITEMS)

  ipcMain.handle('orbiters:equip', (_e, itemIds: string[]) => {
    mutate((d) => {
      const valid = itemIds.filter((id) => {
        const it = getItemById(id)
        return it?.category === 'orbiter' && d.purchasedItemIds.includes(id)
      })
      d.equippedOrbiterIds = valid.slice(0, 2)
    })
    return getData()
  })

  ipcMain.handle('theme:set', (_e, themeId: string) => {
    mutate((d) => {
      if (themeId === 'default') d.activeThemeId = 'default'
      else {
        const owned = SHOP_ITEMS.find((i) => i.themeId === themeId && d.purchasedItemIds.includes(i.id))
        if (owned) d.activeThemeId = themeId
      }
    })
    return getData()
  })

  ipcMain.handle('settings:update', (_e, partial: Record<string, unknown>) => {
    mutate((d) => {
      const p = partial as Partial<import('./types').AppSettings>
      if (typeof p.hardcoreDefault === 'boolean') d.settings.hardcoreDefault = p.hardcoreDefault
      if (typeof p.monitoringEnabled === 'boolean') d.settings.monitoringEnabled = p.monitoringEnabled
      if (Array.isArray(p.whitelist)) d.settings.whitelist = p.whitelist as string[]
      if (Array.isArray(p.blacklist)) d.settings.blacklist = p.blacklist as string[]
      if (Object.prototype.hasOwnProperty.call(p, 'activeAtmosphereKey')) {
        const v = p.activeAtmosphereKey
        if (typeof v === 'string' && v.length > 0) d.settings.activeAtmosphereKey = v
        else delete d.settings.activeAtmosphereKey
      }
      if (typeof p.lastFocusPlannedMinutes === 'number' && Number.isFinite(p.lastFocusPlannedMinutes)) {
        d.settings.lastFocusPlannedMinutes = p.lastFocusPlannedMinutes
      }
      if (typeof p.lastFocusTagId === 'string' && p.lastFocusTagId.length > 0) {
        d.settings.lastFocusTagId = p.lastFocusTagId
      }
      if (typeof p.lastFocusPlanetStyleId === 'string' && p.lastFocusPlanetStyleId.length > 0) {
        d.settings.lastFocusPlanetStyleId = p.lastFocusPlanetStyleId
      }
    })
    return getData()
  })

  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    shell.openExternal(url)
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
