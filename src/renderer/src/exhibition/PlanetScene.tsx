import { OrbitControls, Stars, useTexture } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { Mesh, SRGBColorSpace } from 'three'

import coalsackTex from '../assets/planet-photos/coalsack.jpg'
import earthTex from '../assets/planet-photos/earth.jpg'
import europaTex from '../assets/planet-photos/europa.jpg'
import galacticTex from '../assets/planet-photos/galactic-center.jpg'
import jupiterTex from '../assets/planet-photos/jupiter.jpg'
import marsTex from '../assets/planet-photos/mars.jpg'
import mercuryTex from '../assets/planet-photos/mercury.jpg'
import neptuneTex from '../assets/planet-photos/neptune.jpg'
import orionTex from '../assets/planet-photos/orion-nebula.jpg'
import saturnTex from '../assets/planet-photos/saturn.jpg'
import uranusTex from '../assets/planet-photos/uranus.jpg'
import venusTex from '../assets/planet-photos/venus.jpg'

/** NASA / Wikimedia photography mapped to internal style ids (see assets/planet-photos/SOURCES.txt). */
const STYLE_TEXTURE: Record<string, string> = {
  earth: earthTex,
  starter: earthTex,
  barren: mercuryTex,
  venus: venusTex,
  gas: jupiterTex,
  cyber: saturnTex,
  uranus: uranusTex,
  neptune: neptuneTex,
  'milky-nebula': orionTex,
  'milky-void': coalsackTex,
  'rare-terra-prime': marsTex,
  'rare-dust-veil': europaTex,
  'rare-quasar-orchard': galacticTex
}

/** Nebula / dark-cloud skins use panorama-style photos; show Orion / Coalsack on the sphere. */
const NEBULA_STYLES = new Set(['milky-nebula', 'milky-void'])

function TexturedPlanet({ styleId }: { styleId: string }) {
  const url = STYLE_TEXTURE[styleId] ?? earthTex
  const map = useTexture(url)
  map.colorSpace = SRGBColorSpace
  const ref = useRef<Mesh>(null)
  const isNebula = NEBULA_STYLES.has(styleId)

  useFrame((_s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * (isNebula ? 0.04 : 0.14)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.35, 56, 56]} />
      <meshStandardMaterial
        map={map}
        roughness={isNebula ? 0.75 : 0.9}
        metalness={isNebula ? 0.02 : 0.05}
        emissive={isNebula ? '#1a1530' : '#000000'}
        emissiveIntensity={isNebula ? 0.12 : 0}
      />
    </mesh>
  )
}

function PlanetFallback() {
  const ref = useRef<Mesh>(null)
  useFrame((_s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.12
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.35, 3]} />
      <meshStandardMaterial color="#4a5568" roughness={0.8} metalness={0.2} />
    </mesh>
  )
}

function OrbiterRings({ count }: { count: number }) {
  const ref = useRef<Mesh>(null)
  useFrame((_s, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.08
  })
  if (count <= 0) return null
  return (
    <mesh ref={ref} rotation={[0.4, 0.2, 0]}>
      <torusGeometry args={[2, 0.03, 8, 64]} />
      <meshBasicMaterial color="#c4d4ff" transparent opacity={0.55} />
    </mesh>
  )
}

export default function PlanetScene({
  styleId,
  orbiterCount
}: {
  styleId: string
  orbiterCount: number
}) {
  return (
    <div className="exhibition-canvas">
      <Canvas camera={{ position: [0, 0.4, 5.2], fov: 45 }}>
        <color attach="background" args={['#03040a']} />
        <ambientLight intensity={0.38} />
        <pointLight position={[6, 4, 6]} intensity={1.35} />
        <pointLight position={[-5, -2, 4]} intensity={0.55} color="#88aaff" />
        <Stars radius={80} depth={40} count={5000} factor={3} saturation={0} fade speed={0.5} />
        <Suspense fallback={<PlanetFallback />}>
          <TexturedPlanet styleId={styleId} />
        </Suspense>
        <OrbiterRings count={orbiterCount} />
        <OrbitControls enablePan={false} minDistance={3.2} maxDistance={9} />
      </Canvas>
    </div>
  )
}
