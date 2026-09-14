import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bath, BedDouble, Building2, Heart, LoaderCircle, MapPin, Trash2 } from 'lucide-react'
import { Button, EmptyState, useToast } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import type { Property, PropertyStatus } from './types'
import { displayPropertyType } from './types'
import { useFavorites } from './useFavorites'

export function FavoritesPage() {
  const { user } = useAuth()
  const { favoriteIds, toggle } = useFavorites()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!supabase || !user || favoriteIds.size === 0) { setProperties([]); setLoading(false); return }
    let cancelled = false
    ;(async () => {
      try {
        const ids = Array.from(favoriteIds)
        const { data, error } = await supabase.from('properties').select('*').in('id', ids)
        if (!cancelled) {
          if (error) { console.error('favorites properties load error:', error); setProperties([]) }
          else setProperties((data as any[]).map(r => ({
            id: r.id, ownerId: r.owner_id, title: r.title, description: r.description, price: Number(r.price),
            purpose: r.purpose, propertyType: r.property_type, customPropertyType: r.custom_property_type ?? undefined,
            bedrooms: r.bedrooms, bathrooms: r.bathrooms, kitchen: r.kitchen, parking: r.parking, squareFeet: r.square_feet,
            city: r.city, area: r.area, address: r.address, mapLocation: `${r.latitude},${r.longitude}`,
            latitude: Number(r.latitude), longitude: Number(r.longitude), images: r.images ?? [],
            status: r.status as PropertyStatus, createdAt: r.created_at, updatedAt: r.updated_at,
            sellerName: r.seller_name ?? '', sellerWhatsApp: r.seller_whatsapp ?? '', featured: r.featured ?? false,
          } as Property)))
        }
      } catch { if (!cancelled) setProperties([]) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [user, favoriteIds])

  const handleRemove = async (propertyId: string) => {
    setToggling(propertyId)
    try {
      await toggle(propertyId)
      setProperties(prev => prev.filter(p => p.id !== propertyId))
      toast('Removed from favorites.')
    } catch { toast('Could not remove favorite.', 'error') }
    finally { setToggling(null) }
  }

  if (loading) return <div className="mx-auto max-w-5xl"><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"/>)}</div></div>

  return <div className="mx-auto max-w-5xl">
    <p className="text-sm font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Saved</p>
    <h1 className="mt-2 font-display text-3xl font-semibold">Your favorites</h1>
    <p className="mt-2 text-slate-500">Properties you've saved for later.</p>

    {properties.length === 0
      ? <div className="mt-8"><EmptyState icon={<Heart/>} title="No favorites yet" description="Tap the heart icon on any property to save it here."/></div>
      : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{properties.map(p => <FavoriteCard key={p.id} property={p} removing={toggling === p.id} onRemove={() => void handleRemove(p.id)}/>)}</div>
    }
  </div>
}

function FavoriteCard({ property: p, removing, onRemove }: { property: Property; removing: boolean; onRemove: () => void }) {
  return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
    <div className="relative aspect-[4/3] overflow-hidden">
      <Link to={`/dashboard/property/${p.id}`}><img src={p.images[0]} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></Link>
      <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">For {p.purpose}</span>
      <button onClick={onRemove} disabled={removing} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-rose-500 disabled:opacity-50" aria-label="Remove from favorites">
        {removing ? <LoaderCircle className="size-4 animate-spin"/> : <Trash2 className="size-4"/>}
      </button>
    </div>
    <div className="p-4">
      <p className="text-xs text-slate-500">{displayPropertyType(p)} · {p.area}</p>
      <Link to={`/dashboard/property/${p.id}`}><h3 className="mt-1 truncate font-display text-lg font-semibold hover:text-teal-700">{p.title}</h3></Link>
      <p className="mt-1 flex gap-1 text-xs text-slate-500"><MapPin className="size-3"/>{p.city}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-display font-bold text-teal-700">Rs. {p.price.toLocaleString()}</p>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><BedDouble className="size-3"/>{p.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="size-3"/>{p.bathrooms}</span>
        </div>
      </div>
    </div>
  </article>
}
