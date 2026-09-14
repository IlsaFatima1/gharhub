import type { PropertyStatus } from '../properties/types'

export type AdminSection='overview'|'properties'|'reports'|'users'|'ai'|'audit'|'role-requests'

export type AdminStats={
  totalUsers:number
  totalProperties:number
  publishedProperties:number
  draftProperties:number
  archivedProperties:number
  soldProperties:number
  rentedProperties:number
  featuredProperties:number
  openReports:number
  totalReports:number
  totalConversations:number
  totalMessages:number
  totalFavorites:number
  totalAiCalls:number
}

export type AdminUser={
  id:string
  email:string
  name:string
  createdAt:string
  isAdmin:boolean
  propertyCount:number
  publishedCount:number
  favoritesCount:number
  aiCalls:number
}

export type AdminProperty={
  id:string
  ownerId:string
  ownerName:string
  title:string
  price:number
  purpose:'sale'|'rent'
  propertyType:string
  customPropertyType?:string
  bedrooms:number
  bathrooms:number
  area:string
  city:string
  status:PropertyStatus
  featured:boolean
  image:string
  createdAt:string
  updatedAt:string
}

export type ReportStatus='open'|'investigating'|'resolved'|'dismissed'
export type ReportPriority='low'|'medium'|'high'|'critical'

export type AdminReport={
  id:string
  propertyId:string
  propertyTitle:string
  reporterId:string
  reporterName:string
  reason:string
  details:string
  priority:ReportPriority
  status:ReportStatus
  createdAt:string
}

export type AiUsageRow={
  id:number
  userId:string
  userName:string
  operation:string
  createdAt:string
}

export type AuditRow={
  id:number
  adminId:string
  adminName:string
  action:string
  entityType:string
  entityId:string
  createdAt:string
}

export type RoleRequestStatus='pending'|'approved'|'rejected'
export type AdminRoleRequest={
  id:string
  userId:string
  userName:string
  userEmail:string
  fromRole:'buyer'|'seller'
  requestedRole:'buyer'|'seller'
  status:RoleRequestStatus
  adminNotes:string|null
  reviewedByName:string|null
  createdAt:string
  reviewedAt:string|null
}
