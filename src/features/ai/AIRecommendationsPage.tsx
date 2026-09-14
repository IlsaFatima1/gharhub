import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'
import { Button, EmptyState, Input } from '../../components/ui'
import { useAllPublishedProperties } from '../properties/property-store'
import { KARACHI_AREAS } from '../../lib/karachi'
import { aiService } from './ai-service'
import type { RecommendationMatch, RecommendationPreference } from './types'
import type { Property } from '../properties/types'

type Prefs = { purpose: '' | 'sale' | 'rent'; area: string; propertyType: string; minPrice: string; maxPrice: string; minSquareFeet: string; maxSquareFeet: string; bedrooms: string; bathrooms: string }
const emptyPrefs: Prefs = { purpose: '', area: '', propertyType: '', minPrice: '', maxPrice: '', minSquareFeet: '', maxSquareFeet: '', bedrooms: '', bathrooms: '' }

export function AIRecommendationsPage() {
  const { properties: catalog, loading: propertiesLoading } = useAllPublishedProperties()
  const [prefs, setPrefs] = useState<Prefs>(emptyPrefs)
  const [referenceId, setReferenceId] = useState('')
  const [result, setResult] = useState<{ ids: string[]; reason: string; matches: RecommendationMatch[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs((p) => ({ ...p, [key]: value }))

  const find = async () => {
    const preferences: RecommendationPreference = {}
    if (prefs.purpose) preferences.purpose = prefs.purpose
    if (prefs.area) preferences.area = prefs.area
    if (prefs.propertyType) preferences.propertyType = prefs.propertyType
    const minPrice = Number(prefs.minPrice) || 0
    const maxPrice = Number(prefs.maxPrice) || 0
    const minSquareFeet = Number(prefs.minSquareFeet) || 0
    const maxSquareFeet = Number(prefs.maxSquareFeet) || 0
    const bedrooms = Number(prefs.bedrooms) || 0
    const bathrooms = Number(prefs.bathrooms) || 0
    if (minPrice) preferences.minPrice = minPrice
    if (maxPrice) preferences.maxPrice = maxPrice
    if (minSquareFeet) preferences.minSquareFeet = minSquareFeet
    if (maxSquareFeet) preferences.maxSquareFeet = maxSquareFeet
    if (bedrooms) preferences.bedrooms = bedrooms
    if (bathrooms) preferences.bathrooms = bathrooms
    const reference = catalog.find((p) => p.id === referenceId) ?? null
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await aiService.recommend(preferences, reference, reference ? [reference.id] : [])
      setResult({ ids: res.propertyIds, reason: res.reason, matches: res.matches ?? [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI service is temporarily unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const matchById = new Map((result?.matches ?? []).map((m) => [m.id, m.criteria]))
  const matches = (result?.ids ?? []).map((id) => catalog.find((p) => p.id === id)).filter((p): p is Property => Boolean(p))
  const hasFilters = prefs.purpose || prefs.area || prefs.propertyType || prefs.minPrice || prefs.maxPrice || prefs.bedrooms || prefs.bathrooms

  return (
    <div className="mx-auto max-w-6xl">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700"><Sparkles className="size-4"/>Personalized discovery</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">AI property matches</h1>
      <p className="mt-2 text-slate-500">Tell GharHub AI what you are looking for and it ranks matching published properties by area, type, space, and budget.</p>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold">Purpose
            <select className="admin-select mt-2 block w-full max-w-none" value={prefs.purpose} onChange={(e) => set('purpose', e.target.value as Prefs['purpose'])}>
              <option value="">Any</option>
              <option value="sale">For sale</option>
              <option value="rent">For rent</option>
            </select>
          </label>
          <label className="text-xs font-bold">Area
            <select className="admin-select mt-2 block w-full max-w-none" value={prefs.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">Any area</option>
              {KARACHI_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Property type
            <select className="admin-select mt-2 block w-full max-w-none" value={prefs.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
              <option value="">Any type</option>
              {['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial', 'shop', 'office', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Bedrooms
            <Input className="mt-2" type="number" min="0" value={prefs.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} placeholder="Any"/>
          </label>
          <label className="text-xs font-bold">Budget min (PKR)
            <Input className="mt-2" type="number" min="0" value={prefs.minPrice} onChange={(e) => set('minPrice', e.target.value)} placeholder="e.g. 5000000"/>
          </label>
          <label className="text-xs font-bold">Budget max (PKR)
            <Input className="mt-2" type="number" min="0" value={prefs.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} placeholder="e.g. 20000000"/>
          </label>
          <label className="text-xs font-bold">Min square feet
            <Input className="mt-2" type="number" min="0" value={prefs.minSquareFeet} onChange={(e) => set('minSquareFeet', e.target.value)} placeholder="e.g. 1000"/>
          </label>
          <label className="text-xs font-bold">Max square feet
            <Input className="mt-2" type="number" min="0" value={prefs.maxSquareFeet} onChange={(e) => set('maxSquareFeet', e.target.value)} placeholder="e.g. 3000"/>
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-end">
          <label className="text-xs font-bold sm:min-w-0 sm:flex-1">Similar to a property you own <span className="font-normal text-slate-400">(optional)</span>
            <select className="admin-select mt-2 block w-full max-w-none" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} disabled={propertiesLoading || !catalog.length}>
              <option value="">No reference property</option>
              {catalog.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.area}</option>)}
            </select>
          </label>
          <Button onClick={() => void find()} disabled={loading || propertiesLoading}>
            {loading ? <LoaderCircle className="size-4 animate-spin"/> : <Sparkles className="size-4"/>}Find AI matches
          </Button>
        </div>
      </section>

      {loading && <div className="mt-6 grid gap-5 md:grid-cols-3">{[1, 2, 3].map((n) => <div key={n} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"/>)}</div>}

      {error && !loading && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
          <h2 className="font-semibold text-rose-700 dark:text-rose-300">GharHub AI is temporarily unavailable</h2>
          <p className="mt-1 text-sm text-rose-600/70">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void find()}><RefreshCw className="size-4"/>Try again</Button>
        </div>
      )}

      {result && !loading && !error && result.ids.length === 0 && (
        <div className="mt-6">
          <EmptyState icon={<Building2/>} title="No matching properties right now" description={result.reason || 'No properties match these preferences.'}/>
          <p className="mt-4 text-center text-sm text-slate-500">{hasFilters ? 'Try loosening your filters — increase the budget, widen the area, or remove the type and bedroom limits.' : 'You have no filters set. Add a budget, area, or type to get more relevant matches.'}</p>
        </div>
      )}

      {result && !loading && !error && matches.length > 0 && (
        <>
          <p className="mt-6 rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-800 dark:bg-teal-950 dark:text-teal-200"><strong>Why these match:</strong> {result.reason}</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {matches.map((p) => (
              <Link key={p.id} to={`/dashboard/property/${p.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="aspect-[16/10] overflow-hidden"><img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
                <div className="p-4">
                  <p className="truncate font-display font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{p.area}, {p.city}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(matchById.get(p.id) ?? []).map((c) => <span key={c} className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">{c}</span>)}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <strong className="text-teal-700">Rs. {p.price.toLocaleString()}</strong>
                    <span className="flex items-center gap-1 text-sm font-semibold text-slate-400 transition-colors group-hover:text-teal-600">View <ArrowRight className="size-4"/></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}