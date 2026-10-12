/**
 * Base Button component adhering to the campusEventHUB design system
 * Uses deeper pastel palette for better visual contrast
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon: Icon = null,
  iconPosition = 'left',
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  }

  const variantStyles = {
    // Deep purple — unmistakably interactive
    primary:
      'bg-[#7a6da8] hover:bg-[#6a5e98] text-white focus:ring-[#7a6da8]/50 shadow-sm active:translate-y-px',
    // Blush — soft call-to-action
    secondary:
      'bg-[#f0c8d4] hover:bg-[#e6b8c6] text-[#5c2d3c] focus:ring-[#c97088]/40 shadow-sm active:translate-y-px',
    // Powder blue
    powder:
      'bg-[#c8dcf2] hover:bg-[#bad0ea] text-[#24436b] focus:ring-[#5f8fb8]/40 shadow-sm active:translate-y-px',
    // Outline — tinted border, never plain white
    outline:
      'border border-[#cfc7df] bg-[#ede8f6] text-[#2b2438] hover:bg-[#e2dbed] focus:ring-[#7a6da8]/30 shadow-sm',
    // Ghost — transparent base
    ghost:
      'bg-transparent hover:bg-[#d9d2f0]/50 text-[#5a5168] hover:text-[#1e1730] focus:ring-[#7a6da8]/30',
    // Danger
    danger:
      'bg-[#f0c8d4] hover:bg-[#e8b5c4] text-[#7a2840] focus:ring-[#c97088]/40 shadow-sm active:translate-y-px',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  )
}
