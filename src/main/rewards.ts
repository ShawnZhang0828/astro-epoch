import { HIDDEN_ACHIEVEMENTS } from './catalog'
import type { AppData, FocusSession, Tag } from './types'

const BASE_PER_MINUTE = 10
const COMPLETION_BONUS_RATIO = 0.2
const ENDURANCE_BONUS_CHANCE = 0.35
const ENDURANCE_BONUS_AMOUNT = 45

export interface RewardInput {
  plannedMinutes: number
  actualMinutes: number
  hardcore: boolean
  tag: Tag | undefined
  equippedOrbiterKeys: string[]
}

export function computeSessionRewards(input: RewardInput): {
  stardust: number
  completedFullDuration: boolean
  exitedEarly: boolean
  overtimeMinutes: number
  enduranceBonus: number
} {
  const { plannedMinutes, actualMinutes, hardcore, tag, equippedOrbiterKeys } = input
  const planned = Math.max(1, plannedMinutes)
  const actual = Math.max(0, actualMinutes)
  const completedFullDuration = actual >= planned - 1e-6
  const exitedEarly = actual < planned - 1e-6
  const overtimeMinutes = Math.max(0, actual - planned)

  if (hardcore && exitedEarly) {
    return {
      stardust: 0,
      completedFullDuration: false,
      exitedEarly: true,
      overtimeMinutes: 0,
      enduranceBonus: 0
    }
  }

  let rate = BASE_PER_MINUTE
  if (equippedOrbiterKeys.includes('logic_bonus') && tag?.kind === 'programming') {
    rate *= 1.05
  }

  const focusMinutes = Math.min(actual, planned)
  let stardust = focusMinutes * rate

  if (completedFullDuration) {
    stardust += planned * rate * COMPLETION_BONUS_RATIO
  } else {
    stardust = actual * rate
  }

  stardust += overtimeMinutes * rate

  let enduranceBonus = 0
  if (
    equippedOrbiterKeys.includes('endurance_drop') &&
    actual >= 60 &&
    completedFullDuration &&
    Math.random() < ENDURANCE_BONUS_CHANCE
  ) {
    enduranceBonus = ENDURANCE_BONUS_AMOUNT
    stardust += enduranceBonus
  }

  if (hardcore && completedFullDuration) {
    stardust *= 2
  }

  return {
    stardust: Math.round(stardust),
    completedFullDuration,
    exitedEarly,
    overtimeMinutes,
    enduranceBonus
  }
}

export function defaultTagMinutes(data: AppData): number {
  const def = data.defaultTagId
  return data.sessions
    .filter((s) => s.tagId === def)
    .reduce((a, s) => a + s.actualMinutes, 0)
}

export function updateStreak(data: AppData, sessionDate: string): void {
  const today = sessionDate.slice(0, 10)
  const last = data.lastStreakDate
  if (!last) {
    data.streakDays = 1
    data.lastStreakDate = today
    return
  }
  const lastDay = last.slice(0, 10)
  if (lastDay === today) {
    return
  }
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const y = yesterday.toISOString().slice(0, 10)
  if (lastDay === y) {
    data.streakDays += 1
  } else {
    data.streakDays = 1
  }
  data.lastStreakDate = today
}

export function checkAchievements(
  data: AppData,
  session: FocusSession
): { newlyUnlocked: (typeof HIDDEN_ACHIEVEMENTS)[number][] } {
  const newly: (typeof HIDDEN_ACHIEVEMENTS)[number][] = []
  const has = (id: string) => data.achievementsUnlocked.includes(id)
  const grant = (id: string, planetId: string) => {
    if (has(id)) return
    data.achievementsUnlocked.push(id)
    if (!data.rarePlanetsUnlocked.includes(planetId)) {
      data.rarePlanetsUnlocked.push(planetId)
    }
    const meta = HIDDEN_ACHIEVEMENTS.find((a) => a.id === id)
    if (meta) newly.push(meta)
  }

  if (data.streakDays >= 7) {
    const a = HIDDEN_ACHIEVEMENTS.find((x) => x.id === 'ach_streak_7')
    if (a && !has(a.id)) grant(a.id, a.rarePlanetId)
  }

  if (defaultTagMinutes(data) >= 100 * 60) {
    const a = HIDDEN_ACHIEVEMENTS.find((x) => x.id === 'ach_default_100h')
    if (a && !has(a.id)) grant(a.id, a.rarePlanetId)
  }

  data.totalOvertimeMinutes = (data.totalOvertimeMinutes || 0) + session.overtimeMinutes
  if (data.totalOvertimeMinutes >= 120) {
    const a = HIDDEN_ACHIEVEMENTS.find((x) => x.id === 'ach_overtime_120')
    if (a && !has(a.id)) grant(a.id, a.rarePlanetId)
  }

  return { newlyUnlocked: newly }
}
