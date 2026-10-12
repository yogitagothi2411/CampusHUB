/**
 * Base Badge / Pill component — deeper pastel tones for better contrast
 */
export default function Badge({
  children,
  variant = 'lavender',
  size = 'md',
  className = '',
  icon: Icon = null,
  ...props
}) {
  const variantStyles = {
    lavender: 'bg-[#d9d2f0] text-[#3e3568] border-[#c8bfdf]',
    blush:    'bg-[#f0c8d4] text-[#5c2d3c] border-[#e6b8c6]',
    powder:   'bg-[#c8dcf2] text-[#1e3d5e] border-[#b8cee8]',
    peach:    'bg-[#f5d4c0] text-[#5c3520] border-[#e8c4ac]',
    mauve:    'bg-[#c8bdd6] text-[#3a2d4b] border-[#b8adc8]',
    neutral:  'bg-[#ddd8e8] text-[#3e3860] border-[#cdc7da]',
    success:  'bg-[#c8e6c8] text-[#1a5c1a] border-[#a8d4a8]',
    danger:   'bg-[#f0c8d4] text-[#7a2840] border-[#e6b8c6]',
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${
        variantStyles[variant] || variantStyles.lavender
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  )
}
