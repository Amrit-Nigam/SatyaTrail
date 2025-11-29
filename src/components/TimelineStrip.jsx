import { motion } from 'framer-motion'
import { cn, formatTime, getRoleColor, getRoleLabel } from '../lib/utils'

/**
 * Horizontal timeline showing key events for a NewsNode
 */
export default function TimelineStrip({ events, onSelect, selectedId }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-4 text-center text-nb-ink/60">
        No timeline events available
      </div>
    )
  }

  return (
    <div className="relative py-4">
      {/* Timeline Line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/30 rounded-full -translate-y-1/2" />

      {/* Events Container */}
      <div className="relative flex gap-4 overflow-x-auto pt-2 pb-2 scrollbar-hide">
        {events.map((event, index) => {
          const isSelected = selectedId === event.id
          const roleColor = getRoleColor(event.role)

          return (
            <motion.button
              key={event.id}
              onClick={() => onSelect?.(event.id)}
              className={cn(
                'relative flex-shrink-0 px-4 py-2 rounded-lg border transition-all',
                isSelected
                  ? 'bg-black text-white border-black'
                  : 'bg-white border border-black/30 hover:bg-gray-100 hover:border-black/50'
              )}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              data-testid="timeline-event"
            >
              {/* Role Indicator - with colors */}
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-black"
                style={{ backgroundColor: roleColor }}
              />

              {/* Content */}
              <div className="text-left min-w-[120px]">
                <p className={cn(
                  "font-semibold text-sm truncate",
                  isSelected ? 'text-white' : 'text-black'
                )}>
                  {event.source?.name || 'Unknown'}
                </p>
                <p className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-white/80' : 'text-black/70'
                )}>
                  {getRoleLabel(event.role)}
                </p>
                <p className={cn(
                  'text-xs mt-1',
                  isSelected ? 'text-white/70' : 'text-black/60'
                )}>
                  {formatTime(event.time)}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Legend - with colors */}
      <div className="flex gap-4 mt-4 justify-center flex-wrap">
        {['origin', 'amplifier', 'debunker', 'commentary'].map((role) => (
          <div key={role} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-3 h-3 rounded-full border border-black"
              style={{ backgroundColor: getRoleColor(role) }}
            />
            <span className="text-black font-semibold">{getRoleLabel(role)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

