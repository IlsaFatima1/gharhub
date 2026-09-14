/**
 * Build-time sitemap generator for GharHub.
 *
 * GharHub is a client-rendered Vite SPA deployed on Vercel, so the sitemap
 * cannot be generated server-side at request time without an edge/serverless
 * function. This script merges the static public pages with every PUBLISHED
 * property read live from Supabase at build time, so the shipped
 * public/sitemap.xml always reflects the current catalog before deploy.
 *
 * Safe by design: if Supabase is unreachable or misconfigured it keeps the
 * existing static baseline and exits non-zero, so it never ships a broken or
 * half-written sitemap. The route URLs written here MUST match the app's
 * PublicSearchPage / PublicPropertyPage routes exactly.
 *
 * Usage:  node scripts/generate-sitemap.mjs
 * Env:    SUPABASE_URL, SUPABASE_ANON_KEY  (fall back to VITE_* for Vite)
 */
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const SITE_URL = 'https://gharhub.site'
const OUT = resolve('public/sitemap.xml')

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(url && key && !url.includes('your-project'))

const STATIC_URLS = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/discover', changefreq: 'daily', priority: '0.9' },
  { loc: '/buy', changefreq: 'daily', priority: '0.8' },
  { loc: '/rent', changefreq: 'daily', priority: '0.8' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
]

function slugOf(p) {
  const base = [p.bedrooms ? `${p.bedrooms}-bedroom` : '', p.property_type, p.purpose, p.area, p.city]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'property'}-${p.id}`
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildXml(urls) {
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${esc(SITE_URL + u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

async function fetchPublished() {
  if (!configured) {
    console.warn('[sitemap] Supabase not configured — keeping static pages only.')
    return []
  }
  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('properties')
    .select('id,title,bedrooms,property_type,purpose,area,city,updated_at')
    .eq('status', 'published')
  if (error) throw new Error(`Supabase error: ${error.message}`)
  return data || []
}

const main = async () => {
  const urls = [...STATIC_URLS]
  try {
    const props = await fetchPublished()
    for (const p of props) {
      urls.push({
        loc: `/properties/${slugOf(p)}`,
        changefreq: 'daily',
        priority: '0.8',
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined,
      })
    }
  } catch (err) {
    console.error('[sitemap] Failed to query Supabase. Keeping static baseline and NOT overwriting.')
    console.error(err)
    process.exitCode = 1
    await writeFile(OUT, buildXml(STATIC_URLS))
    return
  }
  await writeFile(OUT, buildXml(urls))
  console.log(`[sitemap] Wrote ${urls.length} URLs (${urls.length - STATIC_URLS.length} published properties) to ${OUT}`)
}

main()
