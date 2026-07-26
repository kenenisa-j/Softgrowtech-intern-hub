import { createContext, useState, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5001/api/v1' : '/api/v1';
axios.defaults.baseURL = API_BASE_URL;

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const navigate = useNavigate()

  // Lazy initializers: read from storage once synchronously on mount
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ims_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('ims_token') || null)
  const loading = false

  const login = async (email, password, tenantId) => {
    try {
      const response = await axios.post('/auth/login', { email, password, tenantId })
      const { token: jwt, user: loggedUser } = response.data
      setUser(loggedUser)
      setToken(jwt)
      localStorage.setItem('ims_user', JSON.stringify(loggedUser))
      localStorage.setItem('ims_token', jwt)
      // redirect based on role
      const userRole = (loggedUser.role || '').toUpperCase();
      if (userRole === 'SUPERADMIN') {
        navigate('/superadmin/dashboard');
      } else if (userRole === 'ORG_ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'MENTOR') {
        navigate('/mentor/dashboard');
      } else if (userRole === 'INTERN') {
        navigate('/intern/dashboard');
      } else if (userRole === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error', err)
      throw err
    }
  }

  const setAuthData = (jwt, loggedUser) => {
    setUser(loggedUser)
    setToken(jwt)
    localStorage.setItem('ims_user', JSON.stringify(loggedUser))
    localStorage.setItem('ims_token', jwt)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ims_user')
    localStorage.removeItem('ims_token')
    navigate('/login')
  }

  // Memoize authAxios so its reference is stable unless token changes.
  // Without this, every render creates a new axios instance, causing
  // useCallback/useEffect deps to fire on every render → infinite loops.
  const authAxios = useMemo(() => axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  }), [token])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, authAxios, setAuthData }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

