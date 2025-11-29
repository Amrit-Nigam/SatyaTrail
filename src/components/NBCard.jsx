import { cn } from '../lib/utils'

/**
 * Neo-Brutalist card wrapper for panels, tiles, and sections
 */
export default function NBCard({ 
  as: Component = 'div', 
  className, 
  children,
  ...props 
}) {
  return (
    <Component
      className={cn(
        'bg-white/90 border-2 border-black/40 p-6',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

