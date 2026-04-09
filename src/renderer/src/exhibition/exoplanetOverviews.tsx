import { useEffect, useReducer, useRef } from 'react'
import type { GalaxyAggregates } from './galaxyStats'
import { heatIntensity } from './galaxyStats'
import type { ExhibitionExoView } from './exoTypes'
import { exoWorldsForView, EXO_WORLDS_BY_VIEW, sumExoSystemFocusMinutes, sumExoSystemStardust } from './exoPlanetBundles'
import { isPlanetUnlocked } from '../planetCatalog'

export type { ExhibitionExoView } from './exoTypes'

export type ExoMilkyMarker = {
  id: string
  x: number
  y: number
  label: string
  view: ExhibitionExoView
  thumb: string
}

export const EXO_MILKY_MARKERS: ExoMilkyMarker[] = [
  {
    id: 'exo-k90',
    x: 218,
    y: 76,
    label: 'Kepler-90',
    view: 'exo_kepler_90',
    thumb: EXO_WORLDS_BY_VIEW.exo_kepler_90[0]!.image
  },
  {
    id: 'exo-hd',
    x: 150,
    y: 50,
    label: 'HD 10180',
    view: 'exo_hd_10180',
    thumb: EXO_WORLDS_BY_VIEW.exo_hd_10180[0]!.image
  },
  {
    id: 'exo-t1',
    x: 248,
    y: 102,
    label: 'TRAPPIST-1',
    view: 'exo_trappist_1',
    thumb: EXO_WORLDS_BY_VIEW.exo_trappist_1[0]!.image
  },
  {
    id: 'exo-k452',
    x: 104,
    y: 142,
    label: 'Kepler-452',
    view: 'exo_kepler_452',
    thumb: EXO_WORLDS_BY_VIEW.exo_kepler_452[0]!.image
  }
]

type ExoConfig = {
  title: string
  hint: string
  starLabel: string
}

const EXO_CONFIG: Record<ExhibitionExoView, ExoConfig> = {
  exo_kepler_90: {
    title: 'Kepler-90',
    hint: 'Eight known planets in a compact, roughly coplanar system — a distant cousin of our own architecture.',
    starLabel: 'Kepler-90'
  },
  exo_hd_10180: {
    title: 'HD 10180',
    hint: 'Sun-like star with a rich pack of giant planets on long-period orbits — a heavyweight planetary family.',
    starLabel: 'HD 10180'
  },
  exo_trappist_1: {
    title: 'TRAPPIST-1',
    hint: 'Seven roughly Earth-sized worlds around an ultracool dwarf — tightly packed resonant chain.',
    starLabel: 'TRAPPIST-1'
  },
  exo_kepler_452: {
    title: 'Kepler-452',
    hint: 'Sun-like star with Kepler-452b in the habitable zone — often called an “Earth-cousin” candidate.',
    starLabel: 'Kepler-452'
  }
}

/** Same canvas and orbit math as `SolarStardustOverview` in ExhibitionMaps.tsx (wide 1000×560 schematic). */
const VIEW_W = 1000
const VIEW_H = 560
const SUN = { x: VIEW_W / 2, y: VIEW_H / 2 }
const SUN_RADIUS = 26
const PLANET_RADIUS = 17
const ORBIT_OUTER_PAD = 38
const ORBIT_FLATTEN = 0.46
const ORBIT_RADIUS_POWER = 0.48

const ORBIT_A_IN = SUN_RADIUS + 12 + PLANET_RADIUS
const ORBIT_A_OUT = Math.min(
  SUN.x - ORBIT_OUTER_PAD - PLANET_RADIUS,
  (SUN.y - ORBIT_OUTER_PAD - PLANET_RADIUS) / ORBIT_FLATTEN
)

function orbitSemiMajor(n: number, orbitIndex: number): number {
  if (n <= 1) return ORBIT_A_IN
  const t = orbitIndex / (n - 1)
  return ORBIT_A_IN + Math.pow(t, ORBIT_RADIUS_POWER) * (ORBIT_A_OUT - ORBIT_A_IN)
}

function bodyPos(rx: number, ry: number, angle: number) {
  return {
    x: SUN.x + Math.cos(angle) * rx,
    y: SUN.y + Math.sin(angle) * ry
  }
}

export type ExoExplorationSlice = {
  focusMinutes: number
  stardust: number
  maxFocusMinutes: number
  maxStardust: number
}

type Props = {
  view: ExhibitionExoView
  aggregates: GalaxyAggregates
  unlockedPlanetIds: string[]
  rarePlanetsUnlocked: string[]
  /** When set, planet heat and footer use this time-window slice instead of per-world aggregates. */
  explorationSlice?: ExoExplorationSlice | null
}

