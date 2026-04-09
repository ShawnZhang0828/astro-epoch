import { useMemo, useState } from 'react'
import { useAppData } from '../context/DataContext'
import { ExhibitionExoAnalytics } from '../exhibition/ExhibitionExoAnalytics'
import { MilkyWayGalaxyOverview, SolarStardustOverview } from '../exhibition/ExhibitionMaps'
import {
  aggregatePeriodTotals,
  buildBarBuckets,
  formatPeriodLabel,
  periodRange,
  shiftPeriodCursor,
  topPlanetsInPeriod,
  type ExhibitionTimeGrain,
  type SessionForExhibition
} from '../exhibition/exhibitionPeriodStats'
import { ExoplanetSystemOverview, type ExhibitionExoView } from '../exhibition/exoplanetOverviews'
import { aggregateGalaxyFromSessions } from '../exhibition/galaxyStats'
import { PLANET_OPTIONS } from '../planetCatalog'

type SessionRow = {
  startedAt: string
  actualMinutes: number
  stardustEarned?: number
  planetStyleId?: string
}

type ExhibitionMapView = 'milky_way' | 'solar_system' | ExhibitionExoView

const EXO_CRUMB: Record<ExhibitionExoView, string> = {
  exo_kepler_90: 'Kepler-90',
  exo_hd_10180: 'HD 10180',
  exo_trappist_1: 'TRAPPIST-1',
  exo_kepler_452: 'Kepler-452'
}

function isExoView(v: ExhibitionMapView): v is ExhibitionExoView {
  return v !== 'milky_way' && v !== 'solar_system'
}

