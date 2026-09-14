import { supabase } from '../../lib/supabase'
import type { PropertyStatus } from '../properties/types'
import type { AdminProperty, AdminReport, AdminStats, AdminUser, AiUsageRow, AuditRow, ReportStatus, AdminRoleRequest, RoleRequestStatus } from './types'

type UserRow={id:string;email:string;full_name:string|null;created_at:string;is_admin:boolean;property_count:number;published_count:number;favorites_count:number;ai_calls:number}
type StatsRow={total_users:number;total_properties:number;published_properties:number;draft_properties:number;archived_properties:number;sold_properties:number;rented_properties:number;featured_properties:number;open_reports:number;total_reports:number;total_conversations:number;total_messages:number;total_favorites:number;total_ai_calls:number}
type PropertyRow={id:string;owner_id:string;title:string;price:number;purpose:'sale'|'rent';property_type:string;custom_property_type?:string|null;bedrooms:number;bathrooms:number;area:string;city:string;status:PropertyStatus;featured:boolean;images:string[];created_at:string;updated_at:string}
type ReportRow={id:string;property_id:string;reporter_id:string;reason:string;details:string;priority:AdminReport['priority'];status:ReportStatus;created_at:string}
type AiRow={id:number;user_id:string;operation:string;created_at:string}
type AuditRowRow={id:number;admin_id:string;action:string;entity_type:string;entity_id:string;created_at:string}
type RoleRequestRow={id:string;user_id:string;from_role:'buyer'|'seller';requested_role:'buyer'|'seller';status:RoleRequestStatus;admin_notes:string|null;reviewed_by:string|null;created_at:string;reviewed_at:string|null}

function nameFor(value:Pick<UserRow,'full_name'|'email'>):string{return value.full_name||value.email.split('@')[0]||'User'}
function errorFor(error:unknown):never{
  const msg=error instanceof Error?error.message:typeof error==='object'&&error!==null&&'message' in error?String((error as Record<string,unknown>).message):String(error)
  throw new Error(msg)
}