export function ExoplanetSystemOverview({
  view,
  aggregates,
  unlockedPlanetIds,
  rarePlanetsUnlocked,
  explorationSlice
}: Props) {
  const cfg = EXO_CONFIG[view]
  const worlds = exoWorldsForView(view)
  const n = worlds.length
  const useSlice = explorationSlice != null

  const dustTotal = useSlice
    ? explorationSlice.stardust
    : sumExoSystemStardust(view, aggregates)
  const focusTotal = useSlice
    ? explorationSlice.focusMinutes
    : sumExoSystemFocusMinutes(view, aggregates)

  const maxDust = useSlice
    ? Math.max(1, explorationSlice.maxStardust)
    : Math.max(1, dustTotal, aggregates.stardustMilkyWay)
  const maxFocus = useSlice
    ? Math.max(1, explorationSlice.maxFocusMinutes)
    : Math.max(
        1,
        ...worlds.map((w) => aggregates.focusMinutesByPlanetId[w.planetStyleId] ?? 0)
      )

  const maxDustPlanet = useSlice
    ? maxDust
    : Math.max(1, ...worlds.map((w) => aggregates.stardustByPlanetId[w.planetStyleId] ?? 0))

  const animTRef = useRef(0)
  const [, tick] = useReducer((c: number) => c + 1, 0)
  useEffect(() => {
    let id: number
    const loop = (now: number) => {
      animTRef.current = now / 1000
      tick()
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const tAnim = animTRef.current
  const phase = view === 'exo_trappist_1' ? 0.2 : view === 'exo_kepler_452' ? 1.1 : 0.55

  return (
    <div className="exhibition-map exhibition-map--exo-system">
      <h3 className="exhibition-map__title">{cfg.title}</h3>
      <p className="exhibition-map__hint">{cfg.hint}</p>
      <svg
        className="exhibition-map__svg exhibition-map__svg--solar-wide exhibition-exo-system-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`${cfg.title} schematic orbits`}
      >
        <defs>
          <radialGradient id={`exo-star-${view}`} cx="42%" cy="32%" r="58%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="32%" stopColor="#fde047" />
            <stop offset="68%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity={0.75} />
          </radialGradient>
          {worlds.map((w, orbitIndex) => (
            <clipPath key={`exo-clipdef-${w.planetStyleId}`} id={`exo-clip-${view}-${orbitIndex}`}>
              <circle cx={0} cy={0} r={PLANET_RADIUS} />
            </clipPath>
          ))}
        </defs>
        {[...Array(n)].map((_, orbitIndex) => {
          const oi = n - 1 - orbitIndex
          const a = orbitSemiMajor(n, oi)
          const rx = a
          const ry = a * ORBIT_FLATTEN
          return (
            <ellipse
              key={`exo-orb-${oi}`}
              cx={SUN.x}
              cy={SUN.y}
              rx={rx}
              ry={ry}
              fill="none"
              stroke="color-mix(in srgb, var(--accent) 45%, var(--border))"
              strokeWidth={1.05}
              strokeDasharray="3 5"
              opacity={0.68}
            />
          )
        })}
        <circle cx={SUN.x} cy={SUN.y} r={SUN_RADIUS} fill={`url(#exo-star-${view})`} />
        <text x={SUN.x} y={SUN.y + 5} textAnchor="middle" className="exhibition-map__sun-label">
          {cfg.starLabel.length > 12 ? cfg.starLabel.slice(0, 11) + '…' : cfg.starLabel}
        </text>
        {worlds.map((world, orbitIndex) => {
          const a = orbitSemiMajor(n, orbitIndex)
          const rx = a
          const ry = a * ORBIT_FLATTEN
          const angle = (2 * Math.PI * orbitIndex) / Math.max(1, n) + phase + orbitIndex * 0.35
          const { x, y } = bodyPos(rx, ry, angle)
          const pDust = useSlice ? dustTotal : (aggregates.stardustByPlanetId[world.planetStyleId] ?? 0)
          const pFocus = useSlice ? focusTotal : (aggregates.focusMinutesByPlanetId[world.planetStyleId] ?? 0)
          const unlocked = isPlanetUnlocked(world.planetStyleId, unlockedPlanetIds, rarePlanetsUnlocked)
          const tDust = heatIntensity(pDust, useSlice ? maxDust : maxDustPlanet)
          const timeT = heatIntensity(pFocus, maxFocus)
          const haloT = unlocked ? Math.max(tDust, timeT) : 0
          const breath = haloT > 0 ? Math.sin(tAnim * 1.7 + orbitIndex * 0.9) * 0.5 + 0.5 : 0
          const haloOp = (0.02 + haloT * 0.3) * (0.74 + 0.26 * breath)
          const haloR = PLANET_RADIUS + 1.2 + haloT * 9
          const imgFilter = unlocked
            ? `brightness(${0.52 + haloT * 0.28}) saturate(${1.1 + haloT * 0.18}) contrast(${1.05 + haloT * 0.1})`
            : 'grayscale(0.9) brightness(1.35) contrast(0.92)'
          const imgOpacity = unlocked ? Math.min(1, 0.85 + haloT * 0.15) : 0.42
          const ringColor = unlocked ? 'color-mix(in srgb, var(--accent) 38%, var(--border))' : 'var(--muted)'
          const ringOpacity = unlocked ? 1 : 0.6
          const ringWidth = unlocked ? 1.35 : 1.05
          const pr = PLANET_RADIUS
          const clipId = `exo-clip-${view}-${orbitIndex}`
          return (
            <g key={`exo-p-${world.planetStyleId}`} transform={`translate(${x}, ${y})`}>
              <title>{world.label}</title>
              {haloT > 0.001 && <circle r={haloR} fill="var(--accent)" opacity={haloOp} />}
              <image
                href={world.image}
                x={-pr}
                y={-pr}
                width={pr * 2}
                height={pr * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${clipId})`}
                opacity={imgOpacity}
                style={{ filter: imgFilter }}
              />
              <circle
                r={pr}
                fill="none"
                stroke={ringColor}
                strokeWidth={ringWidth}
                opacity={ringOpacity}
              />
            </g>
          )
        })}
      </svg>
      <p className="exhibition-map__footer">
        {useSlice ? (
          <>
            This period — stardust: <strong>{Math.round(dustTotal)}</strong> · Focus time:{' '}
            <strong>{Math.round(focusTotal)}</strong> min
          </>
        ) : (
          <>
            Exhibition worlds — combined stardust: <strong>{Math.round(dustTotal)}</strong> · Focus time:{' '}
            <strong>{Math.round(focusTotal)}</strong> min
          </>
        )}
      </p>
    </div>
  )
}
