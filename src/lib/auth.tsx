import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type MarketplaceRole = 'buyer' | 'seller'
export type User = {
  id: string
  name: string
  email: string
  role: 'Member' | 'Admin'
  marketplaceRole: MarketplaceRole
  joinedAt: string
  avatarUrl: string | null
}

export type AuthContextValue = {
  user: User | null
  loading: boolean
  isRecovery: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (name: string, email: string, password: string, marketplaceRole: MarketplaceRole) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (name: string) => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>
  updatePassword: (newPassword: string) => Promise<{ error?: string; success?: boolean }>
  cancelRecovery: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(u: SupabaseUser, profile?: { full_name?: string; avatar_url?: string | null; marketplace_role?: MarketplaceRole } | null): User {
  return {
    id: u.id,
    name: profile?.full_name || String(u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'Member'),
    email: u.email ?? '',
    role: u.app_metadata?.role === 'admin' ? 'Admin' : 'Member',
    marketplaceRole: profile?.marketplace_role ?? 'buyer',
    joinedAt: u.created_at,
    avatarUrl: profile?.avatar_url ?? (u.user_metadata?.avatar_url as string | null) ?? null,
  }
}

function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid email or password')) return 'Email or password is incorrect.'
  if (m.includes('email not confirmed')) return 'Please verify your email before signing in.'
  if (m.includes('user already registered')) return 'An account with this email already exists.'
  if (m.includes('password should be at least')) return 'Password must be at least 8 characters.'
  if (m.includes('unable to validate email address')) return 'Please enter a valid email address.'
  if (m.includes('new password should be different')) return 'Your new password must be different from the old one.'
  if (m.includes('session not found') || m.includes('invalid token') || m.includes('expired')) return 'This link has expired. Please request a new password reset.'
  if (m.includes('rate limit')) return 'Too many attempts. Please try again later.'
  return 'Something went wrong. Please try again.'
}

const RECOVERY_STORAGE_KEY = 'gharhub:password-recovery'

function readRecoveryFlag(): boolean {
  try {
    return window.localStorage.getItem(RECOVERY_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeRecoveryFlag(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(RECOVERY_STORAGE_KEY, '1')
    else window.localStorage.removeItem(RECOVERY_STORAGE_KEY)
  } catch {
    return
  }
}

async function fetchProfile(userId: string): Promise<{ full_name: string; avatar_url: string | null; marketplace_role: MarketplaceRole } | null> {
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('full_name, avatar_url, marketplace_role').eq('user_id', userId).maybeSingle()
  if (!data) return null
  return { full_name: data.full_name, avatar_url: data.avatar_url, marketplace_role: (data.marketplace_role as MarketplaceRole) ?? 'buyer' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) {
      void Promise.resolve().then(() => setLoading(false))
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        if (readRecoveryFlag()) setIsRecovery(true)
        try {
          const profile = await fetchProfile(data.session.user.id)
          setUser(mapUser(data.session.user, profile))
        } catch {
          setUser(mapUser(data.session.user))
        }
      } else {
        writeRecoveryFlag(false)
        setIsRecovery(false)
      }
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        writeRecoveryFlag(true)
        setIsRecovery(true)
        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user.id)
            setUser(mapUser(session.user, profile))
          } catch {
            setUser(mapUser(session.user))
          }
        }
      } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_IN') {
          writeRecoveryFlag(false)
          setIsRecovery(false)
        } else if (session?.user) {
          if (readRecoveryFlag()) setIsRecovery(true)
        } else {
          writeRecoveryFlag(false)
          setIsRecovery(false)
        }
        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user.id)
            setUser(mapUser(session.user, profile))
          } catch {
            setUser(mapUser(session.user))
          }
        }
      } else if (event === 'SIGNED_OUT') {
        writeRecoveryFlag(false)
        setIsRecovery(false)
        setUser(null)
      }
      setLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Authentication is not configured.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: friendlyError(error.message) }
    return {}
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string, marketplaceRole: MarketplaceRole) => {
    if (!supabase) return { error: 'Authentication is not configured.' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, marketplace_role: marketplaceRole } },
    })
    if (error) return { error: friendlyError(error.message) }
    if (data.user && !data.session) {
      return { error: '__EMAIL_CONFIRMATION__' }
    }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    setUser(null)
    if (supabase) await supabase.auth.signOut()
  }, [])

  const updateProfile = useCallback(async (name: string) => {
    setUser((prev) => prev ? { ...prev, name } : null)
    if (supabase) {
      await supabase.auth.updateUser({ data: { full_name: name } })
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        await supabase.from('profiles').upsert({ user_id: authUser.id, full_name: name }, { onConflict: 'user_id' })
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!supabase) return
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const profile = await fetchProfile(authUser.id)
      setUser(mapUser(authUser, profile))
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Authentication is not configured.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: friendlyError(error.message) }
    return { success: true }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) return { error: 'Authentication is not configured.' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: friendlyError(error.message) }
    writeRecoveryFlag(false)
    setIsRecovery(false)
    return { success: true }
  }, [])

  const cancelRecovery = useCallback(async () => {
    writeRecoveryFlag(false)
    setIsRecovery(false)
    setUser(null)
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch {
        return
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isRecovery,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    cancelRecovery,
    refreshProfile,
  }), [user, loading, isRecovery, signIn, signUp, signOut, updateProfile, resetPassword, updatePassword, cancelRecovery, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
