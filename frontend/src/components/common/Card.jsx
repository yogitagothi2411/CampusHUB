/**
 * Base Card component adhering to the pastel design system
 */
export default function Card({
  children,
  className = '',
  interactive = false,
  padding = 'p-6',
  ...props
}) {
  const baseClass = interactive ? 'card-pastel-interactive' : 'card-pastel'

  return (
    <div className={`${baseClass} ${padding} ${className}`} {...props}>
      {children}
    </div>
  )
}
