import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Archive, Bath, BedDouble, Building2, CarFront, DollarSign, Edit3, Eye, EyeOff, Filter, Heart, HousePlus, MapPin, MessageCircle, MoreHorizontal, Plus, Search, Square, Trash2, X } from 'lucide-react'
import { Button, EmptyState, Input, useToast } from '../../components/ui'
import { useProperties } from './property-store'
import { PropertyForm } from './PropertyForm'
import type { Property, PropertyStatus } from './types'
import { displayPropertyType } from './types'
import type { PropertyFormValues } from './schema'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

type SellerStats = {
  totalListings: number
  publishedCount: number
  draftCount: number
  soldCount: number
  rentedCount: number
  totalViews: number
  totalFavorites: number
  totalInquiries: number
}

type PropertyStat = { propertyId: string; views: number; favorites: number }

export function PropertiesPage() {
  const { properties, error, refresh, remove, setStatus } = useProperties()
  const { user } = useAuth()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all'|PropertyStatus>('all')
  const [deleteItem, setDeleteItem] = useState<Property|null>(null)
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [propStats, setPropStats] = useState<Record<string, PropertyStat>>({})

  useEffect(() => {
    if (!supabase || !user) return
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('get_seller_stats')
        if (error) { console.error('get_seller_stats error:', error); return }
        if (data && data[0]) {
          const row = data[0]
          setStats({
            totalListings: Number(row.total_listings ?? 0),
            publishedCount: Number(row.published_count ?? 0),
            draftCount: Number(row.draft_count ?? 0),
            soldCount: Number(row.sold_count ?? 0),
            rentedCount: Number(row.rented_count ?? 0),
            totalViews: Number(row.total_views ?? 0),
            totalFavorites: Number(row.total_favorites ?? 0),
            totalInquiries: Number(row.total_inquiries ?? 0),
          })
        } else {
          setStats({ totalListings: 0, publishedCount: 0, draftCount: 0, soldCount: 0, rentedCount: 0, totalViews: 0, totalFavorites: 0, totalInquiries: 0 })
        }
      } catch {
        setStats({ totalListings: 0, publishedCount: 0, draftCount: 0, soldCount: 0, rentedCount: 0, totalViews: 0, totalFavorites: 0, totalInquiries: 0 })
      }
    })()
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('get_seller_property_stats')
        if (error) { console.error('get_seller_property_stats error:', error); return }
        if (data) {
          const map: Record<string, PropertyStat> = {}
          for (const row of data) {
            map[row.property_id] = { propertyId: row.property_id, views: Number(row.views ?? 0), favorites: Number(row.favorites ?? 0) }
          }
          setPropStats(map)
        }
      } catch (e) { console.error('get_seller_property_stats error:', e) }
    })()
  }, [user, properties.length])

  const shown = useMemo(() => properties.filter((p) => (filter === 'all' || p.status === filter) && `${p.title} ${p.city} ${p.area}`.toLowerCase().includes(query.toLowerCase())), [properties, query, filter])
  const counts = {
    all: properties.length,
    published: properties.filter((p) => p.status === 'published').length,
    draft: properties.filter((p) => p.status === 'draft').length,
    archived: properties.filter((p) => p.status === 'archived').length,
    sold: properties.filter((p) => p.status === 'sold').length,
    rented: properties.filter((p) => p.status === 'rented').length,
  }
  const action = (property: Property, status: PropertyStatus) => {
    void setStatus(property.id, status)
    const labels: Record<PropertyStatus, string> = { published: 'Property is now live.', draft: 'Property unpublished.', archived: 'Property archived.', sold: 'Property marked as sold.', rented: 'Property marked as rented.' }
    toast(labels[status])
  }
  const confirmDelete = async () => {
    if (!deleteItem) return
    try { await remove(deleteItem.id); toast('Property deleted permanently.') } catch { toast('Could not delete property.', 'error') }
    setDeleteItem(null)
  }

  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Portfolio</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your properties</h1>
        <p className="mt-2 text-slate-500">Create, refine, and manage every listing in one place.</p>
      </div>
      {user?.marketplaceRole === 'seller' && <Link to="/dashboard/properties/new"><Button><Plus className="size-4"/>Add property</Button></Link>}
    </div>

    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
      <StatCard label="Total listings" value={stats?.totalListings ?? 0} icon={<Building2 className="size-4"/>} tone="teal"/>
      <StatCard label="Published" value={stats?.publishedCount ?? 0} icon={<Eye className="size-4"/>} tone="emerald"/>
      <StatCard label="Total views" value={stats?.totalViews ?? 0} icon={<Eye className="size-4"/>} tone="indigo"/>
      <StatCard label="Inquiries" value={stats?.totalInquiries ?? 0} icon={<MessageCircle className="size-4"/>} tone="amber"/>
    </div>

    <div className="mt-6 grid grid-cols-3 gap-3 lg:grid-cols-6">
      {(['all','published','draft','archived','sold','rented'] as const).map((item) => (
        <button key={item} onClick={() => setFilter(item)} className={`rounded-2xl border p-4 text-left transition ${filter === item ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'}`}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{item}</span>
          <span className="mt-1 block font-display text-2xl font-semibold">{counts[item]}</span>
        </button>
      ))}
    </div>

    <div className="mt-6 flex flex-wrap gap-3">
      <div className="relative min-w-60 flex-1"><Search className="absolute left-3.5 top-3 size-4 text-slate-400"/><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, city, or area…"/></div>
      <Button variant="secondary" onClick={() => setFilter('all')}><Filter className="size-4"/>Clear filters</Button>
    </div>

    {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30"><p className="font-semibold text-rose-700 dark:text-rose-300">Your properties could not be loaded</p><p className="mt-1 text-sm text-rose-600/70">{error}</p><Button className="mt-4" variant="secondary" onClick={() => void refresh()}>Try again</Button></div>
    : shown.length === 0 ? <div className="mt-6"><EmptyState icon={<Building2/>} title={filter === 'all' ? 'No properties yet' : `No ${filter} properties`} description={filter === 'all' ? 'Create your first property listing to get started.' : `You don't have any properties with status "${filter}".`}/></div>
    : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((p) => <PropertyCard key={p.id} property={p} stat={propStats[p.id]} onStatus={(s) => action(p, s)} onDelete={() => setDeleteItem(p)}/>)}</div>}

    {deleteItem && <ConfirmDelete property={deleteItem} close={() => setDeleteItem(null)} confirm={() => void confirmDelete()}/>}
  </div>
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  const colors: Record<string, string> = { teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950', emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950', indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <span className={`grid size-8 place-items-center rounded-lg ${colors[tone]}`}>{icon}</span>
    <p className="mt-3 font-display text-xl font-semibold">{value.toLocaleString()}</p>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
}

