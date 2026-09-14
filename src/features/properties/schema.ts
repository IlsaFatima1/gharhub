import { z } from 'zod'
import { KARACHI_AREAS, KARACHI_CITY, isInKarachi } from '../../lib/karachi'

const numberField = (label: string, min = 0) => z.coerce.number({ error: `${label} is required.` }).min(min, `${label} must be at least ${min}.`)

export const propertySchema = z.object({
  title: z.string().trim().min(5, 'Title must have at least 5 characters.').max(100, 'Keep the title under 100 characters.'),
  description: z.string().trim().min(30, 'Description must have at least 30 characters.').max(3000),
  price: numberField('Price', 1).max(1_000_000_000),
  purpose: z.enum(['sale', 'rent']),
  propertyType: z.enum(['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial', 'shop', 'office', 'other']),
  customPropertyType: z.string().trim().max(50, 'Keep the custom type under 50 characters.').optional().or(z.literal('')),
  bedrooms: numberField('Bedrooms').int().max(100),
  bathrooms: numberField('Bathrooms').int().max(100),
  kitchen: numberField('Kitchens').int().max(20),
  parking: numberField('Parking spaces').int().max(100),
  squareFeet: numberField('Square feet', 50).max(10_000_000),
  city: z.literal(KARACHI_CITY),
  area: z.enum(KARACHI_AREAS, { error: 'Select a valid Karachi area.' }),
  address: z.string().trim().min(8, 'Enter a complete address.').max(250),
  mapLocation: z.string(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  images: z.array(z.string()).min(1, 'Upload at least one property image.').max(12, 'You can upload up to 12 images.'),
  sellerName: z.string().trim().min(2, 'Seller name is required.').max(100),
  sellerWhatsApp: z.string().trim().min(10, 'WhatsApp number is required.').max(20).regex(/^[\d\s+\-()]+$/, 'Enter a valid phone number.'),
}).refine((data) => isInKarachi(data.latitude, data.longitude), { message: 'The exact pin must be within Karachi.', path: ['latitude'] })
  .refine((data) => data.propertyType !== 'other' || (data.customPropertyType && data.customPropertyType.trim().length >= 2), { message: 'Enter a specific property type (at least 2 characters) when selecting Other.', path: ['customPropertyType'] })

export type PropertyFormValues = z.infer<typeof propertySchema>
export type PropertyFormInput = z.input<typeof propertySchema>
