import { format, parseISO, startOfDay } from 'date-fns'
import { useMemo } from 'react'
import { StardustGlyph } from '../components/StardustGlyph'
import { useAppData } from '../context/DataContext'

interface SessionRow {
  id: string
  startedAt: string
  endedAt?: string
  tagId: string
  plannedMinutes: number
  actualMinutes: number
  hardcore: boolean
  completedFullDuration: boolean
  exitedEarly: boolean
  overtimeMinutes?: number
  stardustEarned: number
}

function isSessionComplete(s: SessionRow): boolean {
  return s.completedFullDuration && !s.exitedEarly
}

/** Semicircle arc stroke length for radius r (half circumference). */
function semiArcLen(r: number): number {
  return Math.PI * r
}

function donutSector(cx: number, cy: number, rOut: number, rIn: number, a0: number, a1: number): string {
  const x0o = cx + rOut * Math.cos(a0)
  const y0o = cy + rOut * Math.sin(a0)
  const x1o = cx + rOut * Math.cos(a1)
  const y1o = cy + rOut * Math.sin(a1)
  const x0i = cx + rIn * Math.cos(a0)
  const y0i = cy + rIn * Math.sin(a0)
  const x1i = cx + rIn * Math.cos(a1)
  const y1i = cy + rIn * Math.sin(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${x0o} ${y0o} A ${rOut} ${rOut} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rIn} ${rIn} 0 ${large} 0 ${x0i} ${y0i} Z`
}

type DonutSlice = {
  id: string
  name: string
  minutes: number
  colorIndex: number
  a0: number
  a1: number
}

function HistoryTagDonut({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const cx = 0
  const cy = 0
  const rOut = 72
  const rIn = 44
  if (total <= 0 || slices.length === 0) {
    return <p className="history-donut__empty">No tag data yet</p>
  }
  return (
    <div className="history-donut-wrap">
      <div className="history-donut-chart">
        <svg className="history-donut" viewBox="-90 -90 180 180" role="img" aria-label="Focus time by tag">
          {slices.length === 1 ? (
            <path
              className={`history-donut__slice history-donut-color-${slices[0]!.colorIndex % 7}`}
              d={donutSector(cx, cy, rOut, rIn, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI)}
            />
          ) : (
            slices.map((s) => (
              <path
                key={s.id}
                className={`history-donut__slice history-donut-color-${s.colorIndex % 7}`}
                d={donutSector(cx, cy, rOut, rIn, s.a0, s.a1)}
              />
            ))
          )}
        </svg>
      </div>
      <ul className="history-donut-legend">
        {slices.map((s) => (
          <li key={s.id}>
            <span className={`history-donut-legend__swatch history-donut-color-${s.colorIndex % 7}`} aria-hidden />
            <span className="history-donut-legend__name" title={s.name}>
              {s.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TodaySemicircleGauge({ progress, minutesLabel }: { progress: number; minutesLabel: string }) {
  const r = 78
  const cx = 100
  const cy = 100
  const len = semiArcLen(r)
  const dash = Math.max(0, Math.min(1, progress)) * len
  return (
    <div className="history-gauge">
      <svg className="history-gauge__svg" viewBox="0 0 200 118" aria-hidden>
        <path
          className="history-gauge__track"
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={len}
        />
        <path
          className="history-gauge__fill"
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={len}
          strokeDasharray={`${dash} ${len}`}
        />
      </svg>
      <div className="history-gauge__labels">
        <span className="history-gauge__value">{minutesLabel}</span>
        <span className="history-gauge__sub">Focused Today</span>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { data } = useAppData()

  const {
    byDay,
    dayKeys,
    totalStardustEarned,
    gaugeProgress,
    todayLabel,
    donutSlices,
    donutTotal,
    donutColorByTagId
  } = useMemo(() => {
    if (!data) {
      return {
        byDay: new Map<string, SessionRow[]>(),
        dayKeys: [] as string[],
        totalStardustEarned: 0,
        gaugeProgress: 0,
        todayLabel: '0m',
        donutSlices: [] as DonutSlice[],
        donutTotal: 0,
        donutColorByTagId: new Map<string, number>()
      }
    }

    const rows = [...(data.sessions as SessionRow[])].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )

    const byDayMap = new Map<string, SessionRow[]>()
    for (const s of rows) {
      const d = startOfDay(parseISO(s.startedAt))
      const key = format(d, 'yyyy-MM-dd')
      const list = byDayMap.get(key) ?? []
      list.push(s)
      byDayMap.set(key, list)
    }
    const keys = [...byDayMap.keys()].sort((a, b) => b.localeCompare(a))

    const earned = rows.reduce((sum, s) => sum + (s.stardustEarned ?? 0), 0)

    const todayStart = startOfDay(new Date())
    let todayMin = 0
    for (const s of rows) {
      if (startOfDay(parseISO(s.startedAt)).getTime() === todayStart.getTime()) {
        todayMin += Math.max(0, s.actualMinutes)
      }
    }
    const dayMinutes = 24 * 60
    const progress = dayMinutes > 0 ? Math.min(1, todayMin / dayMinutes) : 0
    const tLabel =
      todayMin >= 60
        ? `${(todayMin / 60).toFixed(todayMin % 60 === 0 ? 0 : 1)}h`
        : `${Math.round(todayMin * 10) / 10}m`

    const tagMinutes = new Map<string, number>()
    for (const s of rows) {
      const prev = tagMinutes.get(s.tagId) ?? 0
      tagMinutes.set(s.tagId, prev + Math.max(0, s.actualMinutes))
    }
    const entries = [...tagMinutes.entries()]
      .map(([id, minutes]) => {
        const tag = data.tags.find((t) => t.id === id)
        return { id, name: tag?.name ?? id, minutes }
      })
      .filter((e) => e.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)

    const totalMin = entries.reduce((s, e) => s + e.minutes, 0)
    const TOP_N = 4
    type ChartRow = { id: string; name: string; minutes: number; colorIndex: number }
    let chartRows: ChartRow[] = []
    if (totalMin > 0) {
      if (entries.length <= TOP_N) {
        chartRows = entries.map((e, i) => ({
          id: e.id,
          name: e.name,
          minutes: e.minutes,
          colorIndex: i
        }))
      } else {
        const top = entries.slice(0, TOP_N)
        const othersMin = entries.slice(TOP_N).reduce((acc, e) => acc + e.minutes, 0)
        chartRows = [
          ...top.map((e, i) => ({
            id: e.id,
            name: e.name,
            minutes: e.minutes,
            colorIndex: i
          })),
          ...(othersMin > 0
            ? ([{ id: '__others__', name: 'Others', minutes: othersMin, colorIndex: 5 }] as ChartRow[])
            : [])
        ]
      }
    }
    let angle = -Math.PI / 2
    const slices: DonutSlice[] = chartRows.map((e) => {
      const frac = totalMin > 0 ? e.minutes / totalMin : 0
      const a0 = angle
      angle += frac * 2 * Math.PI
      const a1 = angle
      return {
        id: e.id,
        name: e.name,
        minutes: e.minutes,
        colorIndex: e.colorIndex,
        a0,
        a1
      }
    })
    const colorByTagId = new Map<string, number>()
    if (entries.length <= TOP_N) {
      entries.forEach((e, i) => colorByTagId.set(e.id, i))
    } else {
      entries.slice(0, TOP_N).forEach((e, i) => colorByTagId.set(e.id, i))
      entries.slice(TOP_N).forEach((e) => colorByTagId.set(e.id, 5))
    }

    return {
      byDay: byDayMap,
      dayKeys: keys,
      totalStardustEarned: earned,
      gaugeProgress: progress,
      todayLabel: tLabel,
      donutSlices: slices,
      donutTotal: totalMin,
      donutColorByTagId: colorByTagId
    }
  }, [data])

  if (!data) return <p>Loading…</p>

  const fmtStardust = (n: number) => n.toLocaleString()

  return (
    <div className="history-page app-ui-text">
      <h1 className="history-page__title">History</h1>

      <section className="history-dashboard" aria-label="Focus summary">
        <article className="history-dash-card history-dash-card--stardust">
          <div className="history-dash-card__text">
            <p className="history-dash-card__label">Total Stardust Balance</p>
            <p className="history-dash-card__value history-dash-card__value--gold">{fmtStardust(data.stardust)}</p>
            <p className="history-dash-card__hint">Stardust</p>
            <p className="history-dash-card__meta">Lifetime earned from sessions: {fmtStardust(totalStardustEarned)}</p>
          </div>
          <div className="history-dash-card__icon" aria-hidden>
            <StardustGlyph variant="hero" className="history-star-icon" />
          </div>
        </article>

        <article className="history-dash-card history-dash-card--gauge">
          <p className="history-dash-card__label">Today&apos;s Total Focus Time</p>
          <TodaySemicircleGauge progress={gaugeProgress} minutesLabel={todayLabel} />
        </article>

        <article className="history-dash-card history-dash-card--donut">
          <p className="history-dash-card__label">Focus Tag Distribution</p>
          <HistoryTagDonut slices={donutSlices} total={donutTotal} />
        </article>
      </section>

      <section className="history-sessions" aria-label="Sessions by day">
        {dayKeys.length === 0 && (
          <p className="history-sessions__empty">No sessions recorded yet.</p>
        )}
        {dayKeys.map((dayKey) => {
          const dayDate = parseISO(`${dayKey}T12:00:00`)
          const heading = format(dayDate, 'MMMM do, yyyy')
          const sessions = byDay.get(dayKey) ?? []
          return (
            <div key={dayKey} className="history-day">
              <div className="history-day__header">
                <h2 className="history-day__title">{heading}</h2>
                <span className="history-day__rule" aria-hidden />
              </div>
              <div className="history-day__grid">
                {sessions.map((s) => {
                  const tag = data.tags.find((t) => t.id === s.tagId)
                  const tagName = tag?.name ?? s.tagId
                  const complete = isSessionComplete(s)
                  const donutColorIndex = donutColorByTagId.get(s.tagId) ?? 6
                  const barClass = complete
                    ? `history-session__bar history-donut-color-${donutColorIndex % 7}`
                    : 'history-session__bar'
                  const actualStr = `${Math.round(s.actualMinutes * 10) / 10}m`
                  const startStr = format(parseISO(s.startedAt), 'HH:mm')
                  const dust = s.stardustEarned ?? 0
                  return (
                    <article key={s.id} className="history-session">
                      <div className={barClass} style={complete ? undefined : { backgroundColor: '#64748b' }} aria-hidden />
                      <div className="history-session__body">
                        <div className="history-session__row history-session__row--top">
                          <div>
                            <p className="history-session__micro">Actual Duration</p>
                            <p className="history-session__duration">{actualStr}</p>
                          </div>
                          <div className="history-session__top-right">
                            <span
                              className={`history-session__badge history-donut-color-${donutColorIndex % 7}`}
                            >
                              {tagName}
                            </span>
                            <span className="history-session__dust" title="Stardust earned">
                              <span className="history-session__dust-val">+{fmtStardust(dust)}</span>
                              <StardustGlyph variant="inline" className="history-session__dust-star" />
                            </span>
                          </div>
                        </div>
                        <div className="history-session__row history-session__row--bottom">
                          <span className="history-session__meta">Start Time: {startStr}</span>
                          <span className="history-session__meta">Planned: {s.plannedMinutes}m</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
