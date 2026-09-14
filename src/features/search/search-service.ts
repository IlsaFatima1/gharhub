import type { Property, PropertyPurpose, PropertyType } from '../properties/types'

export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high'
export type SearchFilters = { query:string; city:string; area:string; minPrice:string; maxPrice:string; minSquareFeet:string; maxSquareFeet:string; bedrooms:string; bathrooms:string; purpose:''|PropertyPurpose; propertyType:''|PropertyType; sort:SortOption }
export const defaultFilters: SearchFilters = { query:'',city:'',area:'',minPrice:'',maxPrice:'',minSquareFeet:'',maxSquareFeet:'',bedrooms:'',bathrooms:'',purpose:'',propertyType:'',sort:'newest' }

export function searchProperties(source: Property[], filters: SearchFilters) {
  const q=filters.query.trim().toLowerCase(); const min=Number(filters.minPrice)||0; const max=Number(filters.maxPrice)||Infinity; const minSize=Number(filters.minSquareFeet)||0; const maxSize=Number(filters.maxSquareFeet)||Infinity
  const result=source.filter((p) => p.status==='published' && (!q || `${p.title} ${p.city} ${p.area} ${p.address} ${p.customPropertyType??''}`.toLowerCase().includes(q)) && (!filters.city || p.city===filters.city) && (!filters.area || p.area===filters.area) && p.price>=min && p.price<=max && p.squareFeet>=minSize && p.squareFeet<=maxSize && (!filters.bedrooms || p.bedrooms>=Number(filters.bedrooms)) && (!filters.bathrooms || p.bathrooms>=Number(filters.bathrooms)) && (!filters.purpose || p.purpose===filters.purpose) && (!filters.propertyType || p.propertyType===filters.propertyType))
  return result.sort((a,b) => filters.sort==='price-low'?a.price-b.price:filters.sort==='price-high'?b.price-a.price:filters.sort==='oldest'?Date.parse(a.createdAt)-Date.parse(b.createdAt):Date.parse(b.createdAt)-Date.parse(a.createdAt))
}

export function suggestions(source:Property[],query:string) { const q=query.trim().toLowerCase(); if(q.length<2)return []; const values=new Set<string>(); source.forEach((p)=>{[p.title,p.city,p.area,p.customPropertyType].filter(Boolean).forEach((v)=>{if(v!.toLowerCase().includes(q))values.add(v!)})}); return [...values].slice(0,6) }