function PropertyCard({ property, stat, onStatus, onDelete }: { property:Property; stat?:PropertyStat; onStatus:(status:PropertyStatus)=>void; onDelete:()=>void }) {
  const [menu, setMenu] = useState(false)
  return <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
      <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"/>
      <div className="absolute left-3 top-3 flex gap-2">
        <StatusBadge status={property.status}/>
        <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-700 backdrop-blur">For {property.purpose}</span>
      </div>
      {stat && (stat.views > 0 || stat.favorites > 0) && <div className="absolute bottom-3 left-3 flex gap-2">
        {stat.views > 0 && <span className="flex items-center gap-1 rounded-lg bg-slate-900/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur"><Eye className="size-3"/>{stat.views}</span>}
        {stat.favorites > 0 && <span className="flex items-center gap-1 rounded-lg bg-slate-900/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur"><Heart className="size-3"/>{stat.favorites}</span>}
      </div>}
      <div className="absolute right-3 top-3">
        <button onClick={() => setMenu(!menu)} className="grid size-9 place-items-center rounded-xl bg-white/90 text-slate-700 shadow-sm backdrop-blur" aria-label="Property actions"><MoreHorizontal className="size-5"/></button>
        {menu && <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <Link to={`/dashboard/properties/${property.id}/edit`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><Edit3 className="size-4"/>Edit property</Link>
          {property.status !== 'published' && <MenuButton icon={<Eye/>} label="Publish" onClick={() => { onStatus('published'); setMenu(false) }}/>}
          {property.status === 'published' && <MenuButton icon={<EyeOff/>} label="Unpublish (Draft)" onClick={() => { onStatus('draft'); setMenu(false) }}/>}
          {property.status !== 'archived' && <MenuButton icon={<Archive/>} label="Archive" onClick={() => { onStatus('archived'); setMenu(false) }}/>}
          {property.status !== 'sold' && <MenuButton icon={<DollarSign/>} label="Mark as Sold" onClick={() => { onStatus('sold'); setMenu(false) }}/>}
          {property.status !== 'rented' && property.purpose === 'rent' && <MenuButton icon={<DollarSign/>} label="Mark as Rented" onClick={() => { onStatus('rented'); setMenu(false) }}/>}
          <MenuButton danger icon={<Trash2/>} label="Delete" onClick={() => { onDelete(); setMenu(false) }}/>
        </div>}
      </div>
    </div>
    <div className="p-4">
      <Link to={`/dashboard/property/${property.id}`}><h3 className="truncate font-display text-lg font-semibold hover:text-teal-700">{property.title}</h3></Link>
      <p className="mt-1 text-xs text-slate-500">{property.area}, {property.city}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-display font-bold text-teal-700">Rs. {property.price.toLocaleString()}</p>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><BedDouble className="size-3"/>{property.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="size-3"/>{property.bathrooms}</span>
          <span className="flex items-center gap-1"><Square className="size-3"/>{property.squareFeet.toLocaleString()}</span>
        </div>
      </div>
      {stat && <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
        <span className="flex items-center gap-1"><Eye className="size-3"/>{stat.views} views</span>
        <span className="flex items-center gap-1"><Heart className="size-3"/>{stat.favorites} favorites</span>
      </div>}
    </div>
  </article>
}

function StatusBadge({ status }: { status:PropertyStatus }) {
  const style:Record<PropertyStatus,string> = { published:'bg-emerald-600 text-white', draft:'bg-amber-400 text-amber-950', archived:'bg-slate-700 text-white', sold:'bg-violet-600 text-white', rented:'bg-blue-600 text-white' }
  return <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${style[status]}`}>{status}</span>
}
function Amenity({ icon,value }: { icon:React.ReactNode; value:string|number }) { return <span className="flex items-center gap-1">{icon}{value}</span> }
function MenuButton({ icon,label,onClick,danger }: { icon:React.ReactNode;label:string;onClick:()=>void;danger?:boolean }) { return <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${danger ? 'text-rose-600':''}`}>{icon}{label}</button> }
function ConfirmDelete({ property,close,confirm }: { property:Property;close:()=>void;confirm:()=>void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><button className="ml-auto grid size-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={close}><X className="size-4"/></button><div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950"><Trash2/></div><h2 className="mt-5 font-display text-xl font-semibold">Delete this property?</h2><p className="mt-2 text-sm leading-6 text-slate-500"><strong className="text-slate-700 dark:text-slate-300">{property.title}</strong> and its listing data will be permanently removed. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={close}>Cancel</Button><Button variant="danger" onClick={confirm}>Delete permanently</Button></div></div></div> }

export function NewPropertyPage() {
  const { user } = useAuth()
  const { create } = useProperties()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  if (user?.marketplaceRole !== 'seller') return <Navigate to="/dashboard" replace />
  const save = async (values: PropertyFormValues, publish: boolean) => {
    try {
      const property = await create(values, publish)
      toast(publish ? `Saved to the database and published. Reference: ${property.id.slice(0,8)}.` : 'Saved to the database as a private draft. Publish it before other accounts can discover it.')
      navigate('/dashboard/properties')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Property could not be saved.', 'error')
    }
  }
  const studioPrefill = (location.state as { studioPrefill?: Partial<PropertyFormValues> } | null)?.studioPrefill
  return <div className="mx-auto max-w-7xl"><PropertyForm initial={studioPrefill} onSave={(values, publish) => void save(values, publish)}/></div>
}
export function EditPropertyPage() {
  const { user } = useAuth()
  const { id } = useParams()
  const { get, update, setStatus, loading } = useProperties()
  const navigate = useNavigate()
  const { toast } = useToast()
  if (user?.marketplaceRole !== 'seller') return <Navigate to="/dashboard" replace />
  const property = get(id ?? '')
  if (loading) return <div className="p-8 text-center text-sm text-slate-500">Loading property…</div>
  if (!property) return <Navigate to="/dashboard/properties" replace />
  const save = async (values: PropertyFormValues, publish: boolean) => {
    try {
      await update(property.id, values)
      const target = publish ? 'published' : 'draft'
      if (property.status !== target) await setStatus(property.id, target)
      toast(publish ? 'Property changes saved and published.' : 'Property changes saved.')
      navigate('/dashboard/properties')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Changes could not be saved.', 'error')
    }
  }
  return <div className="mx-auto max-w-7xl"><PropertyForm property={property} onSave={(values, publish) => void save(values, publish)}/></div>
}
