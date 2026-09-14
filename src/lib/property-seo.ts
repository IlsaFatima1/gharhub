import type { Property } from '../features/properties/types'
import { displayPropertyType } from '../features/properties/types'

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Build a search-friendly title strictly from real property data.
 * Missing fields are omitted rather than invented. Example:
 * "3 Bedroom House for Sale in DHA, Karachi"
 */
export function propertyTitle(p: Property): string {
  const parts: string[] = []
  if (p.bedrooms) parts.push(`${p.bedrooms} Bedroom`)
  if (p.propertyType) parts.push(displayPropertyType(p))
  if (p.purpose) parts.push(`for ${p.purpose === 'rent' ? 'Rent' : 'Sale'}`)
  if (p.area) parts.push(`in ${p.area}`)
  if (p.city) parts.push(p.city)
  return parts.join(' ').trim() || p.title.trim() || 'Property'
}

/**
 * Build a one-to-two sentence description from real, present fields only.
 * Never fabricates data.
 */
export function propertyDescription(p: Property): string {
  const bits: string[] = []
  const type = displayPropertyType(p)
  const base = `${p.bedrooms ? `${p.bedrooms} bedroom ` : ''}${type.toLowerCase()}${p.purpose ? ` for ${p.purpose === 'rent' ? 'rent' : 'sale'}` : ''}`
  bits.push(base)
  const location = [p.area, p.city].filter(Boolean).join(', ')
  if (location) bits.push(`located in ${location}`)
  const size = p.squareFeet ? `${p.squareFeet.toLocaleString()} square feet` : null
  const baths = p.bathrooms ? `${p.bathrooms} bathrooms` : null
  const details = [size, baths].filter(Boolean).join(' with ')
  if (details) bits.push(`featuring ${details}`)
  if (p.description?.trim()) {
    return sentenceCase(bits.join(', ')) + '. ' + p.description.trim()
  }
  return sentenceCase(bits.join(', ')) + '.'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

/**
 * SEO-friendly slug for a property URL: <slug>-<id>.
 * The id is always preserved so the property can be resolved even if the
 * slug text changes. Example: 3-bedroom-house-in-dha-karachi-<uuid>
 */
export function propertySlug(p: Property): string {
  const base = [p.bedrooms ? `${p.bedrooms}-bedroom` : '', p.propertyType, p.purpose, p.area, p.city]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
  const text = slugify(base) || 'property'
  return `${text}-${p.id}`
}

/** Parse the trailing property id from a slug-shaped path segment. */
export function parsePropertySlug(slug: string): string | null {
  if (!slug) return null
  const idx = slug.lastIndexOf('-')
  if (idx === -1 || idx === slug.length - 1) return null
  return slug.slice(idx + 1)
}

/**
 * Accurate, real-data alt text for a property image.
 * Falls back to the factual title if nothing else is available.
 */
export function propertyImageAlt(p: Property, index?: number): string {
  const parts: string[] = []
  if (p.bedrooms) parts.push(`${p.bedrooms} bedroom`)
  if (p.propertyType) parts.push(displayPropertyType(p))
  if (p.purpose) parts.push(`for ${p.purpose === 'rent' ? 'rent' : 'sale'}`)
  if (p.area) parts.push(`in ${p.area}`)
  if (p.city) parts.push(p.city)
  const base = parts.join(' ').trim() || p.title.trim() || 'Property'
  return typeof index === 'number' && index > 0 ? `${base} photo ${index + 1}` : base
}

/** Single primary image for a property, or the safe fallback asset. */
export function primaryImage(p: Property, fallback = '/properties/modern-villa.jpg'): string {
  return p.images?.[0] || fallback
}
