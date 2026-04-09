import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDaysInMonth,
  getYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear
} from 'date-fns'
import { normalizePlanetStyleId } from './galaxyStats'

export type ExhibitionTimeGrain = 'day' | 'week' | 'month' | 'year'

export type SessionForExhibition = {
  startedAt: string
  actualMinutes: number
  stardustEarned?: number
  planetStyleId?: string
}

export type BarBucket = {
  key: string
  label: string
  value: number
}

export function periodRange(
  grain: ExhibitionTimeGrain,
  cursor: Date
): { start: Date; end: Date } {
  switch (grain) {
    case 'day':
      return { start: startOfDay(cursor), end: endOfDay(cursor) }
    case 'week':
      return {
        start: startOfWeek(cursor, { weekStartsOn: 1 }),
        end: endOfWeek(cursor, { weekStartsOn: 1 })
      }
    case 'month':
      return { start: startOfMonth(cursor), end: endOfMonth(cursor) }
    case 'year':
      return { start: startOfYear(cursor), end: endOfYear(cursor) }
  }
}

export function shiftPeriodCursor(
  grain: ExhibitionTimeGrain,
  cursor: Date,
  delta: -1 | 1
): Date {
  switch (grain) {
    case 'day':
      return addDays(cursor, delta)
    case 'week':
      return addWeeks(cursor, delta)
    case 'month':
      return addMonths(cursor, delta)
    case 'year':
      return addYears(cursor, delta)
  }
}

export function formatPeriodLabel(grain: ExhibitionTimeGrain, cursor: Date): string {
  switch (grain) {
    case 'day':
      return format(cursor, 'EEEE, MMM d, yyyy')
    case 'week': {
      const { start, end } = periodRange('week', cursor)
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    }
    case 'month':
      return format(cursor, 'MMMM yyyy')
    case 'year':
      return format(cursor, 'yyyy')
  }
}

function sessionStartedInRange(s: SessionForExhibition, start: Date, end: Date): boolean {
  const t = new Date(s.startedAt).getTime()
  if (Number.isNaN(t)) return false
  return t >= start.getTime() && t <= end.getTime()
}

function sessionActualMinutes(s: SessionForExhibition): number {
  const n = Number(s.actualMinutes)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

function sumMinutes(
  sessions: SessionForExhibition[],
  start: Date,
  end: Date
): number {
  let m = 0
  for (const s of sessions) {
    if (sessionStartedInRange(s, start, end)) {
      m += sessionActualMinutes(s)
    }
  }
  return m
}

function sumStardust(
  sessions: SessionForExhibition[],
  start: Date,
  end: Date
): number {
  let d = 0
  for (const s of sessions) {
    if (sessionStartedInRange(s, start, end)) {
      d += Math.max(0, s.stardustEarned ?? 0)
    }
  }
  return d
}

export function aggregatePeriodTotals(
  sessions: SessionForExhibition[],
  start: Date,
  end: Date
): { focusMinutes: number; stardust: number } {
  return {
    focusMinutes: sumMinutes(sessions, start, end),
    stardust: sumStardust(sessions, start, end)
  }
}

export function buildBarBuckets(
  grain: ExhibitionTimeGrain,
  periodStart: Date,
  periodEnd: Date,
  sessions: SessionForExhibition[]
): BarBucket[] {
  switch (grain) {
    case 'day': {
      const dayStart = startOfDay(periodStart)
      const buckets: BarBucket[] = []
      for (let h = 0; h < 24; h++) {
        const a = new Date(dayStart)
        a.setHours(h, 0, 0, 0)
        const b = new Date(dayStart)
        b.setHours(h, 59, 59, 999)
        buckets.push({
          key: `h${h}`,
          label: format(a, 'ha').replace(' ', ''),
          value: sumMinutes(sessions, a, b)
        })
      }
      return buckets
    }
    case 'week': {
      const days = eachDayOfInterval({ start: periodStart, end: periodEnd })
      return days.map((d) => {
        const s = startOfDay(d)
        const e = endOfDay(d)
        return {
          key: format(d, 'yyyy-MM-dd'),
          label: format(d, 'EEE'),
          value: sumMinutes(sessions, s, e)
        }
      })
    }
    case 'month': {
      const y = periodStart.getFullYear()
      const mo = periodStart.getMonth()
      const n = getDaysInMonth(periodStart)
      const buckets: BarBucket[] = []
      for (let day = 1; day <= n; day++) {
        const d = new Date(y, mo, day)
        const s = startOfDay(d)
        const e = endOfDay(d)
        buckets.push({
          key: format(d, 'yyyy-MM-dd'),
          label: String(day),
          value: sumMinutes(sessions, s, e)
        })
      }
      return buckets
    }
    case 'year': {
      const y = getYear(periodStart)
      const buckets: BarBucket[] = []
      for (let m = 0; m < 12; m++) {
        const s = startOfMonth(new Date(y, m, 1))
        const e = endOfMonth(s)
        buckets.push({
          key: `${y}-${m}`,
          label: format(s, 'MMM'),
          value: sumMinutes(sessions, s, e)
        })
      }
      return buckets
    }
  }
}

export type PlanetFrequencyRow = {
  planetId: string
  label: string
  image: string
  sessionCount: number
  minutes: number
}

export function topPlanetsInPeriod(
  sessions: SessionForExhibition[],
  start: Date,
  end: Date,
  planetCatalog: { id: string; label: string; image: string }[],
  topN: number
): PlanetFrequencyRow[] {
  const map = new Map<string, { count: number; minutes: number }>()
  for (const s of sessions) {
    if (!sessionStartedInRange(s, start, end)) continue
    const id = normalizePlanetStyleId(s.planetStyleId)
    const cur = map.get(id) ?? { count: 0, minutes: 0 }
    cur.count += 1
    cur.minutes += sessionActualMinutes(s)
    map.set(id, cur)
  }
  const rows: PlanetFrequencyRow[] = []
  for (const [planetId, v] of map) {
    const meta = planetCatalog.find((p) => p.id === planetId)
    rows.push({
      planetId,
      label: meta?.label ?? planetId,
      image: meta?.image ?? '',
      sessionCount: v.count,
      minutes: v.minutes
    })
  }
  rows.sort((a, b) => b.sessionCount - a.sessionCount || b.minutes - a.minutes)
  return rows.slice(0, topN)
}
