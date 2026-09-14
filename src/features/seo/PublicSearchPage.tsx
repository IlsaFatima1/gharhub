import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bath, BedDouble, MapPin, Search, Square } from 'lucide-react'
import { propertyRepository } from '../properties/property-repository'
import { displayPropertyType, type Property } from '../properties/types'
import { Seo } from '../../lib/seo'
import { KARACHI_AREAS } from '../../lib/karachi'
import { propertyImageAlt, primaryImage } from '../../lib/property-seo'

type Mode = 'discover' | 'buy' | 'rent'

const PAGE_TITLES: Record<Mode, { title: string; description: string; h1: string; canonical: string }> = {
  discover: {
    title: 'Property Search & Discover in Karachi',
    description:
      'Discover verified properties for sale and rent across Karachi. Search by area, property type, bedrooms, budget and more on GharHub.',
    h1: 'Discover Properties in Karachi',
    canonical: '/discover',
  },
  buy: {
    title: 'Properties for Sale in Karachi',
    description:
      'Browse houses, apartments, villas and more for sale across Karachi. Verified listings with real prices, photos and locations on GharHub.',
    h1: 'Properties for Sale in Karachi',
    canonical: '/buy',
  },
  rent: {
    title: 'Properties for Rent in Karachi',
    description:
      'Find houses, apartments, villas and more for rent across Karachi. Verified listings with real prices, photos and locations on GharHub.',
    h1: 'Properties for Rent in Karachi',
    canonical: '/rent',
  },
}

export function PublicSearchPage() {
  const { mode = 'discover' } = useParams<{ mode?: Mode }>()
  const page = PAGE_TITLES[mode] || PAGE_TITLES.discover
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const hasActiveFilter = Boolean(query || area || propertyType || minPrice || maxPrice)
  const purpose: Property['purpose'] | '' = mode === 'buy' ? 'sale' : mode === 'rent' ? 'rent' : ''

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await propertyRepository.search({
          query,
          city: '',
          area,
          minPrice,
          maxPrice,
          minSquareFeet: '',
          maxSquareFeet: '',
          bedrooms: '',
          bathrooms: '',
          purpose,
          propertyType: propertyType as Property['propertyType'] | '',
          sort: 'newest',
        })
        if (!cancelled) setProperties(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Search could not be completed.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, purpose, query, area, propertyType, minPrice, maxPrice])

  const grouped = useMemo(() => {
    const byArea: Record<string, Property[]> = {}
    for (const p of properties) {
      const key = p.area || p.city || 'Other'
      ;(byArea[key] ??= []).push(p)
    }
    return Object.entries(byArea).sort((a, b) => b[1].length - a[1].length)
  }, [properties])

  return (
    <>
      <Seo
        title={page.title}
        description={page.description}
        canonicalPath={page.canonical}
        robots={hasActiveFilter ? 'noindex, nofollow' : 'index, follow'}
      />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">GharHub</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{page.h1}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{page.description}</p>

        <nav aria-label="Property listings" className="mt-6 flex flex-wrap gap-2">
          <ModeTab to="/discover" active={mode === 'discover'} label="All properties" />
          <ModeTab to="/buy" active={mode === 'buy'} label="For Sale" />
          <ModeTab to="/rent" active={mode === 'rent'} label="For Rent" />
        </nav>

        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_160px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search properties…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-9 text-sm outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900"
              aria-label="Search properties"
            />
          </div>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            aria-label="Filter by area"
          >
            <option value="">All areas</option>
            {KARACHI_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            aria-label="Filter by property type"
          >
            <option value="">All types</option>
            {['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial', 'shop', 'office'].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            type="number"
            placeholder="Min price (PKR)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            aria-label="Minimum price"
          />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            placeholder="Max price (PKR)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            aria-label="Maximum price"
          />
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-8 text-center text-sm text-rose-600">{error}</p>
        ) : properties.length === 0 ? (
          <p className="mt-10 py-10 text-center text-slate-500">
            No {mode === 'discover' ? '' : mode === 'buy' ? 'properties for sale' : 'properties for rent'} match your filters yet.
          </p>
        ) : (
          <div className="mt-8">
            {grouped.map(([groupName, group]) => (
              <section key={groupName} className="mt-8 first:mt-0">
                <h2 className="font-display text-xl font-semibold">{groupName}</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((p) => (
                    <PublicCard key={p.id} property={p} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function ModeTab({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link
      to={to}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
        active ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
      }`}
    >
      {label}
    </Link>
  )
}

function PublicCard({ property: p }: { property: Property }) {
  return (
    <Link
      to={`/properties/${slugOf(p)}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={primaryImage(p)}
          alt={propertyImageAlt(p)}
          loading="lazy"
          width={640}
          height={480}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-4">
        <p className="text-xs uppercase text-slate-500">
          {displayPropertyType(p)} · For {p.purpose}
        </p>
        <h3 className="mt-1 truncate font-display text-lg font-semibold group-hover:text-teal-700">{p.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3" />
          {p.area ? `${p.area}, ` : ''}
          {p.city}
        </p>
        <p className="mt-4 font-display text-xl font-bold text-teal-700">
          Rs. {p.price.toLocaleString()}
          <span className="text-xs font-medium text-slate-400">{p.purpose === 'rent' ? ' / mo' : ''}</span>
        </p>
        <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
          <span className="flex items-center gap-1"><BedDouble className="size-4" />{p.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="size-4" />{p.bathrooms}</span>
          <span className="flex items-center gap-1"><Square className="size-4" />{p.squareFeet.toLocaleString()} ft²</span>
        </div>
      </div>
    </Link>
  )
}

function slugOf(p: Property): string {
  const base = [p.bedrooms ? `${p.bedrooms}-bedroom` : '', p.propertyType, p.purpose, p.area, p.city]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'property'}-${p.id}`
}
