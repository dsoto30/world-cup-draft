'use client'

import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { memo, Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'

type FlagPattern = {
  name: string
  imageCode: string
}

const FLAGS: FlagPattern[] = [
  { name: 'Argentina', imageCode: 'ar' },
  { name: 'Australia', imageCode: 'au' },
  { name: 'Belgium', imageCode: 'be' },
  { name: 'Brazil', imageCode: 'br' },
  { name: 'Cameroon', imageCode: 'cm' },
  { name: 'Canada', imageCode: 'ca' },
  { name: 'Costa Rica', imageCode: 'cr' },
  { name: 'Croatia', imageCode: 'hr' },
  { name: 'Denmark', imageCode: 'dk' },
  { name: 'Ecuador', imageCode: 'ec' },
  { name: 'England', imageCode: 'gb-eng' },
  { name: 'France', imageCode: 'fr' },
  { name: 'Germany', imageCode: 'de' },
  { name: 'Ghana', imageCode: 'gh' },
  { name: 'Iran', imageCode: 'ir' },
  { name: 'Japan', imageCode: 'jp' },
  { name: 'Mexico', imageCode: 'mx' },
  { name: 'Morocco', imageCode: 'ma' },
  { name: 'Netherlands', imageCode: 'nl' },
  { name: 'Poland', imageCode: 'pl' },
  { name: 'Portugal', imageCode: 'pt' },
  { name: 'Qatar', imageCode: 'qa' },
  { name: 'Saudi Arabia', imageCode: 'sa' },
  { name: 'Senegal', imageCode: 'sn' },
  { name: 'Serbia', imageCode: 'rs' },
  { name: 'South Korea', imageCode: 'kr' },
  { name: 'Spain', imageCode: 'es' },
  { name: 'Switzerland', imageCode: 'ch' },
  { name: 'Tunisia', imageCode: 'tn' },
  { name: 'United States', imageCode: 'us' },
  { name: 'Uruguay', imageCode: 'uy' },
  { name: 'Wales', imageCode: 'gb-wls' },
]

const CONFETTI_COLORS = ['#f2ca50', '#86d89d', '#ffbfb8', '#ffffff', '#ed2939', '#21468b']

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function useFlagTextures() {
  const textures = useLoader(
    THREE.TextureLoader,
    FLAGS.map((flag) => `/flags/${flag.imageCode}.png`),
  )

  textures.forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
  })

  return textures
}

function Flag({ flag, index, texture }: { flag: FlagPattern; index: number; texture: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null)
  const { viewport } = useThree()

  const position = useMemo(() => {
    const columns = viewport.width < 4.7 ? 4 : viewport.width < 7 ? 6 : 8
    const row = Math.floor(index / columns)
    const column = index % columns
    const spread = Math.min(viewport.width * 0.9, columns * 1.28)
    const x = (column / Math.max(columns - 1, 1) - 0.5) * spread
    const y = viewport.height * 0.49 - row * (viewport.width < 4.7 ? 0.5 : 0.62)
    const z = -1.15 - row * 0.08

    return [x, y, z] as const
  }, [index, viewport.width, viewport.height])

  const scale = useMemo(
    () => (viewport.width < 4.7 ? ([0.42, 0.27, 1] as const) : ([0.62, 0.39, 1] as const)),
    [viewport.width],
  )

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return

    const time = clock.elapsedTime + index * 0.18
    mesh.rotation.y = Math.sin(time * 1.8) * 0.18
    mesh.rotation.z = Math.sin(time * 1.25) * 0.035

    const positions = mesh.geometry.attributes.position
    for (let vertex = 0; vertex < positions.count; vertex += 1) {
      const x = positions.getX(vertex)
      positions.setZ(vertex, Math.sin(time * 3 + x * 8) * 0.035)
    }
    positions.needsUpdate = true
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale} aria-label={flag.name}>
      <planeGeometry args={[1, 1, 16, 4]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
    </mesh>
  )
}

function ConfettiField() {
  const groupRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  const pieces = useMemo(
    () =>
      Array.from({ length: 86 }, (_, index) => ({
        x: (seededUnit(index, 1) - 0.5) * viewport.width * 1.14,
        y: seededUnit(index, 2) * viewport.height,
        z: seededUnit(index, 3) * 2.6 - 0.5,
        speed: 0.55 + seededUnit(index, 4) * 0.75,
        drift: (seededUnit(index, 5) - 0.5) * 0.28,
        phase: seededUnit(index, 6) * Math.PI * 2,
        size: 0.055 + seededUnit(index, 7) * 0.055,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      })),
    [viewport.width, viewport.height],
  )

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return

    group.children.forEach((child, index) => {
      const piece = pieces[index]
      const loopHeight = viewport.height + 1.3
      const progress = (clock.elapsedTime * piece.speed + piece.phase) % loopHeight

      child.position.x = piece.x + Math.sin(clock.elapsedTime * 1.7 + piece.phase) * 0.18 + piece.drift * progress
      child.position.y = viewport.height / 2 - progress
      child.position.z = piece.z
      child.rotation.x += 0.035 + piece.speed * 0.008
      child.rotation.y += 0.045 + piece.speed * 0.01
      child.rotation.z += 0.025
    })
  })

  return (
    <group ref={groupRef}>
      {pieces.map((piece, index) => (
        <mesh key={index} scale={[piece.size, piece.size * 1.8, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={piece.color} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function SceneContent() {
  const textures = useFlagTextures()

  return (
    <>
      <ambientLight intensity={1.2} />
      {FLAGS.map((flag, index) => (
        <Flag key={flag.name} flag={flag} index={index} texture={textures[index]} />
      ))}
      <ConfettiField />
    </>
  )
}

function WorldCupScene() {
  return (
    <div className="world-cup-scene pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden>
      <Canvas
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default memo(WorldCupScene)
