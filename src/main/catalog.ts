export type ItemCategory = 'planet_core' | 'orbiter' | 'atmosphere' | 'theme'

export interface ShopItem {
  id: string
  name: string
  description: string
  category: ItemCategory
  price: number
  /** Planet cores: Sol system vs Milky Way vs exoplanet skins (Market grouping). */
  galaxyRegion?: 'solar_system' | 'milky_way' | 'exo_systems'
  /** planet visual id unlocked by planet_core */
  planetStyleId?: string
  /** orbiter effect key */
  orbiterKey?: string
  /** atmosphere audio key */
  atmosphereKey?: string
  /** theme id */
  themeId?: string
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'core-barren',
    name: 'Mercury',
    description: 'Solar system — innermost planet; Mariner / MESSENGER imagery.',
    category: 'planet_core',
    price: 120,
    galaxyRegion: 'solar_system',
    planetStyleId: 'barren'
  },
  {
    id: 'core-venus',
    name: 'Venus',
    description: 'Solar system — thick clouds and volcanic plains (Magellan / Akatsuki class views).',
    category: 'planet_core',
    price: 150,
    galaxyRegion: 'solar_system',
    planetStyleId: 'venus'
  },
  {
    id: 'core-gas-giant',
    name: 'Jupiter',
    description: 'Solar system — largest planet; Great Red Spot and cloud belts (Voyager / Juno).',
    category: 'planet_core',
    price: 200,
    galaxyRegion: 'solar_system',
    planetStyleId: 'gas'
  },
  {
    id: 'core-cyber',
    name: 'Saturn',
    description: 'Solar system — ringed gas giant (Cassini equinox imagery).',
    category: 'planet_core',
    price: 280,
    galaxyRegion: 'solar_system',
    planetStyleId: 'cyber'
  },
  {
    id: 'core-uranus',
    name: 'Uranus',
    description: 'Solar system — ice giant on its side; muted cyan atmosphere (Voyager 2).',
    category: 'planet_core',
    price: 300,
    galaxyRegion: 'solar_system',
    planetStyleId: 'uranus'
  },
  {
    id: 'core-neptune',
    name: 'Neptune',
    description: 'Solar system — deep blue ice giant and supersonic winds (Voyager 2).',
    category: 'planet_core',
    price: 310,
    galaxyRegion: 'solar_system',
    planetStyleId: 'neptune'
  },
  {
    id: 'core-milky-nebula',
    name: 'Orion Nebula (M42)',
    description: 'Milky Way — star-forming region in Orion’s sword (~1,300 ly).',
    category: 'planet_core',
    price: 320,
    galaxyRegion: 'milky_way',
    planetStyleId: 'milky-nebula'
  },
  {
    id: 'core-milky-void',
    name: 'Coalsack Nebula',
    description: 'Milky Way — dark molecular cloud in Crux, silhouetted against the galactic disk.',
    category: 'planet_core',
    price: 340,
    galaxyRegion: 'milky_way',
    planetStyleId: 'milky-void'
  },
  ...(['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const).map((L, i) => ({
    id: `core-exo-k90-${L}`,
    name: `Kepler-90 ${L.toUpperCase()}`,
    description:
      'Kepler-90 — eight-planet system. Textures from NASA/Ames and JPL-Caltech artist concepts (U.S. government work).',
    category: 'planet_core' as const,
    price: 365 + i * 5,
    galaxyRegion: 'exo_systems' as const,
    planetStyleId: `exo-k90-${L}`
  })),
  ...(['b', 'c', 'd', 'e', 'f', 'g', 'h'] as const).map((L, i) => ({
    id: `core-exo-hd10180-${L}`,
    name: `HD 10180 ${L.toUpperCase()}`,
    description:
      'HD 10180 — Neptune-class worlds on tight orbits. System art © ESO/L. Calçada (CC BY 4.0); extra textures NASA/JPL-Caltech.',
    category: 'planet_core' as const,
    price: 405 + i * 5,
    galaxyRegion: 'exo_systems' as const,
    planetStyleId: `exo-hd10180-${L}`
  })),
  ...(['b', 'c', 'd', 'e', 'f', 'g', 'h'] as const).map((L, i) => ({
    id: `core-exo-t1-${L}`,
    name: `TRAPPIST-1 ${L.toUpperCase()}`,
    description:
      'TRAPPIST-1 — seven Earth-sized worlds. Imagery from NASA/JPL-Caltech & NASA Image and Video Library (public domain).',
    category: 'planet_core' as const,
    price: 415 + i * 5,
    galaxyRegion: 'exo_systems' as const,
    planetStyleId: `exo-t1-${L}`
  })),
  {
    id: 'core-exo-k452-b',
    name: 'Kepler-452 b',
    description:
      'Kepler-452 b — super-Earth in the habitable zone of a Sun-like star. NASA/Ames/JPL-Caltech artist concept (public domain).',
    category: 'planet_core',
    price: 455,
    galaxyRegion: 'exo_systems',
    planetStyleId: 'exo-k452-b'
  },
  {
    id: 'orbiter-logic-sat',
    name: 'Logic Calculation Satellite',
    description: '+5% Stardust when focusing with a Programming-tagged session.',
    category: 'orbiter',
    price: 150,
    orbiterKey: 'logic_bonus'
  },
  {
    id: 'orbiter-endurance',
    name: 'Endurance Probe',
    description: 'Sessions reaching 60+ minutes may yield bonus Stardust debris.',
    category: 'orbiter',
    price: 180,
    orbiterKey: 'endurance_drop'
  },
  {
    id: 'atmo-glacier',
    name: 'Glacier Storm',
    description: 'Cold wind ambience for focus sessions.',
    category: 'atmosphere',
    price: 90,
    atmosphereKey: 'glacier'
  },
  {
    id: 'atmo-station',
    name: 'Space Station Low Frequency',
    description: 'Deep station hum and distant machinery.',
    category: 'atmosphere',
    price: 90,
    atmosphereKey: 'station'
  },
  {
    id: 'atmo-deepsea',
    name: 'Deep Sea Dive',
    description: 'Pressure hull drones and slow currents.',
    category: 'atmosphere',
    price: 90,
    atmosphereKey: 'deepsea'
  },
  {
    id: 'theme-aurora',
    name: 'Aurora Borealis UI',
    description: 'Teal highlights and soft northern glow.',
    category: 'theme',
    price: 100,
    themeId: 'aurora'
  },
  {
    id: 'theme-solar',
    name: 'Solar Flare UI',
    description: 'Warm amber accents on deep charcoal.',
    category: 'theme',
    price: 100,
    themeId: 'solar'
  }
]

export const HIDDEN_ACHIEVEMENTS: {
  id: string
  title: string
  rarePlanetId: string
  rarePlanetName: string
}[] = [
  {
    id: 'ach_streak_7',
    title: 'Seven Orbits',
    rarePlanetId: 'rare-terra-prime',
    rarePlanetName: 'Mars (red planet)'
  },
  {
    id: 'ach_default_100h',
    title: 'Hundred Hours — Default Lane',
    rarePlanetId: 'rare-dust-veil',
    rarePlanetName: 'Europa (Jupiter moon)'
  },
  {
    id: 'ach_overtime_120',
    title: 'Overtime Legend',
    rarePlanetId: 'rare-quasar-orchard',
    rarePlanetName: 'Galactic center view'
  }
]

export function getItemById(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id)
}
