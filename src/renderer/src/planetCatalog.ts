import mercury from './assets/planet-photos/mercury.jpg'
import venus from './assets/planet-photos/venus.jpg'
import jupiter from './assets/planet-photos/jupiter.jpg'
import saturn from './assets/planet-photos/saturn.jpg'
import uranus from './assets/planet-photos/uranus.jpg'
import neptune from './assets/planet-photos/neptune.jpg'
import orionNebula from './assets/planet-photos/orion-nebula.jpg'
import coalsack from './assets/planet-photos/coalsack.jpg'
import mars from './assets/planet-photos/mars.jpg'
import europa from './assets/planet-photos/europa.jpg'
import galacticCenter from './assets/planet-photos/galactic-center.jpg'
import earth from './assets/planet-photos/earth.jpg'
import { EXO_PLANET_OPTIONS } from './exhibition/exoPlanetBundles'
import type { ExhibitionExoView } from './exhibition/exoTypes'

/** Focus planet modal: solar / Milky Way / each exoplanet system (matches exhibition views). */
export type PlanetPickerGroup = 'solar_system' | 'milky_way' | ExhibitionExoView

export const PLANET_PICKER_GROUP_ORDER: PlanetPickerGroup[] = [
  'solar_system',
  'milky_way',
  'exo_kepler_90',
  'exo_hd_10180',
  'exo_trappist_1',
  'exo_kepler_452'
]

export const PLANET_PICKER_GROUP_LABELS: Record<PlanetPickerGroup, string> = {
  solar_system: 'Solar system',
  milky_way: 'Milky Way',
  exo_kepler_90: 'Kepler-90',
  exo_hd_10180: 'HD 10180',
  exo_trappist_1: 'TRAPPIST-1',
  exo_kepler_452: 'Kepler-452'
}

function exoPlanetPickerGroup(planetStyleId: string): ExhibitionExoView {
  if (planetStyleId.startsWith('exo-k90-')) return 'exo_kepler_90'
  if (planetStyleId.startsWith('exo-hd10180-')) return 'exo_hd_10180'
  if (planetStyleId.startsWith('exo-t1-')) return 'exo_trappist_1'
  return 'exo_kepler_452'
}

export type PlanetOptionDTO = { id: string; label: string; image: string; pickerGroup: PlanetPickerGroup }

/** Display order: Sol, solar system worlds, Milky Way sights, achievement unlocks, exoplanet skins. */
export const PLANET_OPTIONS: PlanetOptionDTO[] = [
  { id: 'earth', label: 'Earth', image: earth, pickerGroup: 'solar_system' },
  { id: 'barren', label: 'Mercury', image: mercury, pickerGroup: 'solar_system' },
  { id: 'venus', label: 'Venus', image: venus, pickerGroup: 'solar_system' },
  { id: 'gas', label: 'Jupiter', image: jupiter, pickerGroup: 'solar_system' },
  { id: 'cyber', label: 'Saturn', image: saturn, pickerGroup: 'solar_system' },
  { id: 'uranus', label: 'Uranus', image: uranus, pickerGroup: 'solar_system' },
  { id: 'neptune', label: 'Neptune', image: neptune, pickerGroup: 'solar_system' },
  { id: 'milky-nebula', label: 'Orion Nebula (M42)', image: orionNebula, pickerGroup: 'milky_way' },
  { id: 'milky-void', label: 'Coalsack Nebula', image: coalsack, pickerGroup: 'milky_way' },
  { id: 'rare-terra-prime', label: 'Mars', image: mars, pickerGroup: 'solar_system' },
  { id: 'rare-dust-veil', label: 'Europa (moon)', image: europa, pickerGroup: 'solar_system' },
  { id: 'rare-quasar-orchard', label: 'Galactic center', image: galacticCenter, pickerGroup: 'milky_way' },
  ...EXO_PLANET_OPTIONS.map((p) => ({ ...p, pickerGroup: exoPlanetPickerGroup(p.id) }))
]

export function isPlanetUnlocked(
  id: string,
  unlockedPlanetIds: string[],
  rarePlanetIds: string[]
): boolean {
  if (id === 'earth') return true
  if (id.startsWith('rare-')) return rarePlanetIds.includes(id)
  if (id.startsWith('exo-')) return unlockedPlanetIds.includes(id)
  return unlockedPlanetIds.includes(id)
}
