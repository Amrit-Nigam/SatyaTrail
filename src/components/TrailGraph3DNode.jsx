import { memo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 3D Node component for the Trail Graph
 * Renders as a sphere with dynamic scaling based on camera distance
 */
function TrailGraph3DNode({
  position,
  nodeId,
  color,
  isSelected,
  label,
  role,
  onClick
}) {
  const meshRef = useRef(null)
  const groupRef = useRef(null)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)

  // Base size and opacity
  const baseSize = 0.18
  const opacity = 0.95

  // Dynamic scaling based on camera distance
  useFrame(() => {
    if (!meshRef.current || !groupRef.current) return
    
    const nodePosition = groupRef.current.position
    const distance = camera.position.distanceTo(nodePosition)
    
    const fovRad = camera instanceof THREE.PerspectiveCamera && camera.fov
      ? (camera.fov * Math.PI) / 180
      : (60 * Math.PI) / 180
    
    const worldPerceivedScale = Math.tan(fovRad / 2) * 2
    const dynamicScale = Math.min(6, Math.max(0.25, distance * worldPerceivedScale * 0.15))
    
    const emphasis = isSelected ? 1.6 : 1.0
    const hoverBoost = hovered ? 1.2 : 1.0
    
    meshRef.current.scale.setScalar(dynamicScale * emphasis * hoverBoost)
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(nodeId)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 1.0 : opacity}
          roughness={0.4}
          metalness={0.1}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.4, baseSize * 1.6, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Invisible larger hitbox for easier clicking */}
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(nodeId)
        }}
      >
        <sphereGeometry args={[baseSize * 2.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

export default memo(TrailGraph3DNode)

