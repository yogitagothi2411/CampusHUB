import { createContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [token, setToken] = useState(() => authService.getToken())
  const [loading, setLoading] = useState(true)

  // Validate existing token on mount
  useEffect(() => {
    let ignore = false
    async function verifySession() {
      const existingToken = authService.getToken()
      if (!existingToken) {
        if (!ignore) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const profile = await authService.getProfile(existingToken)
        if (!ignore) {
          setUser(profile)
          localStorage.setItem('ceh_user', JSON.stringify(profile))
        }
      } catch {
        // Token expired or invalid
        if (!ignore) {
          authService.logout()
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    verifySession()
    return () => {
      ignore = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password)
    setUser(result.user)
    setToken(result.token)
    return result.user
  }, [])

  const register = useCallback(async ({ name, email, password, role }) => {
    const newUser = await authService.register({ name, email, password, role })
    // Automatically log in after registration
    const result = await authService.login(email, password)
    setUser(result.user)
    setToken(result.token)
    return newUser
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setToken(null)
  }, [])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
