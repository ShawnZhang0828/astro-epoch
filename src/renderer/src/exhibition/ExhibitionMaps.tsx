import { useEffect, useReducer, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { GalaxyAggregates } from './galaxyStats'
import { SUN_DISTANCE_FROM_GALACTIC_CENTER_KPC, heatIntensity } from './galaxyStats'
import { EXO_MILKY_MARKERS, type ExhibitionExoView } from './exoplanetOverviews'
import { sumExoSystemFocusMinutes, sumExoSystemStardust } from './exoPlanetBundles'
import mercuryImg from '../assets/planet-photos/mercury.jpg'
import venusImg from '../assets/planet-photos/venus.jpg'
import earthImg from '../assets/planet-photos/earth.jpg'
import marsImg from '../assets/planet-photos/mars.jpg'
import jupiterImg from '../assets/planet-photos/jupiter.jpg'
import saturnImg from '../assets/planet-photos/saturn.jpg'
import uranusImg from '../assets/planet-photos/uranus.jpg'
import neptuneImg from '../assets/planet-photos/neptune.jpg'
import orionNebulaImg from '../assets/planet-photos/orion-nebula.jpg'
import coalsackImg from '../assets/planet-photos/coalsack.jpg'

type SolarBody = {
  key: string
  au: number
  angle: number
  gameStyleId: string | null
  photo: string
}

/**
 * Eight planets in orbital order; angles (rad) are 45° apart for even spread.
 * Display uses ellipses + compressed inner semi-axes (power law), not true AU scale.
 * `gameStyleId` links session Stardust to purchasable / rare styles (Venus has none).
 */
const SOLAR_SYSTEM: SolarBody[] = [
  { key: 'mercury', au: 0.39, angle: (337.5 * Math.PI) / 180, gameStyleId: 'barren', photo: mercuryImg },
  { key: 'venus', au: 0.72, angle: (292.5 * Math.PI) / 180, gameStyleId: 'venus', photo: venusImg },
  { key: 'earth', au: 1.0, angle: (247.5 * Math.PI) / 180, gameStyleId: 'earth', photo: earthImg },
  { key: 'mars', au: 1.52, angle: (202.5 * Math.PI) / 180, gameStyleId: 'rare-terra-prime', photo: marsImg },
  { key: 'jupiter', au: 5.2, angle: (157.5 * Math.PI) / 180, gameStyleId: 'gas', photo: jupiterImg },
  { key: 'saturn', au: 9.54, angle: (112.5 * Math.PI) / 180, gameStyleId: 'cyber', photo: saturnImg },
  { key: 'uranus', au: 19.2, angle: (67.5 * Math.PI) / 180, gameStyleId: 'uranus', photo: uranusImg },
  { key: 'neptune', au: 30.1, angle: (22.5 * Math.PI) / 180, gameStyleId: 'neptune', photo: neptuneImg }
]

const SOLAR_COUNT = SOLAR_SYSTEM.length

/** Wide square-ish canvas; sun centered. */
const VIEW_W = 1000
const VIEW_H = 560
const SUN = { x: VIEW_W / 2, y: VIEW_H / 2 }
const SUN_RADIUS = 26
/** Same disk radius for every planet (readable textures); stardust only affects ring/glow. */
const PLANET_RADIUS = 17
const ORBIT_OUTER_PAD = 38
/** Semi-minor / semi-major for each orbit ellipse (even flattening). */
const ORBIT_FLATTEN = 0.46
/**
 * Max semi-major a: need a + planet ≤ SUN.x and a·flatten + planet ≤ SUN.y.
 */
const ORBIT_A_OUT = Math.min(
  SUN.x - ORBIT_OUTER_PAD - PLANET_RADIUS,
  (SUN.y - ORBIT_OUTER_PAD - PLANET_RADIUS) / ORBIT_FLATTEN
)
const ORBIT_A_IN = SUN_RADIUS + 12 + PLANET_RADIUS
/**
 * a(i) = aIn + (i/(n-1))^p · (aOut - aIn) spreads inner orbits (avoids overlap).
 */
const ORBIT_RADIUS_POWER = 0.48

function displayOrbitSemiMajor(orbitIndex: number): number {
  if (SOLAR_COUNT <= 1) return ORBIT_A_IN
  const t = orbitIndex / (SOLAR_COUNT - 1)
  return ORBIT_A_IN + Math.pow(t, ORBIT_RADIUS_POWER) * (ORBIT_A_OUT - ORBIT_A_IN)
}

function orbitEllipseAxes(orbitIndex: number) {
  const rx = displayOrbitSemiMajor(orbitIndex)
  const ry = rx * ORBIT_FLATTEN
  return { rx, ry }
}

function bodyPosition(rx: number, ry: number, angle: number) {
  return {
    x: SUN.x + Math.cos(angle) * rx,
    y: SUN.y + Math.sin(angle) * ry
  }
}

function isStyleUnlocked(
  gameStyleId: string | null,
  unlockedPlanetIds: string[],
  rarePlanetsUnlocked: string[]
): boolean {
  if (!gameStyleId) return false
  if (gameStyleId === 'earth') return true
  if (gameStyleId.startsWith('rare-')) return rarePlanetsUnlocked.includes(gameStyleId)
  return unlockedPlanetIds.includes(gameStyleId)
}

type SolarProps = {
  aggregates: GalaxyAggregates
  unlockedPlanetIds: string[]
  rarePlanetsUnlocked: string[]
}

export function SolarStardustOverview({
  aggregates,
  unlockedPlanetIds,
  rarePlanetsUnlocked
}: SolarProps) {
  const dustValues = SOLAR_SYSTEM.map((b) =>
    b.gameStyleId ? aggregates.stardustByPlanetId[b.gameStyleId] ?? 0 : 0
  )
  const maxDust = Math.max(1, ...dustValues, aggregates.stardustSolarSystem)

  const focusMinutesValues = SOLAR_SYSTEM.map((b) =>
    b.gameStyleId ? aggregates.focusMinutesByPlanetId[b.gameStyleId] ?? 0 : 0
  )
  const maxFocusMin = Math.max(1, ...focusMinutesValues)

  const animTRef = useRef(0)
  const [, tick] = useReducer((n: number) => n + 1, 0)
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

  return (
    <div className="exhibition-map exhibition-map--solar exhibition-map--solar-hero">
      <svg
        className="exhibition-map__svg exhibition-map__svg--solar-wide"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Solar system with eight planets"
      >
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="35%" stopColor="#fde047" />
            <stop offset="72%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity={0.72} />
          </radialGradient>
        </defs>
        {[...SOLAR_SYSTEM].map((_, i) => SOLAR_COUNT - 1 - i).map((orbitIndex) => {
          const { rx, ry } = orbitEllipseAxes(orbitIndex)
          return (
            <ellipse
              key={`orbit-${SOLAR_SYSTEM[orbitIndex].key}`}
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
        <circle cx={SUN.x} cy={SUN.y} r={SUN_RADIUS} fill="url(#sunGrad)" />
        <text x={SUN.x} y={SUN.y + 5} textAnchor="middle" className="exhibition-map__sun-label">
          Sun
        </text>
        {SOLAR_SYSTEM.map((b, orbitIndex) => {
          const { rx, ry } = orbitEllipseAxes(orbitIndex)
          const { x, y } = bodyPosition(rx, ry, b.angle)
          const dust = b.gameStyleId ? aggregates.stardustByPlanetId[b.gameStyleId] ?? 0 : 0
          const tDust = heatIntensity(dust, maxDust)
          const focusMin = b.gameStyleId ? aggregates.focusMinutesByPlanetId[b.gameStyleId] ?? 0 : 0
          const timeT = heatIntensity(focusMin, maxFocusMin)
          const unlocked = isStyleUnlocked(b.gameStyleId, unlockedPlanetIds, rarePlanetsUnlocked)
          /** Breath amplitude: focus time on unlocked (explored) worlds only. */
          const exploreT = unlocked ? timeT : 0
          const breath =
            exploreT > 0
              ? Math.sin(tAnim * (1.85 + exploreT * 0.9) + orbitIndex * 0.92)
              : 0
          const breathAmt = exploreT * (0.55 + 0.45 * (0.5 + 0.5 * breath))
          const pr = PLANET_RADIUS
          const haloExtra = 5 + exploreT * 13 + breathAmt * 8
          const haloR = pr + haloExtra
          const clipId = `solar-clip-${b.key}`
          const brightBase = unlocked ? 0.52 + exploreT * 0.26 : 1.35
          const brightPulse = unlocked ? breathAmt * 0.14 : 0
          const imgFilter = unlocked
            ? `brightness(${brightBase + brightPulse}) saturate(${1.12 + exploreT * 0.18}) contrast(${1.06 + exploreT * 0.1})`
            : 'grayscale(0.85) brightness(1.38) contrast(0.92)'
          const imgOpacity = unlocked
            ? Math.min(1, 0.85 + exploreT * 0.14 + breathAmt * 0.05)
            : 0.42
          const ringColor = unlocked ? 'var(--accent)' : 'var(--muted)'
          const ringOp = unlocked ? 0.58 + 0.35 * exploreT + 0.22 * tDust : 0.32 + 0.22 * tDust
          const haloOp = unlocked
            ? (0.1 + exploreT * 0.3 + breathAmt * 0.18) * (0.82 + 0.18 * (0.5 + 0.5 * breath))
            : 0.07
          return (
            <g key={b.key} transform={`translate(${x}, ${y})`}>
              <title>{b.key.charAt(0).toUpperCase() + b.key.slice(1)}</title>
              <defs>
                <clipPath id={clipId}>
                  <circle r={pr} cx={0} cy={0} />
                </clipPath>
              </defs>
              <circle r={haloR} fill="var(--accent)" opacity={haloOp} />
              <image
                href={b.photo}
                x={-pr}
                y={-pr}
                width={pr * 2}
                height={pr * 2}
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="xMidYMid slice"
                opacity={imgOpacity}
                style={{ filter: imgFilter }}
              />
              <circle
                r={pr}
                fill="none"
                stroke={ringColor}
                strokeWidth={unlocked ? 1.45 + exploreT * 2.8 + tDust * 2.5 : 1.05}
                opacity={ringOp}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const MILKY_MAP_THUMB_R = 12.5
/** Widen map horizontally without non-uniform SVG scale (avoids ellipses / stretched text). */
const MILKY_MAP_SCALE_X = 1.28

/** Spread x around chart center so we can drop `scale(sx,1)`. */
function milkySpreadX(x: number): number {
  return 160 + (x - 160) * MILKY_MAP_SCALE_X
}

/**
 * Exploration halo matching SolarStardustOverview: focus time + breath + stardust on ring.
 * `baseR` is the clipped thumbnail radius (nebula vs solar/exo).
 */
function milkyExploreHalo(
  focusMin: number,
  dust: number,
  maxFocus: number,
  maxDust: number,
  tAnim: number,
  phase: number,
  baseR: number
): { haloR: number; haloOp: number; ringOp: number; ringW: number; exploreT: number } {
  const exploreT = heatIntensity(focusMin, maxFocus)
  const tDust = heatIntensity(dust, maxDust)
  const breath =
    exploreT > 0 ? Math.sin(tAnim * (1.85 + exploreT * 0.9) + phase) : 0
  const breathAmt = exploreT * (0.55 + 0.45 * (0.5 + 0.5 * breath))
  /** Tighter than solar planet halos — map pins are small. */
  const haloExtra = 0.5 * (4 + exploreT * 12 + breathAmt * 7)
  const haloR = baseR + haloExtra
  const haloOp =
    exploreT > 0
      ? (0.06 + exploreT * 0.22 + breathAmt * 0.12) * (0.85 + 0.15 * (0.5 + 0.5 * breath))
      : 0
  const ringOp = 0.28 + 0.45 * exploreT + 0.22 * tDust
  const ringW = 1.1 + 0.5 * (exploreT * 2.2 + tDust * 1.8)
  return { haloR, haloOp, ringOp, ringW, exploreT }
}

const NEBULA_LANDMARK_R = 14

type MilkyWayInteriorProps = {
  aggregates: GalaxyAggregates
  onOpenSolar: () => void
  onOpenExoplanet: (view: ExhibitionExoView) => void
}

type MilkyMapMarker = {
  id: string
  x: number
  y: number
  label: string
  thumb: string
}

type NebulaLandmark = {
  id: string
  x: number
  y: number
  label: string
  /** Bundled NASA-style reference photo (see planet-photos/SOURCES.txt). */
  photo: string
  ringStroke: string
  /** Session aggregates: focus / stardust for this focus skin. */
  planetStyleId: 'milky-nebula' | 'milky-void'
  breathPhase: number
}

function milkyMapActivate(e: ReactKeyboardEvent<SVGGElement>, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

/** Milky Way map: nebula thumbnails (not navigable), solar + exoplanet system entries. */
export function MilkyWayGalaxyOverview({
  aggregates,
  onOpenSolar,
  onOpenExoplanet
}: MilkyWayInteriorProps) {
  const nebulaLandmarks: NebulaLandmark[] = [
    {
      id: 'orion',
      x: 130,
      y: 90,
      label: 'Orion Nebula (M42)',
      photo: orionNebulaImg,
      ringStroke: '#9333ea',
      planetStyleId: 'milky-nebula',
      breathPhase: 0.25
    },
    {
      id: 'coalsack',
      x: 76,
      y: 122,
      label: 'Coalsack',
      photo: coalsackImg,
      ringStroke: '#64748b',
      planetStyleId: 'milky-void',
      breathPhase: 1.12
    }
  ]

  const solarMarker: MilkyMapMarker & { onOpen: () => void } = {
    id: 'solar',
    x: 192,
    y: 114,
    label: 'Solar neighborhood',
    thumb: earthImg,
    onOpen: onOpenSolar
  }

  const exoMarkers = EXO_MILKY_MARKERS.map((e) => ({
    ...e,
    onOpen: () => onOpenExoplanet(e.view)
  }))

  const allForClips = [solarMarker, ...exoMarkers]
  const r = MILKY_MAP_THUMB_R
  const vbW = 320 * MILKY_MAP_SCALE_X
  const nr = NEBULA_LANDMARK_R
  const solarCx = milkySpreadX(solarMarker.x)

  const solarFocusSum = SOLAR_SYSTEM.reduce(
    (s, b) => s + (b.gameStyleId ? aggregates.focusMinutesByPlanetId[b.gameStyleId] ?? 0 : 0),
    0
  )
  const exoFocusList = EXO_MILKY_MARKERS.map((e) => sumExoSystemFocusMinutes(e.view, aggregates))
  const exoDustList = EXO_MILKY_MARKERS.map((e) => sumExoSystemStardust(e.view, aggregates))
  const allFocus = [
    solarFocusSum,
    aggregates.focusMinutesByPlanetId['milky-nebula'] ?? 0,
    aggregates.focusMinutesByPlanetId['milky-void'] ?? 0,
    ...exoFocusList
  ]
  const allDust = [
    aggregates.stardustSolarSystem,
    aggregates.stardustByPlanetId['milky-nebula'] ?? 0,
    aggregates.stardustByPlanetId['milky-void'] ?? 0,
    ...exoDustList
  ]
  const maxFocusMilky = Math.max(1, ...allFocus)
  const maxDustMilky = Math.max(1, ...allDust)

  const animTRef = useRef(0)
  const [, tickMilky] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    let id: number
    const loop = (now: number) => {
      animTRef.current = now / 1000
      tickMilky()
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
  const tAnimMilky = animTRef.current

  const solarH = milkyExploreHalo(
    solarFocusSum,
    aggregates.stardustSolarSystem,
    maxFocusMilky,
    maxDustMilky,
    tAnimMilky,
    0.52,
    r
  )

  return (
    <div className="exhibition-map exhibition-map--milky-interior">
      <h3 className="exhibition-map__title">Milky Way</h3>
      <p className="exhibition-map__hint">
        Layout not to scale. Orion and Coalsack show reference photos (focus skins). Open the Solar neighborhood or
        multi-planet systems below. The Sun sits in the Orion Spur, roughly {SUN_DISTANCE_FROM_GALACTIC_CENTER_KPC} kpc
        from Sagittarius A*.
      </p>
      <div className="exhibition-milky-canvas exhibition-milky-canvas--map">
        <svg
          className="exhibition-milky-map-svg"
          viewBox={`0 0 ${vbW} 200`}
          role="img"
          aria-label="Milky Way schematic map with locations"
        >
          <g>
            <defs>
              {nebulaLandmarks.map((m) => (
                <clipPath key={m.id} id={`milky-map-clip-${m.id}`}>
                  <circle cx={milkySpreadX(m.x)} cy={m.y} r={nr} />
                </clipPath>
              ))}
              {allForClips.map((m) => (
                <clipPath key={m.id} id={`milky-map-clip-${m.id}`}>
                  <circle cx={milkySpreadX(m.x)} cy={m.y} r={r} />
                </clipPath>
              ))}
            </defs>
            {nebulaLandmarks.map((m) => {
              const cx = milkySpreadX(m.x)
              const focusMin = aggregates.focusMinutesByPlanetId[m.planetStyleId] ?? 0
              const dust = aggregates.stardustByPlanetId[m.planetStyleId] ?? 0
              const H = milkyExploreHalo(
                focusMin,
                dust,
                maxFocusMilky,
                maxDustMilky,
                tAnimMilky,
                m.breathPhase,
                nr
              )
              return (
                <g key={m.id} className="exhibition-milky-map-marker exhibition-milky-map-marker--landmark">
                  <title>{m.label}</title>
                  {H.exploreT < 0.02 && (
                    <circle cx={cx} cy={m.y} r={nr + 4} fill="var(--accent)" opacity={0.08} />
                  )}
                  {H.haloOp > 0.001 && (
                    <circle cx={cx} cy={m.y} r={H.haloR} fill="var(--accent)" opacity={H.haloOp} />
                  )}
                  <image
                    href={m.photo}
                    x={cx - nr}
                    y={m.y - nr}
                    width={nr * 2}
                    height={nr * 2}
                    clipPath={`url(#milky-map-clip-${m.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <circle
                    cx={cx}
                    cy={m.y}
                    r={nr}
                    fill="none"
                    stroke={m.ringStroke}
                    strokeWidth={H.ringW}
                    opacity={H.ringOp}
                  />
                  <text
                    x={cx}
                    y={m.y + nr + 16}
                    textAnchor="middle"
                    className="exhibition-milky-map-marker__label"
                  >
                    {m.label}
                  </text>
                </g>
              )
            })}
            {exoMarkers.map((m, ei) => {
              const cx = milkySpreadX(m.x)
              const focusMin = sumExoSystemFocusMinutes(m.view, aggregates)
              const dust = sumExoSystemStardust(m.view, aggregates)
              const H = milkyExploreHalo(
                focusMin,
                dust,
                maxFocusMilky,
                maxDustMilky,
                tAnimMilky,
                0.35 + ei * 0.61,
                r
              )
              return (
                <g
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  className="exhibition-milky-map-marker exhibition-milky-map-marker--active"
                  onClick={m.onOpen}
                  onKeyDown={(e) => milkyMapActivate(e, m.onOpen)}
                >
                  <title>{`Open ${m.label}`}</title>
                  {H.exploreT < 0.02 && (
                    <circle cx={cx} cy={m.y} r={r + 4} fill="var(--accent)" opacity={0.1} />
                  )}
                  {H.haloOp > 0.001 && (
                    <circle cx={cx} cy={m.y} r={H.haloR} fill="var(--accent)" opacity={H.haloOp} />
                  )}
                  <image
                    href={m.thumb}
                    x={cx - r}
                    y={m.y - r}
                    width={r * 2}
                    height={r * 2}
                    clipPath={`url(#milky-map-clip-${m.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <circle
                    cx={cx}
                    cy={m.y}
                    r={r}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={H.ringW}
                    opacity={H.ringOp}
                  />
                  <text x={cx} y={m.y + r + 11} textAnchor="middle" className="exhibition-milky-map-marker__label">
                    {m.label}
                  </text>
                </g>
              )
            })}
            <g
              role="button"
              tabIndex={0}
              className="exhibition-milky-map-marker exhibition-milky-map-marker--active"
              onClick={solarMarker.onOpen}
              onKeyDown={(e) => milkyMapActivate(e, solarMarker.onOpen)}
            >
              <title>Open Solar neighborhood</title>
              {solarH.exploreT < 0.02 && (
                <circle cx={solarCx} cy={solarMarker.y} r={r + 4} fill="var(--accent)" opacity={0.1} />
              )}
              {solarH.haloOp > 0.001 && (
                <circle
                  cx={solarCx}
                  cy={solarMarker.y}
                  r={solarH.haloR}
                  fill="var(--accent)"
                  opacity={solarH.haloOp}
                />
              )}
              <image
                href={solarMarker.thumb}
                x={solarCx - r}
                y={solarMarker.y - r}
                width={r * 2}
                height={r * 2}
                clipPath={`url(#milky-map-clip-${solarMarker.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
              <circle
                cx={solarCx}
                cy={solarMarker.y}
                r={r}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={solarH.ringW}
                opacity={solarH.ringOp}
              />
              <text
                x={solarCx}
                y={solarMarker.y + r + 11}
                textAnchor="middle"
                className="exhibition-milky-map-marker__label"
              >
                {solarMarker.label}
              </text>
            </g>
          </g>
        </svg>
      </div>
      <p className="exhibition-map__footer">
        Extended Milky Way skins (e.g. nebula cores): <strong>{Math.round(aggregates.stardustMilkyWay)}</strong> Stardust
      </p>
    </div>
  )
}
