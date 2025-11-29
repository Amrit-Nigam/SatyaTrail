import { cn } from '../lib/utils'
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 border-2 border-nb-ink px-6 py-3 font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nb-ink disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm',
  {
    variants: {
      variant: {
        primary: 'bg-nb-ink text-nb-bg',
        secondary: 'bg-nb-accent-2 text-nb-ink',
        ghost: 'bg-transparent hover:bg-nb-ink/5',
        danger: 'bg-nb-error text-white'
      },
      size: {
        sm: 'text-xs px-4 py-2',
        md: 'text-sm px-5 py-2.5',
        lg: 'text-base px-8 py-4'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

/**
 * Neo-Brutalist button component
 */
export default function NBButton({ 
  variant, 
  size,
  icon: Icon, 
  onClick, 
  disabled, 
  className,
  children,
  type = 'button',
  ...props 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  )
}

