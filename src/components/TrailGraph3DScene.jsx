import { memo, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import TrailGraph3DNode from './TrailGraph3DNode'
import TrailGraph3DEdge from './TrailGraph3DEdge'
import { getRoleColor } from '../lib/utils'

/**
 * 3D Scene component for the Trail Graph
 * Manages the 3D layout of nodes and edges
 */
function TrailGraph3DScene({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick
}) {
  const { camera } = useThree()

  // Calculate 3D positions for nodes using a force-directed style layout
  const nodePositions = useMemo(() => {
    if (!nodes || nodes.length === 0) return new Map()

    const positions = new Map()
    const roleOrder = ['origin', 'amplifier', 'debunker', 'commentary']
    
    // Group nodes by role
    const grouped = {}
    roleOrder.forEach(role => { grouped[role] = [] })
    nodes.forEach(node => {
      if (grouped[node.role]) {
        grouped[node.role].push(node)
      } else {
        grouped['commentary'].push(node)
      }
    })

    // Position nodes in 3D space - spherical distribution by role
    const radius = 1.5
    
    roleOrder.forEach((role, roleIndex) => {
      const roleNodes = grouped[role]
      const angleOffset = (roleIndex / roleOrder.length) * Math.PI * 2
      
      roleNodes.forEach((node, nodeIndex) => {
        const totalInRole = roleNodes.length
        const verticalSpread = totalInRole > 1 
          ? (nodeIndex / (totalInRole - 1)) * 0.8 - 0.4 
          : 0
        
        // Spiral pattern for each role cluster
        const spiralAngle = angleOffset + (nodeIndex * 0.3)
        const radiusVariation = radius * (0.8 + (nodeIndex % 3) * 0.15)
        
        const x = Math.cos(spiralAngle) * radiusVariation
        const y = verticalSpread + Math.sin(nodeIndex * 0.5) * 0.2
        const z = Math.sin(spiralAngle) * radiusVariation
        
        positions.set(node.id, [x, y, z])
      })
    })

    return positions
  }, [nodes])

  // Process edges with positions
  const processedEdges = useMemo(() => {
    if (!edges || edges.length === 0) return []

    return edges
      .map(edge => {
        const startPos = nodePositions.get(edge.fromNodeId)
        const endPos = nodePositions.get(edge.toNodeId)
        
        if (!startPos || !endPos) return null
        
        return {
          id: edge.id,
          start: startPos,
          end: endPos,
          relationType: edge.relationType || 'related'
        }
      })
      .filter(Boolean)
  }, [edges, nodePositions])

  // Process nodes with positions and colors
  const processedNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return []

    return nodes.map(node => {
      const position = nodePositions.get(node.id) || [0, 0, 0]
      const color = getRoleColor(node.role)
      
      return {
        ...node,
        position,
        color,
        isSelected: selectedNodeId === node.id
      }
    })
  }, [nodes, nodePositions, selectedNodeId])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#ffffff" />
      
      {/* Grid helper for depth perception - dark theme colors */}
      <gridHelper args={[4, 20, '#374151', '#1f2937']} position={[0, -1, 0]} />
      
      {/* Main group containing all elements */}
      <group>
        {/* Edges (render first so they appear behind nodes) */}
        {processedEdges.map((edge) => (
          <TrailGraph3DEdge
            key={edge.id}
            start={edge.start}
            end={edge.end}
            relationType={edge.relationType}
            isHighlighted={false}
          />
        ))}
        
        {/* Nodes */}
        {processedNodes.map((node) => (
          <TrailGraph3DNode
            key={node.id}
            position={node.position}
            nodeId={node.id}
            color={node.color}
            isSelected={node.isSelected}
            label={node.source?.name || 'Unknown'}
            role={node.role}
            onClick={onNodeClick}
          />
        ))}
      </group>
    </>
  )
}

export default memo(TrailGraph3DScene)

