import type { ExhibitionExoView } from './exoTypes'
import type { GalaxyAggregates } from './galaxyStats'
import exoK452b from '../assets/planet-photos/exo-k452-b.jpg'
import exoTex01 from '../assets/planet-photos/exo-texture-01.jpg'
import exoTex02 from '../assets/planet-photos/exo-texture-02.jpg'
import exoTex03 from '../assets/planet-photos/exo-texture-03.jpg'
import exoTex04 from '../assets/planet-photos/exo-texture-04.jpg'
import exoTex05 from '../assets/planet-photos/exo-texture-05.jpg'
import exoTex06 from '../assets/planet-photos/exo-texture-06.jpg'
import exoHd10180 from '../assets/planet-photos/exo-hd10180.jpg'
import exoT1Lineup from '../assets/planet-photos/exo-t1-lineup.jpg'
import exoT1Abstract from '../assets/planet-photos/exo-t1-abstract.jpg'
import exoT1Surface from '../assets/planet-photos/exo-t1-surface.jpg'
import exoPia15808 from '../assets/planet-photos/exo-pia15808.jpg'
import exoPia16869 from '../assets/planet-photos/exo-pia16869.jpg'
import exoPia17062 from '../assets/planet-photos/exo-pia17062.jpg'
import exoPia17487 from '../assets/planet-photos/exo-pia17487.jpg'
import exoPia19824 from '../assets/planet-photos/exo-pia19824.jpg'
import exoPia20052 from '../assets/planet-photos/exo-pia20052.jpg'
import exoPia21424 from '../assets/planet-photos/exo-pia21424.jpg'
import exoPia21590 from '../assets/planet-photos/exo-pia21590.jpg'
import exoPia22087 from '../assets/planet-photos/exo-pia22087.jpg'
import exoPia22261 from '../assets/planet-photos/exo-pia22261.jpg'
import exoPia22588 from '../assets/planet-photos/exo-pia22588.jpg'
import exoPia23175 from '../assets/planet-photos/exo-pia23175.jpg'

export type ExoWorldSpec = {
  planetStyleId: string
  shopItemId: string
  label: string
  image: string
}

const K90_TEX = [exoTex01, exoTex02, exoTex03, exoTex04, exoTex05, exoTex06, exoPia15808, exoPia16869] as const
const K90_LETTERS = ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const

const HD_TEX = [exoPia17487, exoPia19824, exoHd10180, exoPia20052, exoPia21424, exoPia17062, exoPia21590] as const
const HD_LETTERS = ['b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

const T1_TEX = [exoT1Lineup, exoT1Abstract, exoT1Surface, exoPia22261, exoPia22588, exoPia22087, exoPia23175] as const
const T1_LETTERS = ['b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

function k90Worlds(): ExoWorldSpec[] {
  return K90_LETTERS.map((L, i) => ({
    planetStyleId: `exo-k90-${L}`,
    shopItemId: `core-exo-k90-${L}`,
    label: `Kepler-90 ${L.toUpperCase()}`,
    image: K90_TEX[i]!
  }))
}

function hdWorlds(): ExoWorldSpec[] {
  return HD_LETTERS.map((L, i) => ({
    planetStyleId: `exo-hd10180-${L}`,
    shopItemId: `core-exo-hd10180-${L}`,
    label: `HD 10180 ${L.toUpperCase()}`,
    image: HD_TEX[i]!
  }))
}

function t1Worlds(): ExoWorldSpec[] {
  return T1_LETTERS.map((L, i) => ({
    planetStyleId: `exo-t1-${L}`,
    shopItemId: `core-exo-t1-${L}`,
    label: `TRAPPIST-1 ${L.toUpperCase()}`,
    image: T1_TEX[i]!
  }))
}

/** All worlds shown in each exhibition system view (orbit count = length). */
export const EXO_WORLDS_BY_VIEW: Record<ExhibitionExoView, ExoWorldSpec[]> = {
  exo_kepler_90: k90Worlds(),
  exo_hd_10180: hdWorlds(),
  exo_trappist_1: t1Worlds(),
  exo_kepler_452: [
    {
      planetStyleId: 'exo-k452-b',
      shopItemId: 'core-exo-k452-b',
      label: 'Kepler-452 b',
      image: exoK452b
    }
  ]
}

export function exoWorldsForView(view: ExhibitionExoView): ExoWorldSpec[] {
  return EXO_WORLDS_BY_VIEW[view]
}

/** Market sort order for exoplanet cores (must match `SHOP_ITEMS` ids). */
export const EXO_SHOP_ITEM_IDS_ORDER: string[] = [
  ...k90Worlds().map((w) => w.shopItemId),
  ...hdWorlds().map((w) => w.shopItemId),
  ...t1Worlds().map((w) => w.shopItemId),
  'core-exo-k452-b'
]

export const EXO_PLANET_OPTIONS: { id: string; label: string; image: string }[] = (
  [
    ...k90Worlds(),
    ...hdWorlds(),
    ...t1Worlds(),
    ...EXO_WORLDS_BY_VIEW.exo_kepler_452
  ] as ExoWorldSpec[]
).map((w) => ({ id: w.planetStyleId, label: w.label, image: w.image }))

export const EXO_ITEM_ICON_BY_ID: Record<string, string> = Object.fromEntries(
  ([] as ExoWorldSpec[]).concat(
    k90Worlds(),
    hdWorlds(),
    t1Worlds(),
    EXO_WORLDS_BY_VIEW.exo_kepler_452
  ).map((w) => [w.shopItemId, w.image])
)

export function sumExoSystemFocusMinutes(view: ExhibitionExoView, aggregates: GalaxyAggregates): number {
  return exoWorldsForView(view).reduce(
    (s, w) => s + (aggregates.focusMinutesByPlanetId[w.planetStyleId] ?? 0),
    0
  )
}

export function sumExoSystemStardust(view: ExhibitionExoView, aggregates: GalaxyAggregates): number {
  return exoWorldsForView(view).reduce(
    (s, w) => s + (aggregates.stardustByPlanetId[w.planetStyleId] ?? 0),
    0
  )
}
