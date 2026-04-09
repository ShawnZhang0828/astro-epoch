import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays
} from 'date-fns'
import { useMemo } from 'react'
import { useAppData } from '../context/DataContext'

type S = { startedAt: string; actualMinutes: number; tagId: string }

function rmin(m: number): number {
  return Math.round(m)
}

function pieWedge(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + r * Math.cos(start)
  const y1 = cy + r * Math.sin(start)
  const x2 = cx + r * Math.cos(end)
  const y2 = cy + r * Math.sin(end)
  const large = end - start > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

type DailyPoint = { label: string; minutes: number }

function DailyLineChart({ daily }: { daily: DailyPoint[] }) {
  const w = 360
  const h = 152
  const padL = 36
  const padR = 12
  const padT = 14
  const padB = 36
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = Math.max(1, ...daily.map((d) => d.minutes))
  const n = daily.length
  const coords = daily.map((d, i) => {
    const x = n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW
    const y = padT + innerH - (d.minutes / maxY) * innerH
    return { x, y, ...d }
  })
  const lineD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD =
    coords.length > 0
      ? `${lineD} L ${coords[coords.length - 1].x} ${padT + innerH} L ${coords[0].x} ${padT + innerH} Z`
      : ''

  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padT + innerH * (1 - t),
    label: `${Math.round(maxY * t)}`
  }))

  return (
    <svg className="analytics-line-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Focus minutes per day, last 7 days">
      {gridY.map((g) => (
        <g key={g.label}>
          <line
            className="analytics-line-chart__grid"
            x1={padL}
            x2={w - padR}
            y1={g.y}
            y2={g.y}
          />
          <text className="analytics-line-chart__axis" x={padL - 6} y={g.y + 4} textAnchor="end">
            {g.label}
          </text>
        </g>
      ))}
      {areaD && <path className="analytics-line-chart__area" d={areaD} />}
      {coords.length > 0 && <path className="analytics-line-chart__line" d={lineD} fill="none" />}
      {coords.map((p) => (
        <circle key={p.label} className="analytics-line-chart__dot" cx={p.x} cy={p.y} r={4} />
      ))}
      {coords.map((p) => (
        <text key={`${p.label}-x`} className="analytics-line-chart__xlabel" x={p.x} y={h - 8} textAnchor="middle">
          {p.label}
        </text>
      ))}
    </svg>
  )
}

type PieSlice = {
  id: string
  name: string
  min: number
  frac: number
  startAngle: number
  endAngle: number
}

