import { supabase } from '../../lib/supabase'
import { captureError } from '../../lib/monitoring'
import { defaultFilters } from '../search/search-service'
import type { Property } from '../properties/types'
import type { ChatAIResult, ListingContext, PriceAIResult, RecommendationAIResult, RecommendationPreference, SearchAIResult, StudioAIResult, StudioAction, StudioContext } from './types'

async function invoke<T>(task: string, payload: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase client not available')
  try {
    const { data, error } = await supabase.functions.invoke('ai-property', { body: { task, payload } })
    if (error) throw error
    if (!data?.result) throw new Error(`Edge Function returned no result for task '${task}'.`)
    return data.result as T
  } catch (e) {
    captureError(e, { feature: 'ai', operation: `invoke:${task}` })
    throw new Error('AI service is temporarily unavailable. Please try again.')
  }
}

export const aiService = {
  title: (context: Partial<ListingContext> | Record<string, unknown>) => invoke<{ title: string }>('title', { context }),
  description: (context: Partial<ListingContext> | Record<string, unknown>) => invoke<{ description: string }>('description', { context }),
  price: (context: Partial<ListingContext> | Record<string, unknown>, comparables: Property[]) => invoke<PriceAIResult>('price', { context, comparables: comparables.slice(0, 20).map(compact) }),
  search: async (query: string) => enrichSearch(await invoke<SearchAIResult>('search', { query }), query),
  recommend: (preferences: RecommendationPreference, reference?: Property | null, excludeIds?: string[]) => invoke<RecommendationAIResult>('recommend', { preferences, reference: reference ? compact(reference) : null, excludeIds: excludeIds ?? [] }),
  studio: (action: StudioAction, context: StudioContext) => invoke<StudioAIResult>('studio', { action, context }),
  chat: (message: string, history: { role: 'user' | 'assistant'; content: string }[], catalog: Property[]) => invoke<ChatAIResult>('chat', { message, history: history.slice(-8), catalog: catalog.slice(0, 30).map(compact) }),
}

function compact(p: Property) {
  return { id: p.id, title: p.title, price: p.price, purpose: p.purpose, propertyType: p.propertyType, customPropertyType: p.customPropertyType, bedrooms: p.bedrooms, bathrooms: p.bathrooms, squareFeet: p.squareFeet, city: p.city, area: p.area }
}

function enrichSearch(result: SearchAIResult, query: string): SearchAIResult {
  const filters = { ...defaultFilters, ...result.filters }
  const marla = query.toLowerCase().match(/(\d+(?:\.\d+)?)\s*marla/)
  if (marla && !filters.minSquareFeet && !filters.maxSquareFeet) {
    const feet = Number(marla[1]) * 225
    filters.minSquareFeet = String(Math.round(feet * 0.9))
    filters.maxSquareFeet = String(Math.round(feet * 1.1))
  }
  return { ...result, filters }
}