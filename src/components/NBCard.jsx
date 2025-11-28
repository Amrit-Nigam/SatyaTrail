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
        'bg-nb-card border-2 border-nb-ink shadow-nb rounded-nb p-5',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

