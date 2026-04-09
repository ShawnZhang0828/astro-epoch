/**
 * Galactic zones for exploration heat (focus minutes by region).
 *
 * Solar system position in the Milky Way (for player-facing copy & map layout):
 * - The Sun lies in the Orion–Cygnus (Orion) Spur, a minor branch between the Sagittarius and Perseus spiral arms.
 * - Galactocentric distance is often quoted as ~8.0–8.3 kpc (~26,000–27,000 ly) from Sagittarius A*.
 * - The ecliptic plane is tilted ~60° to the Galactic plane; the Sun is slightly above the mid-plane (~20–30 pc).
 * Sources: NASA Science, ESA, Wikipedia "Sun" / "Milky Way" (overview articles).
 */
export const SUN_DISTANCE_FROM_GALACTIC_CENTER_KPC = 8.2

/** Galactic zones for heat map (focus / exploration time). */
export type GalaxyZone = 'solar_local' | 'orion_arm' | 'outer_rim' | 'galactic_core'

/** Normalize legacy session planet id. */
export function normalizePlanetStyleId(id?: string): string {
  if (!id || id === 'starter') return 'earth'
  return id
}

/**
 * Map each in-game world to a Milky Way region for the spiral overview.
 * Sol, Mars, and Europa count as local; Orion/Coalsack as disk features; center as bulge.
 */
export function planetGalaxyZone(planetStyleId?: string): GalaxyZone {
  const id = normalizePlanetStyleId(planetStyleId)
  switch (id) {
    case 'earth':
    case 'barren':
    case 'venus':
    case 'gas':
    case 'cyber':
    case 'uranus':
    case 'neptune':
    case 'rare-terra-prime':
    case 'rare-dust-veil':
      return 'solar_local'
    case 'milky-nebula':
      return 'orion_arm'
    case 'milky-void':
      return 'outer_rim'
    case 'rare-quasar-orchard':
      return 'galactic_core'
    default:
      if (id.startsWith('exo-')) return 'outer_rim'
      return 'solar_local'
  }
}

export type SessionLike = {
  actualMinutes: number
  stardustEarned?: number
  planetStyleId?: string
}

export type GalaxyAggregates = {
  stardustByPlanetId: Record<string, number>
  focusMinutesByPlanetId: Record<string, number>
  focusMinutesByGalaxyZone: Record<GalaxyZone, number>
  stardustSolarSystem: number
  stardustMilkyWay: number
}

function isSolarSystemBody(id: string): boolean {
  return (
    [
      'earth',
      'barren',
      'venus',
      'gas',
      'cyber',
      'uranus',
      'neptune',
      'rare-terra-prime',
      'rare-dust-veil'
    ].includes(id) || id === 'starter'
  )
}

function isExtendedMilkyWay(id: string): boolean {
  return (
    id === 'milky-nebula' ||
    id === 'milky-void' ||
    id === 'rare-quasar-orchard' ||
    id.startsWith('exo-')
  )
}

export function aggregateGalaxyFromSessions(sessions: SessionLike[]): GalaxyAggregates {
  const stardustByPlanetId: Record<string, number> = {}
  const focusMinutesByPlanetId: Record<string, number> = {}
  const focusMinutesByGalaxyZone: Record<GalaxyZone, number> = {
    solar_local: 0,
    orion_arm: 0,
    outer_rim: 0,
    galactic_core: 0
  }
  let stardustSolarSystem = 0
  let stardustMilkyWay = 0

  for (const s of sessions) {
    const pid = normalizePlanetStyleId(s.planetStyleId)
    const min = Math.max(0, s.actualMinutes)
    const dust = Math.max(0, s.stardustEarned ?? 0)
    stardustByPlanetId[pid] = (stardustByPlanetId[pid] ?? 0) + dust
    focusMinutesByPlanetId[pid] = (focusMinutesByPlanetId[pid] ?? 0) + min
    const zone = planetGalaxyZone(pid)
    focusMinutesByGalaxyZone[zone] += min
    if (isSolarSystemBody(pid)) stardustSolarSystem += dust
    else if (isExtendedMilkyWay(pid)) stardustMilkyWay += dust
  }

  return {
    stardustByPlanetId,
    focusMinutesByPlanetId,
    focusMinutesByGalaxyZone,
    stardustSolarSystem,
    stardustMilkyWay
  }
}

/** Intensity 0–1 from minutes vs max in dataset. */
export function heatIntensity(minutes: number, maxMinutes: number): number {
  if (maxMinutes <= 0) return 0
  return Math.min(1, Math.max(0, Math.sqrt(minutes / maxMinutes)))
}
