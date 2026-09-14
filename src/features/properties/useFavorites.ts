import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export function useFavorites() {
  const { user } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !user) { setIds(new Set()); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.from('favorites').select('property_id').eq('user_id', user.id)
        if (!cancelled) {
          if (error) { console.error('[favorites] load error:', error.message, error.code); setIds(new Set()) }
          else setIds(new Set((data ?? []).map(r => r.property_id)))
        }
      } catch (e) { console.error('[favorites] load exception:', e); if (!cancelled) setIds(new Set()) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [user])

  const isFavorited = useCallback((propertyId: string) => ids.has(propertyId), [ids])

  const toggle = useCallback(async (propertyId: string): Promise<boolean> => {
    if (!supabase || !user) return false
    // Ensure we have a valid Supabase auth user before writing
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { console.error('[favorites] no auth user from supabase.auth.getUser()'); return false }
    const wasFavorited = ids.has(propertyId)
    setIds(prev => { const next = new Set(prev); if (wasFavorited) next.delete(propertyId); else next.add(propertyId); return next })
    try {
      if (wasFavorited) {
        const { error } = await supabase.from('favorites').delete().eq('property_id', propertyId).eq('user_id', authUser.id)
        if (error) { console.error('[favorites] delete error:', error.message, error.code, error.details); throw error }
      } else {
        const { error } = await supabase.from('favorites').insert({ property_id: propertyId, user_id: authUser.id })
        if (error) { console.error('[favorites] insert error:', error.message, error.code, error.details); throw error }
      }
      return !wasFavorited
    } catch (e) {
      setIds(prev => { const next = new Set(prev); if (wasFavorited) next.add(propertyId); else next.delete(propertyId); return next })
      throw e
    }
  }, [ids, user])

  const favoriteIds = useMemo(() => ids, [ids])

  return { favoriteIds, isFavorited, toggle, loading }
}
