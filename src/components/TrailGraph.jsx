import { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Box } from 'lucide-react'
import { getRoleColor, getRoleLabel } from '../lib/utils'
import TrailGraph3DScene from './TrailGraph3DScene'

/**
 * Controls updater to keep orbit controls running
 */
function ControlsUpdater({ controlsRef }) {
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })
  return null
}

/**
 * Main TrailGraph component - 3D visualization of news trail
 * Inspired by Cognia's MemoryMesh3D component
 */
export default function TrailGraph({ nodes, edges, selectedNodeId, onSelectNode }) {
  const controlsRef = useRef(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isCompactView, setIsCompactView] = useState(false)

  // Handle node click
  const handleNodeClick = useCallback((nodeId) => {
    onSelectNode?.(nodeId)
  }, [onSelectNode])

  // Reset camera view
  const handleReset = useCallback(() => {``
    if (controlsRef.current) {
      controlsRef.current.reset()
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }, [])

  // Toggle auto rotation
  const toggleAutoRotate = useCallback(() => {
    setAutoRotate(prev => !prev)
  }, [])

  // Toggle compact view
  const toggleCompactView = useCallback(() => {
    setIsCompactView(prev => !prev)
  }, [])

  // Keyboard shortcut for compact view
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'c' || event.key === 'C') {
        setIsCompactView(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Empty state
  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-transparent rounded-lg border border-nb-ink/30 border-dashed">
        <div className="text-center">
          <Box className="w-12 h-12 mx-auto mb-3 text-nb-ink/40" />
          <p className="text-nb-ink/70 italic text-sm">No trail data available</p>
          <p className="text-nb-ink/50 italic text-xs mt-1">Submit a claim to generate a trail</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-visible">
      {/* Controls toolbar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={toggleAutoRotate}
          className={`p-2 border border-nb-ink/30 rounded-lg hover:-translate-y-0.5 transition-transform ${
            autoRotate ? 'bg-black text-white' : 'bg-white/60 text-black'
          }`}
          title={autoRotate ? 'Stop rotation' : 'Auto rotate'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleCompactView}
          className={`p-2 border border-nb-ink/30 rounded-lg hover:-translate-y-0.5 transition-transform ${
            isCompactView ? 'bg-black text-white' : 'bg-white/60 text-black'
          }`}
          title="Toggle compact view (C)"
        >
          <Box className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white/60 text-black border border-nb-ink/30 rounded-lg hover:-translate-y-0.5 transition-transform"
          title="Reset view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Canvas */}
      <div className="h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-nb-ink/30 overflow-hidden shadow-nb relative">
        <Canvas
          camera={{
            position: isCompactView ? [2, 2, 2] : [3, 2.5, 3],
            fov: isCompactView ? 60 : 50,
            near: 0.01,
            far: 1000
          }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
          onPointerMissed={() => {
            // Optionally deselect on background click
          }}
        >
          <TrailGraph3DScene
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
          
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={15}
            zoomSpeed={1}
            panSpeed={0.8}
            rotateSpeed={0.5}
            target={[0, 0, 0]}
            enableDamping={true}
            dampingFactor={0.05}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN
            }}
          />
          <ControlsUpdater controlsRef={controlsRef} />
        </Canvas>
      </div>

      {/* Instructions overlay - moved outside canvas */}
      <div className="mt-2 bg-white/90 backdrop-blur-sm border border-nb-ink/30 rounded-lg px-3 py-2 inline-block">
        <p className="text-xs text-black">
          <span className="font-bold">Drag</span> to rotate · <span className="font-bold">Scroll</span> to zoom · <span className="font-bold">Right-click</span> to pan
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center flex-wrap">
        {['origin', 'amplifier', 'debunker', 'commentary'].map((role) => (
          <div key={role} className="flex items-center gap-2 text-sm">
            <div
              className="w-5 h-5 rounded-full border border-nb-ink/30"
              style={{ backgroundColor: getRoleColor(role) }}
            />
            <span className="text-black font-semibold">{getRoleLabel(role)}</span>
          </div>
        ))}
      </div>

      {/* Selected node info */}
      {selectedNodeId && nodes && (
        <SelectedNodeInfo 
          nodes={nodes} 
          selectedNodeId={selectedNodeId} 
        />
      )}
    </div>
  )
}

/**
 * Display info about the selected node
 */
function SelectedNodeInfo({ nodes, selectedNodeId }) {
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  
  if (!selectedNode) return null
  
  return (
    <div className="mt-4 p-4 bg-transparent border border-nb-ink/30 rounded-lg">
      <div className="flex items-start gap-3">
        <div
          className="w-4 h-4 rounded-full border border-nb-ink/30 flex-shrink-0 mt-1"
          style={{ backgroundColor: getRoleColor(selectedNode.role) }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-black truncate">
            {selectedNode.source?.name || 'Unknown Source'}
          </h4>
          <p className="text-sm text-nb-ink/70 italic">
            {getRoleLabel(selectedNode.role)}
          </p>
          {selectedNode.headline && (
            <p className="text-sm text-nb-ink/90 mt-2 line-clamp-2">
              {selectedNode.headline}
            </p>
          )}
          {selectedNode.publishedAt && (
            <p className="text-xs text-nb-ink/70 italic mt-2">
              {new Date(selectedNode.publishedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
