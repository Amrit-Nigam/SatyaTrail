import { cn } from '../lib/utils'
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 border-2 border-nb-ink rounded-nb px-4 py-2 font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nb-ink/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-nb-accent text-nb-ink shadow-nb hover:shadow-nb-sm',
        secondary: 'bg-nb-accent-2 text-nb-ink shadow-nb hover:shadow-nb-sm',
        ghost: 'bg-transparent shadow-none hover:bg-nb-ink/5',
        danger: 'bg-nb-error text-white shadow-nb hover:shadow-nb-sm'
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3'
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