export const adminRepository={
  async stats():Promise<AdminStats|null>{
    if(!supabase)return null
    const {data,error}=await supabase.rpc('admin_stats')
    if(error)errorFor(error)
    const row=(Array.isArray(data)?data[0]:data) as StatsRow|undefined
    if(!row)return null
    return{
      totalUsers:Number(row.total_users),
      totalProperties:Number(row.total_properties),
      publishedProperties:Number(row.published_properties),
      draftProperties:Number(row.draft_properties),
      archivedProperties:Number(row.archived_properties),
      soldProperties:Number(row.sold_properties),
      rentedProperties:Number(row.rented_properties),
      featuredProperties:Number(row.featured_properties),
      openReports:Number(row.open_reports),
      totalReports:Number(row.total_reports),
      totalConversations:Number(row.total_conversations),
      totalMessages:Number(row.total_messages),
      totalFavorites:Number(row.total_favorites),
      totalAiCalls:Number(row.total_ai_calls),
    }
  },
  async users():Promise<AdminUser[]>{
    if(!supabase)return[]
    const {data,error}=await supabase.rpc('admin_users')
    if(error)errorFor(error)
    return((Array.isArray(data)?data:[]) as UserRow[]).map(row=>({
      id:row.id,
      email:row.email,
      name:nameFor(row),
      createdAt:row.created_at,
      isAdmin:row.is_admin,
      propertyCount:Number(row.property_count),
      publishedCount:Number(row.published_count),
      favoritesCount:Number(row.favorites_count),
      aiCalls:Number(row.ai_calls),
    }))
  },
  async properties():Promise<AdminProperty[]>{
    if(!supabase)return[]
    const {data,error}=await supabase.from('properties').select('id,owner_id,title,price,purpose,property_type,custom_property_type,bedrooms,bathrooms,area,city,status,featured,images,created_at,updated_at').order('created_at',{ascending:false})
    if(error)errorFor(error)
    return((data as PropertyRow[]|undefined)??[]).map(row=>({
      id:row.id,
      ownerId:row.owner_id,
      ownerName:'',
      title:row.title,
      price:Number(row.price),
      purpose:row.purpose,
      propertyType:row.property_type,
      customPropertyType:row.custom_property_type??undefined,
      bedrooms:row.bedrooms,
      bathrooms:row.bathrooms,
      area:row.area,
      city:row.city,
      status:row.status,
      featured:row.featured,
      image:row.images[0]??'',
      createdAt:row.created_at,
      updatedAt:row.updated_at,
    }))
  },
  async reports():Promise<AdminReport[]>{
    if(!supabase)return[]
    const {data,error}=await supabase.from('property_reports').select('id,property_id,reporter_id,reason,details,priority,status,created_at').order('created_at',{ascending:false})
    if(error)errorFor(error)
    return((data as ReportRow[]|undefined)??[]).map(row=>({
      id:row.id,
      propertyId:row.property_id,
      propertyTitle:'',
      reporterId:row.reporter_id,
      reporterName:'',
      reason:row.reason,
      details:row.details,
      priority:row.priority,
      status:row.status,
      createdAt:row.created_at,
    }))
  },
  async aiUsage():Promise<AiUsageRow[]>{
    if(!supabase)return[]
    const {data,error}=await supabase.from('ai_usage').select('id,user_id,operation,created_at').order('created_at',{ascending:false}).limit(500)
    if(error)errorFor(error)
    return((data as AiRow[]|undefined)??[]).map(row=>({id:Number(row.id),userId:row.user_id,userName:'',operation:row.operation,createdAt:row.created_at}))
  },
  async auditLogs():Promise<AuditRow[]>{
    if(!supabase)return[]
    const {data,error}=await supabase.from('admin_audit_logs').select('id,admin_id,action,entity_type,entity_id,created_at').order('created_at',{ascending:false}).limit(500)
    if(error)errorFor(error)
    return((data as AuditRowRow[]|undefined)??[]).map(row=>({id:Number(row.id),adminId:row.admin_id,adminName:'',action:row.action,entityType:row.entity_type,entityId:row.entity_id,createdAt:row.created_at}))
  },
  async toggleFeatured(id:string,featured:boolean):Promise<void>{
    if(!supabase)return
    const {error}=await supabase.rpc('admin_toggle_featured',{target_property:id,target_featured:featured})
    if(error)errorFor(error)
  },
  async setStatus(id:string,status:PropertyStatus):Promise<void>{
    if(!supabase)return
    const {error}=await supabase.rpc('admin_set_property_status',{target_property:id,next_status:status})
    if(error)errorFor(error)
  },
  async moderateReport(id:string,status:ReportStatus):Promise<void>{
    if(!supabase)return
    const {error}=await supabase.rpc('moderate_report',{target_report:id,next_status:status})
    if(error)errorFor(error)
  },
  async setAdminRole(userId:string,isAdmin:boolean):Promise<void>{
    if(!supabase)return
    const {error}=await supabase.functions.invoke('admin-actions',{body:{action:'set_admin_role',user_id:userId,is_admin:isAdmin}})
    if(error)errorFor(error)
  },
  async roleRequests():Promise<AdminRoleRequest[]>{
    if(!supabase)return[]
    const {data,error}=await supabase.from('role_requests').select('id,user_id,from_role,requested_role,status,admin_notes,reviewed_by,created_at,reviewed_at').order('created_at',{ascending:false}).limit(200)
    if(error)errorFor(error)
    const rows=(data as RoleRequestRow[]|undefined)??[]
    if(rows.length===0)return[]
    const userIds=[...new Set(rows.flatMap(r=>[r.user_id,r.reviewed_by].filter(Boolean) as string[]))]
    const {data:profiles}=await supabase.from('profiles').select('user_id,full_name').in('user_id',userIds)
    const profileRows:Array<{user_id:string;full_name:string|null}> = Array.isArray(profiles) ? profiles : []
    const names=new Map(profileRows.map((p:{user_id:string;full_name:string|null})=>[p.user_id,p.full_name||'Unknown']))
    let emailMap=new Map<string,string>()
    try{const{data:users}=await supabase.auth.admin.listUsers();emailMap=new Map((users?.users??[]).map(u=>[u.id,u.email??'']))}catch{/* service_role key required */}
    return rows.map(r=>({
      id:r.id,
      userId:r.user_id,
      userName:names.get(r.user_id)??'Unknown',
      userEmail:emailMap.get(r.user_id)??'',
      fromRole:r.from_role,
      requestedRole:r.requested_role,
      status:r.status,
      adminNotes:r.admin_notes,
      reviewedByName:r.reviewed_by?names.get(r.reviewed_by)??'Admin':null,
      createdAt:r.created_at,
      reviewedAt:r.reviewed_at,
    }))
  },
  async reviewRoleRequest(id:string,status:RoleRequestStatus,adminNotes:string):Promise<void>{
    if(!supabase)return
    const reviewedAt=new Date().toISOString()
    const {error}=await supabase.from('role_requests').update({status,admin_notes:adminNotes||null,reviewed_at:reviewedAt}).eq('id',id)
    if(error)errorFor(error)
    const {data:{user}}=await supabase.auth.getUser()
    if(user){
      await supabase.from('admin_audit_logs').insert({
        admin_id:user.id,
        action:`${status}_role_request`,
        entity_type:'role_request',
        entity_id:id,
      })
    }
    const {data:req}=await supabase.from('role_requests').select('user_id,requested_role').eq('id',id).single()
    if(req){
      if(status==='approved'){
        const {error:profileError}=await supabase.from('profiles').update({marketplace_role:req.requested_role}).eq('user_id',req.user_id)
        if(profileError)errorFor(profileError)
      }
      await supabase.from('notifications').insert({
        user_id:req.user_id,
        type:'role_request',
        title:`Role request ${status}`,
        body:`Your request to switch to ${req.requested_role} has been ${status}${adminNotes?`: ${adminNotes}`:''}.`,
        action_url:'/dashboard/account',
        metadata:{role_request_id:id},
      })
    }
  },
}
