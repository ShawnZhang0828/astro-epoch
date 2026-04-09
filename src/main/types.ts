export type TagKind = 'programming' | 'writing' | 'research' | 'general'

export interface Tag {
  id: string
  name: string
  kind: TagKind
  createdAt: string
}

export interface FocusSession {
  id: string
  startedAt: string
  endedAt: string
  plannedMinutes: number
  actualMinutes: number
  tagId: string
  hardcore: boolean
  completedFullDuration: boolean
  exitedEarly: boolean
  stardustEarned: number
  breakStardustEarned?: number
  overtimeMinutes: number
  planetStyleId?: string
}

export interface AppSettings {
  hardcoreDefault: boolean
  monitoringEnabled: boolean
  whitelist: string[]
  blacklist: string[]
  lastPromptExe?: string
  lastPromptAt?: number
  lastBlacklistWarnAt?: number
  lastBlacklistWarnExe?: string
  /** Ambience played during focus when unlocked */
  activeAtmosphereKey?: string
  /** Last duration (minutes) chosen on the Focus page */
  lastFocusPlannedMinutes?: number
  /** Last tag chosen on the Focus page */
  lastFocusTagId?: string
  /** Last planet style chosen on the Focus page */
  lastFocusPlanetStyleId?: string
}

export interface AppData {
  version: 1
  stardust: number
  tags: Tag[]
  defaultTagId: string
  sessions: FocusSession[]
  purchasedItemIds: string[]
  equippedOrbiterIds: string[]
  unlockedPlanetIds: string[]
  unlockedAtmosphereIds: string[]
  activeThemeId: string
  settings: AppSettings
  achievementsUnlocked: string[]
  rarePlanetsUnlocked: string[]
  streakDays: number
  lastStreakDate?: string
  totalovertimeMinutes: number
  planetStyleId?: string
}

export const DEFAULT_WHITELIST = [
  'code',
  'cursor',
  'devenv',
  'idea64',
  'rider',
  'webstorm',
  'winword',
  'excel',
  'powerpnt',
  'notion',
  'obsidian',
  'wt',
  'windowsterminal',
  'powershell',
  'cmd',
  'sublime_text',
  'notepad++'
]

export const DEFAULT_BLACKLIST = [
  'discord',
  'spotify',
  'steam',
  'epicgameslauncher',
  'battle.net',
  'riotclientservices',
  'slack' // optional distraction â??user can remove
]
