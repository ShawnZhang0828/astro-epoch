import type { BarBucket, ExhibitionTimeGrain, PlanetFrequencyRow } from './exhibitionPeriodStats'

const GRAIN_LABELS: Record<ExhibitionTimeGrain, string> = {
  day: 'Hours in this day',
  week: 'Days this week',
  month: 'Days this month',
  year: 'Months this year'
}

function ExhibitionFocusBarChart({ grain, buckets }: { grain: ExhibitionTimeGrain; buckets: BarBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.value))
  return (
    <div className="exhibition-exo-bars">
      <p className="exhibition-exo-bars__title">{GRAIN_LABELS[grain]}</p>
      <div
        className={`exhibition-exo-bars__chart exhibition-exo-bars__chart--${grain}`}
        role="img"
        aria-label={`Focus minutes: ${buckets.map((b) => `${b.label} ${b.value}`).join(', ')}`}
      >
        {buckets.map((b) => (
          <div key={b.key} className="exhibition-exo-bars__cell">
            <div className="exhibition-exo-bars__track" title={`${b.label}: ${Math.round(b.value)} min`}>
              <div
                className="exhibition-exo-bars__fill"
                style={{ height: `${(b.value / max) * 100}%` }}
              />
            </div>
            <span className="exhibition-exo-bars__tick">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExhibitionTopPlanets({ rows }: { rows: PlanetFrequencyRow[] }) {
  const maxFreq = Math.max(1, ...rows.map((r) => r.sessionCount))
  return (
    <div className="exhibition-exo-top">
      <p className="exhibition-exo-top__title">Top planets</p>
      <ul className="exhibition-exo-top__list">
        {rows.map((r) => (
          <li key={r.planetId} className="exhibition-exo-top__row">
            <div className="exhibition-exo-top__icon-wrap">
              {r.image ? (
                <img src={r.image} alt="" className="exhibition-exo-top__icon" />
              ) : (
                <span className="exhibition-exo-top__icon-fallback" aria-hidden>
                  ?
                </span>
              )}
            </div>
            <div className="exhibition-exo-top__meta">
              <span className="exhibition-exo-top__name">{r.label}</span>
              <div className="exhibition-exo-top__bar-track">
                <div
                  className="exhibition-exo-top__bar-fill"
                  style={{ width: `${(r.sessionCount / maxFreq) * 100}%` }}
                />
              </div>
            </div>
            <span className="exhibition-exo-top__freq">{r.sessionCount}</span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="exhibition-exo-top__empty">No sessions in this period.</p>}
    </div>
  )
}

export function ExhibitionExoAnalytics({
  grain,
  buckets,
  topPlanets
}: {
  grain: ExhibitionTimeGrain
  buckets: BarBucket[]
  topPlanets: PlanetFrequencyRow[]
}) {
  return (
    <div className="exhibition-exo-analytics">
      <ExhibitionFocusBarChart grain={grain} buckets={buckets} />
      <ExhibitionTopPlanets rows={topPlanets} />
    </div>
  )
}
