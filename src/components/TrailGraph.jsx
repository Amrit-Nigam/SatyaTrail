import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn, getRoleColor, getRoleLabel } from '../lib/utils'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

/**
 * Render node-based source graph for a NewsNode
 * Static mock positions with simple interactivity
 */
export default function TrailGraph({ nodes, edges, selectedNodeId, onSelectNode }) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Calculate node positions in a horizontal tree-like layout
  const getNodePositions = () => {
    if (!nodes || nodes.length === 0) return {}

    const positions = {}
    const roleOrder = ['origin', 'amplifier', 'debunker', 'commentary']
    
    // Group nodes by role
    const grouped = {}
    roleOrder.forEach(role => { grouped[role] = [] })
    nodes.forEach(node => {
      if (grouped[node.role]) {
        grouped[node.role].push(node)
      }
    })

    // Position nodes
    let xOffset = 80
    roleOrder.forEach((role, colIndex) => {
      const roleNodes = grouped[role]
      const ySpacing = 120
      const yStart = (400 - roleNodes.length * ySpacing) / 2 + 60

      roleNodes.forEach((node, rowIndex) => {
        positions[node.id] = {
          x: xOffset + colIndex * 200,
          y: yStart + rowIndex * ySpacing
        }
      })
    })

    return positions
  }

  const positions = getNodePositions()

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 2))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5))
  const handleReset = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-nb-bg rounded-nb border-2 border-nb-ink border-dashed">
        <p className="text-nb-ink/60">No trail data available</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-nb-card border-2 border-nb-ink rounded-nb shadow-nb-sm hover:-translate-y-0.5 transition-transform"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-nb-card border-2 border-nb-ink rounded-nb shadow-nb-sm hover:-translate-y-0.5 transition-transform"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-nb-card border-2 border-nb-ink rounded-nb shadow-nb-sm hover:-translate-y-0.5 transition-transform"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        className="relative h-[400px] bg-nb-bg rounded-nb border-2 border-nb-ink overflow-hidden"
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Edges */}
          {edges?.map((edge) => {
            const fromPos = positions[edge.fromNodeId]
            const toPos = positions[edge.toNodeId]
            if (!fromPos || !toPos) return null

            return (
              <g key={edge.id} data-testid="trail-edge">
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#111"
                  strokeWidth="2"
                  strokeDasharray="4"
                  opacity={0.3}
                />
                {/* Arrow */}
                <polygon
                  points={`
                    ${toPos.x - 10},${toPos.y - 5}
                    ${toPos.x},${toPos.y}
                    ${toPos.x - 10},${toPos.y + 5}
                  `}
                  fill="#111"
                  opacity={0.5}
                />
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions[node.id]
            if (!pos) return null

            const isSelected = selectedNodeId === node.id
            const roleColor = getRoleColor(node.role)

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode?.(node.id)}
                style={{ cursor: 'pointer' }}
                data-testid="trail-node"
              >
                {/* Node circle */}
                <motion.circle
                  r={isSelected ? 35 : 30}
                  fill={roleColor}
                  stroke="#111"
                  strokeWidth={isSelected ? 4 : 2}
                  initial={false}
                  animate={{
                    r: isSelected ? 35 : 30,
                    strokeWidth: isSelected ? 4 : 2
                  }}
                />
                {/* Shadow effect for selected */}
                {isSelected && (
                  <circle
                    r={40}
                    fill="none"
                    stroke="#111"
                    strokeWidth="2"
                    opacity="0.2"
                  />
                )}
                {/* Label */}
                <text
                  y={50}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#111"
                  className="pointer-events-none"
                >
                  {node.source?.name?.slice(0, 15) || 'Unknown'}
                </text>
                {/* Role label */}
                <text
                  y={65}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#666"
                  className="pointer-events-none"
                >
                  {getRoleLabel(node.role)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {['origin', 'amplifier', 'debunker', 'commentary'].map((role) => (
          <div key={role} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded-full border-2 border-nb-ink"
              style={{ backgroundColor: getRoleColor(role) }}
            />
            <span className="text-nb-ink/80">{getRoleLabel(role)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

