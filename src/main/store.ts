import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { AppData, AppSettings, Tag } from './types'
import { DEFAULT_BLACKLIST, DEFAULT_WHITELIST } from './types'

const FILE = 'astro-epoch-data.json'

function defaultSettings(): AppSettings {
  return {
    hardcoreDefault: false,
    monitoringEnabled: true,
    whitelist: [...DEFAULT_WHITELIST],
    blacklist: [...DEFAULT_BLACKLIST]
  }
}

function defaultTag(): Tag {
  const id = 'tag-default-general'
  return {
    id,
    name: 'General',
    kind: 'general',
    createdAt: new Date().toISOString()
  }
}

export function createInitialData(): AppData {
  const tag = defaultTag()
  return {
    version: 1,
    stardust: 0,
    tags: [tag],
    defaultTagId: tag.id,
    sessions: [],
    purchasedItemIds: [],
    equippedOrbiterIds: [],
    unlockedPlanetIds: ['earth'],
    unlockedAtmosphereIds: [],
    activeThemeId: 'default',
    settings: defaultSettings(),
    achievementsUnlocked: [],
    rarePlanetsUnlocked: [],
    streakDays: 0,
    totalOvertimeMinutes: 0
  }
}

let dataPath = ''
let cache: AppData | null = null

export function initStore(userDataPath: string): void {
  dataPath = join(userDataPath, FILE)
  cache = null
}

function load(): AppData {
  if (cache) return cache
  if (!existsSync(dataPath)) {
    cache = createInitialData()
    save(cache)
    return cache
  }
  const raw = readFileSync(dataPath, 'utf-8')
  const parsed = JSON.parse(raw) as AppData
  if (!parsed.version) {
    cache = createInitialData()
    save(cache)
    return cache
  }
  if (!parsed.totalOvertimeMinutes) parsed.totalOvertimeMinutes = 0
  parsed.unlockedPlanetIds = parsed.unlockedPlanetIds.map((id) => (id === 'starter' ? 'earth' : id))
  if (!parsed.unlockedPlanetIds.includes('earth')) parsed.unlockedPlanetIds.unshift('earth')
  for (const s of parsed.sessions as { planetStyleId?: string }[]) {
    if (s.planetStyleId === 'starter') s.planetStyleId = 'earth'
  }
  if (!parsed.settings?.whitelist?.length) {
    parsed.settings = { ...defaultSettings(), ...parsed.settings }
  }
  cache = parsed
  return cache
}

export function getData(): AppData {
  return load()
}

export function save(data: AppData): void {
  cache = data
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

export function mutate(fn: (d: AppData) => void): AppData {
  const d = load()
  fn(d)
  save(d)
  return d
}
