import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5001/api/v1' : '/api/v1';
axios.defaults.baseURL = API_BASE_URL;

export const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ims_user')
    const storedToken = localStorage.getItem('ims_token')
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  const login = async (email, password, tenantId) => {
    try {
      const response = await axios.post('/auth/login', { email, password, tenantId })
      const { token: jwt, user: loggedUser } = response.data
      setUser(loggedUser)
      setToken(jwt)
      localStorage.setItem('ims_user', JSON.stringify(loggedUser))
      localStorage.setItem('ims_token', jwt)
      // redirect based on role
      if (loggedUser.role === 'intern') {
        navigate('/intern')
      } else {
        navigate('/mentor')
      }
    } catch (err) {
      console.error('Login error', err)
      throw err
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ims_user')
    localStorage.removeItem('ims_token')
    navigate('/login')
  }

  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  })

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, authAxios }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
