import { createContext, useContext, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  sendOtp: (phone: string) => Promise<{ error?: string }>
  verifyOtp: (phone: string, code: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{
      session: { user: { id: 'guest', phone: null } } as unknown as Session,
      loading: false,
      sendOtp: async () => ({}),
      verifyOtp: async () => ({}),
      signOut: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
