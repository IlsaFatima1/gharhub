import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bath, BedDouble, Building2, MapPin, Square } from 'lucide-react'
import { propertyRepository } from '../properties/property-repository'
import { displayPropertyType, type Property } from '../properties/types'
import { Seo } from '../../lib/seo'
import { SITE_NAME } from '../../lib/site'
import { parsePropertySlug, primaryImage, propertyDescription, propertyImageAlt, propertyTitle } from '../../lib/property-seo'
import { waLink } from '../../lib/whatsapp'

const FALLBACK_IMAGE = '/properties/modern-villa.jpg'

function propertyJsonLd(p: Property, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: propertyDescription(p),
    image: primaryImage(p, FALLBACK_IMAGE),
    url,
    offers: {
      '@type': 'Offer',
      price: String(p.price),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
    },
  }
}

export function PublicPropertyPage() {
  const { slug } = useParams<{ slug: string }>()
  const id = parsePropertySlug(slug ?? '')
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const p = await propertyRepository.getById(id)
        if (cancelled) return
        // RLS ensures anonymous users only see published properties.
        if (p && p.status === 'published') setProperty(p)
        else setNotFound(true)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-slate-500">
        Loading property…
      </div>
    )
  }

  if (notFound || !property) {
    return <Navigate to="/discover" replace />
  }

  const canonicalPath = `/properties/${slug}`
  const ogImage = primaryImage(property, FALLBACK_IMAGE)
  const typeLabel = displayPropertyType(property)
  const wa = waLink(
    property.sellerWhatsApp,
    `Hi ${property.sellerName || 'there'}, I'm interested in "${property.title}" listed at Rs. ${property.price.toLocaleString()}${property.purpose === 'rent' ? '/month' : ''}. Is it still available?`,
  )

  return (
    <>
      <Seo
        title={propertyTitle(property)}
        description={propertyDescription(property)}
        canonicalPath={canonicalPath}
        robots="index, follow"
        ogType="product"
        ogImage={ogImage}
        ogTitle={propertyTitle(property)}
        ogDescription={propertyDescription(property)}
        jsonLd={[
          propertyJsonLd(property, `https://gharhub.site${canonicalPath}`),
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gharhub.site/' },
              {
                '@type': 'ListItem',
                position: 2,
                name: property.area || property.city || 'Discover',
                item: 'https://gharhub.site/discover',
              },
              { '@type': 'ListItem', position: 3, name: property.title, item: `https://gharhub.site${canonicalPath}` },
            ],
          },
        ]}
      />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-teal-600">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/discover" className="hover:text-teal-600">Discover</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-700 dark:text-slate-300">{property.title}</li>
          </ol>
        </nav>

        <Link to="/discover" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-700">
          <ArrowLeft className="size-4" /> Back to discover
        </Link>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="aspect-[16/9] overflow-hidden bg-slate-100">
            <img
              src={ogImage}
              alt={propertyImageAlt(property)}
              className="h-full w-full object-cover"
              width={1200}
              height={675}
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-teal-50 px-3 py-1 font-bold uppercase text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                For {property.purpose}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {typeLabel}
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{property.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="size-4 text-teal-600" />
              {property.address ? `${property.address}, ` : ''}
              {[property.area, property.city].filter(Boolean).join(', ')}
            </p>
            <p className="mt-4 font-display text-3xl font-bold text-teal-700 dark:text-teal-400">
              Rs. {property.price.toLocaleString()}
              <span className="block text-xs font-medium text-slate-400">
                {property.purpose === 'rent' ? 'per month' : 'asking price'}
              </span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Spec icon={<BedDouble className="size-4" />} label="Bedrooms" value={property.bedrooms || '—'} />
              <Spec icon={<Bath className="size-4" />} label="Bathrooms" value={property.bathrooms || '—'} />
              <Spec icon={<Square className="size-4" />} label="Area" value={property.squareFeet ? `${property.squareFeet.toLocaleString()} ft²` : '—'} />
              <Spec icon={<Building2 className="size-4" />} label="Type" value={typeLabel} />
            </div>

            {property.description?.trim() && (
              <section className="mt-8">
                <h2 className="font-display text-xl font-semibold">Description</h2>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{property.description.trim()}</p>
              </section>
            )}

            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1ebe5b] sm:w-auto sm:inline-flex"
              >
                Chat on WhatsApp
              </a>
            )}
            <p className="mt-4 text-xs text-slate-400">
              To save or message this property, <Link to="/login" className="font-semibold text-teal-600 hover:underline">sign in</Link> to {SITE_NAME}.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      <span className="text-teal-600">{icon}</span>
      <p className="mt-3 truncate font-display text-lg font-semibold">{value}</p>
      <p className="text-[11px] uppercase text-slate-400">{label}</p>
    </div>
  )
}
