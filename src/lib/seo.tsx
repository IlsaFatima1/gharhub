import { useEffect } from 'react'
import { SITE_NAME, SITE_URL } from './site'

export type RobotsDirective = 'index, follow' | 'noindex, nofollow'

type JsonLd = Record<string, unknown> | Record<string, unknown>[]

export type SeoProps = {
  title?: string
  description?: string
  canonicalPath?: string
  robots?: RobotsDirective
  ogType?: 'website' | 'article' | 'place' | 'product'
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  jsonLd?: JsonLd
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function absoluteUrl(path: string): string {
  if (!path) return SITE_URL
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const JSONLD_ID = 'gharhub-jsonld-script'

function setJsonLd(data: JsonLd | undefined) {
  const existing = document.getElementById(JSONLD_ID)
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = JSONLD_ID
  script.text = JSON.stringify(data)
  document.head.appendChild(script)
}

/**
 * Centralized SEO head manager for the GharHub client-rendered app.
 * Sets title, meta description, robots, canonical, Open Graph, Twitter and
 * optional structured data. Each page calls <Seo .../> once.
 */
export function Seo({
  title,
  description,
  canonicalPath,
  robots = 'index, follow',
  ogType = 'website',
  ogImage,
  ogTitle,
  ogDescription,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME

    upsertMeta('name', 'description', description ?? '')
    upsertMeta('name', 'robots', robots)

    if (canonicalPath) upsertLink('canonical', absoluteUrl(canonicalPath))

    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:type', ogType)
    upsertMeta('property', 'og:title', ogTitle ?? title ?? SITE_NAME)
    upsertMeta('property', 'og:description', ogDescription ?? description ?? '')
    if (canonicalPath) upsertMeta('property', 'og:url', absoluteUrl(canonicalPath))
    const image = ogImage ?? (canonicalPath && canonicalPath.includes('/properties/') ? undefined : '/properties/modern-villa.jpg')
    if (image) upsertMeta('property', 'og:image', absoluteUrl(image))

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', ogTitle ?? title ?? SITE_NAME)
    upsertMeta('name', 'twitter:description', ogDescription ?? description ?? '')

    setJsonLd(jsonLd)

    return () => {
      setJsonLd(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonicalPath, robots, ogType, ogImage, ogTitle, ogDescription, JSON.stringify(jsonLd)])

  return null
}