function TagPieChart({ slices, total }: { slices: PieSlice[]; total: number }) {
  const cx = 0
  const cy = 0
  const r = 88
  if (total <= 0 || slices.length === 0) {
    return <p className="analytics-pie__empty">No sessions yet</p>
  }
  return (
    <div className="analytics-pie-wrap">
      <svg className="analytics-pie" viewBox="-100 -100 200 200" role="img" aria-label="Focus time by tag">
        {slices.length === 1 ? (
          <circle className="analytics-pie__slice analytics-pie-color-0" cx={cx} cy={cy} r={r} />
        ) : (
          slices.map((s, i) => (
            <path
              key={s.id}
              className={`analytics-pie__slice analytics-pie-color-${i % 7}`}
              d={pieWedge(cx, cy, r, s.startAngle, s.endAngle)}
            />
          ))
        )}
      </svg>
      <ul className="analytics-pie-legend">
        {slices.map((s, i) => (
          <li key={s.id}>
            <span className={`analytics-pie-legend__swatch analytics-pie-color-${i % 7}`} aria-hidden />
            <span className="analytics-pie-legend__name">{s.name}</span>
            <span className="analytics-pie-legend__val">
              {s.min} min ({Math.round(s.frac * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeltaTrendIcon({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'flat') {
    return (
      <svg className="analytics-compare__delta-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          d="M6 12h12"
        />
      </svg>
    )
  }
  return (
    <svg className="analytics-compare__delta-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      {dir === 'up' ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 19V5M5 12l7-7 7 7"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 5v14M19 12l-7 7-7-7"
        />
      )}
    </svg>
  )
}

function splitHoursMinutes(total: number): { h: number; m: number } {
  return { h: Math.floor(total / 60), m: total % 60 }
}

function CompareAmount({ minutes, showHours }: { minutes: number; showHours: boolean }) {
  if (!showHours) {
    return (
      <div className="analytics-compare__amount">
        <span className="analytics-compare__value">{minutes}</span>
        <span className="analytics-compare__unit">min</span>
      </div>
    )
  }
  const { h, m } = splitHoursMinutes(minutes)
  return (
    <div className="analytics-compare__time-stack" aria-label={`${h} hours ${m} minutes`}>
      <span className="analytics-compare__value analytics-compare__value--hour">{h}</span>
      <span className="analytics-compare__unit analytics-compare__unit--hour">h</span>
      <span className="analytics-compare__value analytics-compare__value--min">{m}</span>
      <span className="analytics-compare__unit">min</span>
    </div>
  )
}

function ComparePair({
  leftVal,
  leftLabel,
  rightVal,
  rightLabel,
  delta,
  deltaSuffix = 'minutes'
}: {
  leftVal: number
  leftLabel: string
  rightVal: number
  rightLabel: string
  delta?: number
  deltaSuffix?: string
}) {
  const deltaDir = delta === undefined ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const deltaAbs = delta === undefined ? 0 : Math.abs(delta)
  const deltaPhrase = `${deltaAbs} ${deltaAbs === 1 ? deltaSuffix.replace(/s$/, '') : deltaSuffix}`
  const showHours = Math.max(leftVal, rightVal) > 60

  return (
    <div className="analytics-compare">
      <div
        className={
          showHours
            ? 'analytics-compare__grid analytics-compare__grid--with-hours'
            : 'analytics-compare__grid'
        }
      >
        <div className="analytics-compare__split-cell">
          <CompareAmount minutes={leftVal} showHours={showHours} />
          <span className="analytics-compare__caption">{leftLabel}</span>
        </div>
        <span className="analytics-compare__vs" aria-hidden>
          vs
        </span>
        <div className="analytics-compare__split-cell">
          <CompareAmount minutes={rightVal} showHours={showHours} />
          <span className="analytics-compare__caption">{rightLabel}</span>
        </div>
      </div>
      {delta !== undefined && deltaDir !== null && (
        <p
          className={[
            'analytics-compare__delta',
            delta > 0 && 'analytics-compare__delta--up',
            delta < 0 && 'analytics-compare__delta--down'
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <DeltaTrendIcon dir={deltaDir} />
          <span className="analytics-compare__delta-text">{deltaPhrase}</span>
        </p>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data } = useAppData()
  const sessions = (data?.sessions ?? []) as S[]

  const now = new Date()

  const daily = useMemo(() => {
    const start = startOfDay(subDays(now, 6))
    const days = eachDayOfInterval({ start, end: now })
    return days.map((d) => {
      const ds = startOfDay(d).getTime()
      const de = endOfDay(d).getTime()
      const m = sessions
        .filter((s) => {
          const t = new Date(s.startedAt).getTime()
          return t >= ds && t <= de
        })
        .reduce((a, s) => a + s.actualMinutes, 0)
      return { label: format(d, 'EEE'), minutes: rmin(m) }
    })
  }, [sessions, now])

  const thisWeek = useMemo(() => {
    const ws = startOfWeek(now, { weekStartsOn: 1 })
    const we = endOfWeek(now, { weekStartsOn: 1 })
    return sessions
      .filter((s) => {
        const t = new Date(s.startedAt)
        return t >= ws && t <= we
      })
      .reduce((a, s) => a + s.actualMinutes, 0)
  }, [sessions, now])

  const prevWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 })
  const prevWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 })
  const prevWeek = useMemo(() => {
    return sessions
      .filter((s) => {
        const t = new Date(s.startedAt)
        return t >= prevWeekStart && t <= prevWeekEnd
      })
      .reduce((a, s) => a + s.actualMinutes, 0)
  }, [sessions, prevWeekStart, prevWeekEnd])

  const thisMonth = useMemo(() => {
    const ms = startOfMonth(now)
    const me = endOfMonth(now)
    return sessions
      .filter((s) => {
        const t = new Date(s.startedAt)
        return t >= ms && t <= me
      })
      .reduce((a, s) => a + s.actualMinutes, 0)
  }, [sessions, now])

  const prevMonthDate = subDays(startOfMonth(now), 1)
  const prevMonth = useMemo(() => {
    const ms = startOfMonth(prevMonthDate)
    const me = endOfMonth(prevMonthDate)
    return sessions
      .filter((s) => {
        const t = new Date(s.startedAt)
        return t >= ms && t <= me
      })
      .reduce((a, s) => a + s.actualMinutes, 0)
  }, [sessions, prevMonthDate])

  const todayStart = startOfDay(now).getTime()
  const todayEnd = endOfDay(now).getTime()
  const yStart = startOfDay(subDays(now, 1)).getTime()
  const yEnd = endOfDay(subDays(now, 1)).getTime()

  const todayM = sessions
    .filter((s) => {
      const t = new Date(s.startedAt).getTime()
      return t >= todayStart && t <= todayEnd
    })
    .reduce((a, s) => a + s.actualMinutes, 0)

  const yM = sessions
    .filter((s) => {
      const t = new Date(s.startedAt).getTime()
      return t >= yStart && t <= yEnd
    })
    .reduce((a, s) => a + s.actualMinutes, 0)

  const todayR = rmin(todayM)
  const yMR = rmin(yM)
  const thisWeekR = rmin(thisWeek)
  const prevWeekR = rmin(prevWeek)
  const thisMonthR = rmin(thisMonth)
  const prevMonthR = rmin(prevMonth)
  const deltaDay = rmin(todayM - yM)
  const deltaWeek = rmin(thisWeek - prevWeek)
  const deltaMonth = rmin(thisMonth - prevMonth)

  const tagPie = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sessions) {
      map.set(s.tagId, (map.get(s.tagId) ?? 0) + s.actualMinutes)
    }
    const entries = [...map.entries()]
      .map(([id, min]) => ({
        id,
        name: data?.tags.find((t) => t.id === id)?.name ?? id,
        min: rmin(min)
      }))
      .filter((e) => e.min > 0)
      .sort((a, b) => b.min - a.min)
    const total = entries.reduce((a, e) => a + e.min, 0)
    if (total <= 0) {
      return { total: 0, slices: [] as PieSlice[] }
    }
    const topN = 6
    const top = entries.slice(0, topN)
    const topSum = top.reduce((a, e) => a + e.min, 0)
    const rest = total - topSum
    const raw =
      rest > 0 ? [...top, { id: '__other__', name: 'Other', min: rmin(rest) }] : top
    let angle = -Math.PI / 2
    const slices: PieSlice[] = raw.map((e) => {
      const frac = e.min / total
      const startAngle = angle
      angle += frac * 2 * Math.PI
      return { ...e, frac, startAngle, endAngle: angle }
    })
    return { total, slices }
  }, [sessions, data?.tags])

  if (!data) return <p>Loading…</p>

  return (
    <div className="analytics-page app-ui-text">
      <h1>Analytics</h1>
      <div className="analytics-grid">
        <div className="card analytics-card analytics-card--compare">
          <ComparePair
            leftVal={todayR}
            leftLabel="Today"
            rightVal={yMR}
            rightLabel="Yesterday"
            delta={deltaDay}
          />
        </div>
        <div className="card analytics-card analytics-card--compare">
          <ComparePair
            leftVal={thisWeekR}
            leftLabel="This week"
            rightVal={prevWeekR}
            rightLabel="Last week"
            delta={deltaWeek}
          />
        </div>
        <div className="card analytics-card analytics-card--compare">
          <ComparePair
            leftVal={thisMonthR}
            leftLabel="This month"
            rightVal={prevMonthR}
            rightLabel="Last month"
            delta={deltaMonth}
          />
        </div>
        <div className="card analytics-card analytics-card--compare analytics-card--single">
          <div className="analytics-compare analytics-compare--solo">
            <span className="analytics-compare__value analytics-compare__value--large">
              {rmin(data.totalOvertimeMinutes ?? 0)}
            </span>
            <span className="analytics-compare__unit">min</span>
            <p className="analytics-compare__solo-caption">Lifetime overtime beyond planned targets</p>
          </div>
        </div>
      </div>

      <div className="card analytics-card analytics-card--chart">
        <p className="analytics-chart-heading">Last 7 days (minutes per day)</p>
        <DailyLineChart daily={daily} />
      </div>

      <div className="card analytics-card analytics-card--tags">
        <p className="analytics-chart-heading">Focus by tag (all time)</p>
        <TagPieChart slices={tagPie.slices} total={tagPie.total} />
      </div>
    </div>
  )
}
