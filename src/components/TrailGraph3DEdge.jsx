import { memo, useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

/**
 * 3D Edge component for the Trail Graph
 * Renders a line between two nodes with styling based on relationship
 */
function TrailGraph3DEdge({
  start,
  end,
  relationType = 'related',
  isHighlighted = false
}) {
  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  )

  // Color based on relationship type
  const getLineColor = (type) => {
    switch (type) {
      case 'cites':
        return '#3b82f6' // Blue
      case 'contradicts':
        return '#ef4444' // Red
      case 'supports':
        return '#22c55e' // Green
      case 'related':
      default:
        return '#6b7280' // Gray
    }
  }

  const color = getLineColor(relationType)
  const opacity = isHighlighted ? 0.8 : 0.5
  const lineWidth = isHighlighted ? 2 : 1

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={relationType === 'contradicts'}
      dashSize={0.1}
      gapSize={0.05}
      toneMapped={false}
      depthTest={true}
      depthWrite={false}
    />
  )
}

export default memo(TrailGraph3DEdge)

