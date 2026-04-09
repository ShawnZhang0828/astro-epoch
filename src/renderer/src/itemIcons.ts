import coreMercury from './assets/planet-photos/mercury.jpg'
import coreVenus from './assets/planet-photos/venus.jpg'
import coreJupiter from './assets/planet-photos/jupiter.jpg'
import coreSaturn from './assets/planet-photos/saturn.jpg'
import coreUranus from './assets/planet-photos/uranus.jpg'
import coreNeptune from './assets/planet-photos/neptune.jpg'
import coreOrion from './assets/planet-photos/orion-nebula.jpg'
import coreCoalsack from './assets/planet-photos/coalsack.jpg'
import orbiterLogic from './assets/item-icons/orbiter-logic-sat.svg'
import orbiterEndurance from './assets/item-icons/orbiter-endurance.svg'
import atmoGlacier from './assets/item-icons/atmo-glacier.svg'
import atmoStation from './assets/item-icons/atmo-station.svg'
import atmoDeepsea from './assets/item-icons/atmo-deepsea.svg'
import themeAurora from './assets/item-icons/theme-aurora.svg'
import themeSolar from './assets/item-icons/theme-solar.svg'
import { EXO_ITEM_ICON_BY_ID } from './exhibition/exoPlanetBundles'

export const ITEM_ICON_BY_ID: Record<string, string> = {
  'core-barren': coreMercury,
  'core-venus': coreVenus,
  'core-gas-giant': coreJupiter,
  'core-cyber': coreSaturn,
  'core-uranus': coreUranus,
  'core-neptune': coreNeptune,
  'core-milky-nebula': coreOrion,
  'core-milky-void': coreCoalsack,
  'orbiter-logic-sat': orbiterLogic,
  'orbiter-endurance': orbiterEndurance,
  'atmo-glacier': atmoGlacier,
  'atmo-station': atmoStation,
  'atmo-deepsea': atmoDeepsea,
  'theme-aurora': themeAurora,
  'theme-solar': themeSolar,
  ...EXO_ITEM_ICON_BY_ID
}