function ArrowLeftIcon() {
  return (
    <svg
      className="exhibition-exo-period__arrow-svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      className="exhibition-exo-period__arrow-svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

const EXO_GRAINS: { id: ExhibitionTimeGrain; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' }
]

export default function ExhibitionPage() {
  const { data, refresh } = useAppData()
  const [mapView, setMapView] = useState<ExhibitionMapView>('milky_way')
  const [exoGrain, setExoGrain] = useState<ExhibitionTimeGrain>('week')
  const [exoCursor, setExoCursor] = useState(() => new Date())

  const orbitersOwned = useMemo(() => {
    if (!data) return []
    return data.purchasedItemIds.filter((id) => id.startsWith('orbiter-'))
  }, [data])

  const sessions = (data?.sessions ?? []) as SessionRow[]

  const galaxyAggregates = useMemo(() => {
    return aggregateGalaxyFromSessions(sessions)
  }, [sessions])

  const exoPeriod = useMemo(() => {
    const { start, end } = periodRange(exoGrain, exoCursor)
    const buckets = buildBarBuckets(exoGrain, start, end, sessions as SessionForExhibition[])
    const totals = aggregatePeriodTotals(sessions as SessionForExhibition[], start, end)
    const maxBar = Math.max(0, ...buckets.map((b) => b.value))
    const topPlanets = topPlanetsInPeriod(
      sessions as SessionForExhibition[],
      start,
      end,
      PLANET_OPTIONS,
      3
    )
    return {
      start,
      end,
      buckets,
      totals,
      explorationSlice: {
        focusMinutes: totals.focusMinutes,
        stardust: totals.stardust,
        maxFocusMinutes: Math.max(1, totals.focusMinutes, maxBar),
        maxStardust: Math.max(1, totals.stardust)
      },
      topPlanets,
      label: formatPeriodLabel(exoGrain, exoCursor)
    }
  }, [sessions, exoGrain, exoCursor])

  if (!data) return <p>Loading?</p>

  const solarMapProps = {
    aggregates: galaxyAggregates,
    unlockedPlanetIds: data.unlockedPlanetIds,
    rarePlanetsUnlocked: data.rarePlanetsUnlocked
  }

  const navBack = () => {
    if (mapView !== 'milky_way') setMapView('milky_way')
  }

  const crumbLabel =
    mapView === 'milky_way'
      ? 'Milky Way'
      : mapView === 'solar_system'
        ? 'Solar system'
        : EXO_CRUMB[mapView]

  const toggleOrbiter = async (id: string) => {
    const set = new Set(data.equippedOrbiterIds)
    if (set.has(id)) set.delete(id)
    else {
      if (set.size >= 2 && !set.has(id)) {
        const first = [...set][0]
        set.delete(first)
      }
      set.add(id)
    }
    await window.ae.equipOrbiters([...set])
    await refresh()
  }

  return (
    <div className="exhibition-page">
      <h1>Exhibition</h1>

      <div className="card exhibition-maps-unified">
        {mapView !== 'milky_way' && (
          <div className="exhibition-map-nav">
            <button type="button" className="btn exhibition-map-nav__back" onClick={navBack}>
              Milky Way
            </button>
            <span className="exhibition-map-nav__crumb">{crumbLabel}</span>
          </div>
        )}
        {mapView === 'milky_way' && (
          <MilkyWayGalaxyOverview
            aggregates={galaxyAggregates}
            onOpenSolar={() => setMapView('solar_system')}
            onOpenExoplanet={(v) => setMapView(v)}
          />
        )}
        {mapView === 'solar_system' && <SolarStardustOverview {...solarMapProps} />}
        {isExoView(mapView) && (
          <ExoplanetSystemOverview
            view={mapView}
            aggregates={galaxyAggregates}
            unlockedPlanetIds={data.unlockedPlanetIds}
            rarePlanetsUnlocked={data.rarePlanetsUnlocked}
            explorationSlice={exoPeriod.explorationSlice}
          />
        )}
      </div>

      <div className="card exhibition-period-explorer">
        <h2 style={{ marginTop: 0 }}>Exploration by period</h2>
        <p className="exhibition-period-explorer__intro">
          Focus time in each window uses sessions by <strong>start time</strong>. Open an exoplanet system above to see the
          schematic orbit use the same range.
        </p>
        <div className="exhibition-exo-period">
          <div className="exhibition-exo-period__grain">
            {EXO_GRAINS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={
                  'btn exhibition-exo-period__grain-btn' +
                  (exoGrain === g.id ? ' exhibition-exo-period__grain-btn--active' : '')
                }
                onClick={() => {
                  setExoGrain(g.id)
                  setExoCursor(new Date())
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="exhibition-exo-period__nav">
            <button
              type="button"
              className="btn exhibition-exo-period__arrow"
              aria-label="Previous period"
              onClick={() => setExoCursor((c) => shiftPeriodCursor(exoGrain, c, -1))}
            >
              <ArrowLeftIcon />
            </button>
            <span className="exhibition-exo-period__label">{exoPeriod.label}</span>
            <button
              type="button"
              className="btn exhibition-exo-period__arrow"
              aria-label="Next period"
              onClick={() => setExoCursor((c) => shiftPeriodCursor(exoGrain, c, 1))}
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>
        <ExhibitionExoAnalytics grain={exoGrain} buckets={exoPeriod.buckets} topPlanets={exoPeriod.topPlanets} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Orbiters</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orbitersOwned.map((id) => {
            const on = data.equippedOrbiterIds.includes(id)
            return (
              <li key={id} className="row" style={{ marginBottom: 8 }}>
                <span style={{ flex: 1 }}>{id.replace('orbiter-', '').replace(/-/g, ' ')}</span>
                <button type="button" className={on ? 'btn btn-primary' : 'btn'} onClick={() => void toggleOrbiter(id)}>
                  {on ? 'Unequip' : 'Equip'}
                </button>
              </li>
            )
          })}
          {orbitersOwned.length === 0 && <li style={{ color: 'var(--muted)' }}>Buy orbiters in Market.</li>}
        </ul>
      </div>
    </div>
  )
}
