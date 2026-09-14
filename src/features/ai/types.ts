import type { SearchFilters } from '../search/search-service'
import type { Property } from '../properties/types'

export type AITask = 'title' | 'description' | 'price' | 'search' | 'recommend' | 'chat' | 'studio'
export type ListingContext = Pick<Property, 'title' | 'description' | 'price' | 'purpose' | 'propertyType' | 'bedrooms' | 'bathrooms' | 'kitchen' | 'parking' | 'squareFeet' | 'city' | 'area' | 'address'>
export type SearchAIResult = { filters: SearchFilters; summary: string; assumptions: string[] }
export type PriceAIResult = { suggestedPrice: number; low: number; high: number; confidence: number; rationale: string; currency: string }

export type StudioAction = 'title' | 'description' | 'highlights' | 'improve' | 'price'
export type StudioContext = {
  propertyType: string
  customPropertyType?: string
  purpose: 'sale' | 'rent'
  bedrooms: number
  bathrooms: number
  squareFeet: number
  city: string
  area: string
  address?: string
  price: number
  description?: string
  details?: string
}
export type EstimatedPrice = { min: number; max: number; currency: string; note: string }
export type StudioAIResult = { title: string | null; description: string | null; highlights: string[] | null; estimatedPrice: EstimatedPrice | null }

export type RecommendationPreference = {
  purpose?: '' | 'sale' | 'rent'
  area?: string
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  minSquareFeet?: number
  maxSquareFeet?: number
  bedrooms?: number
  bathrooms?: number
}
export type RecommendationMatch = { id: string; criteria: string[] }
export type RecommendationAIResult = { propertyIds: string[]; reason: string; matches: RecommendationMatch[] }

export type ChatAIResult = { answer: string; suggestedPrompts: string[]; propertyIds: string[] }
