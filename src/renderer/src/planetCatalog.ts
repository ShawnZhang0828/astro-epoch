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
/** Display order: Sol, solar system worlds, Milky Way sights, achievement unlocks, exoplanet skins. */
export const PLANET_OPTIONS: { id: string; label: string; image: string }[] = [
  { id: 'earth', label: 'Earth', image: earth },
  { id: 'barren', label: 'Mercury', image: mercury },
  { id: 'venus', label: 'Venus', image: venus },
  { id: 'gas', label: 'Jupiter', image: jupiter },
  { id: 'cyber', label: 'Saturn', image: saturn },
  { id: 'uranus', label: 'Uranus', image: uranus },
  { id: 'neptune', label: 'Neptune', image: neptune },
  { id: 'milky-nebula', label: 'Orion Nebula (M42)', image: orionNebula },
  { id: 'milky-void', label: 'Coalsack Nebula', image: coalsack },
  { id: 'rare-terra-prime', label: 'Mars', image: mars },
  { id: 'rare-dust-veil', label: 'Europa (moon)', image: europa },
  { id: 'rare-quasar-orchard', label: 'Galactic center', image: galacticCenter },
  ...EXO_PLANET_OPTIONS
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
