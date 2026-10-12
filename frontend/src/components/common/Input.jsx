import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Reusable pastel Input component
 */
export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  icon: Icon = null,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[#6b637d] mb-1.5"
        >
          {label} {required && <span className="text-[#dfabb8]">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#9890a8]">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full rounded-xl border bg-[#ede8f6] px-3.5 py-2.5 text-sm text-[#1e1730] placeholder:text-[#9b93ac] transition-all duration-150 outline-none
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${
              error
                ? 'border-[#e6b8c6] focus:border-[#c97088] focus:ring-2 focus:ring-[#c97088]/30'
                : 'border-[#cfc7df] hover:border-[#b8adc8] focus:border-[#7a6da8] focus:ring-2 focus:ring-[#7a6da8]/25'
            }
            disabled:bg-[#e8e2f0] disabled:text-[#9890a8] disabled:cursor-not-allowed
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 flex items-center text-[#9890a8] hover:text-[#6b637d] transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-[#b85b71]">{error}</p>}
    </div>
  )
}
