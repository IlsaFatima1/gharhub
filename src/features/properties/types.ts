export type PropertyStatus = 'draft' | 'published' | 'archived' | 'sold' | 'rented'
export type PropertyPurpose = 'sale' | 'rent'
export type PropertyType = 'house' | 'apartment' | 'villa' | 'townhouse' | 'land' | 'commercial' | 'shop' | 'office' | 'other'

export type Property = {
  id: string
  ownerId: string
  title: string
  description: string
  price: number
  purpose: PropertyPurpose
  propertyType: PropertyType
  customPropertyType?: string
  bedrooms: number
  bathrooms: number
  kitchen: number
  parking: number
  squareFeet: number
  city: string
  area: string
  address: string
  mapLocation: string
  latitude: number
  longitude: number
  images: string[]
  status: PropertyStatus
  createdAt: string
  updatedAt: string
  sellerName: string
  sellerWhatsApp: string
  featured?: boolean
}

export type PropertyInput = Omit<Property, 'id' | 'ownerId' | 'status' | 'createdAt' | 'updatedAt'>

export function displayPropertyType(p: { propertyType: string; customPropertyType?: string }): string {
  if (p.propertyType === 'other' && p.customPropertyType?.trim()) return p.customPropertyType.trim()
  return p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1)
}
