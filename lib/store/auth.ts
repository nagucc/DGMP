import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email?: string | null
  realName?: string | null
  avatar?: string | null
  roles?: any[]
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false
        }),
      clearAuth: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false
        })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => ({
        onSuccess: () => {
          console.log('Auth state rehydrated successfully')
        },
        onError: (error) => {
          console.error('Error rehydrating auth state:', error)
        }
      })
    }
  )
)
