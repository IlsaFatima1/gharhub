import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRightLeft, Building2, Flag, MessageCircle, ScrollText, Search, ShieldCheck, ShieldOff, Sparkles, Star, UserCircle, Users } from 'lucide-react'
import { Button, EmptyState, Input, useToast } from '../../components/ui'
import type { PropertyStatus } from '../properties/types'
import { displayPropertyType } from '../properties/types'
import { adminRepository } from './admin-repository'
import type { AdminProperty, AdminReport, AdminStats, AdminUser, AuditRow, AiUsageRow, AdminRoleRequest, ReportStatus, RoleRequestStatus } from './types'

// ---------------------------------------------------------------- primitives

export function Card({ title, subtitle, action, children }:{ title:string;subtitle:string;action?:React.ReactNode;children:React.ReactNode }){
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="mb-6 flex items-start justify-between gap-3"><div><h2 className="font-display font-semibold">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div>{action}</div>{children}</section>
}

export function Metric({ icon, label, value, tone }:{ icon:React.ReactNode;label:string;value:string|number;tone:'teal'|'indigo'|'amber'|'rose' }){
  const colors={teal:'bg-teal-50 text-teal-700 dark:bg-teal-950',indigo:'bg-indigo-50 text-indigo-600 dark:bg-indigo-950',amber:'bg-amber-50 text-amber-600 dark:bg-amber-950',rose:'bg-rose-50 text-rose-600 dark:bg-rose-950'}
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><span className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><p className="mt-5 font-display text-2xl font-semibold">{typeof value==='number'?value.toLocaleString():value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>
}

export function Status({ value }:{ value:string }){
  const color=statusColors[value]??'bg-slate-100 text-slate-600 dark:bg-slate-800'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${color}`}>{value}</span>
}

export function Priority({ value }:{ value:AdminReport['priority'] }){
  const color={critical:'bg-rose-600 text-white',high:'bg-orange-100 text-orange-700',medium:'bg-amber-100 text-amber-700',low:'bg-slate-100 text-slate-600'}[value]
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${color}`}>{value}</span>
}

export function Avatar({ name }:{ name:string }){
  return <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">{name.split(' ').map(x=>x[0]).slice(0,2).join('')||'?'}</span>
}

export function IconButton({ title, onClick, icon, disabled }:{ title:string;onClick:()=>void;icon:React.ReactNode;disabled?:boolean }){
  return <button title={title} disabled={disabled} onClick={onClick} className={`grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800`}>{icon}</button>
}

export function Table({ headers, children }:{ headers:string[];children:React.ReactNode }){
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><table className="w-full min-w-[880px] border-collapse text-left text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50">{headers.map(h=><th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody></table></div>
}

export function Cell({ children, className }:{ children:React.ReactNode;className?:string }){
  return <td className={`whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-300 ${className??''}`}>{children}</td>
}

export function DataSection({ title, description, query, setQuery, filter, children }:{ title:string;description:string;query:string;setQuery:(v:string)=>void;filter?:React.ReactNode;children:React.ReactNode }){
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="flex w-full gap-2 sm:w-auto"><div className="relative flex-1 sm:w-72"><Search className="absolute left-3 top-3 size-4 text-slate-400"/><Input value={query} onChange={e=>setQuery(e.target.value)} className="pl-9" placeholder="Search records…"/></div>{filter}</div></div><div className="mt-5">{children}</div></div>
}

export function Progress({ label, value, color }:{ label:string;value:number;color:string }){
  return <div><div className="mb-2 flex justify-between text-xs"><span className="text-slate-500">{label}</span><strong>{value}%</strong></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-2 rounded-full ${color}`} style={{width:`${value}%`}}/></div></div>
}

export function LoadingState(){
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i=><div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"/>)}</div><div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"/></div>
}

export function AdminEmpty({ title, description }:{ title:string;description:string }){
  return <EmptyState icon={<Building2/>} title={title} description={description}/>
}

const statusColors:Record<string,string>={
  published:'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
  resolved:'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
  sold:'bg-violet-50 text-violet-700 dark:bg-violet-950',
  rented:'bg-indigo-50 text-indigo-700 dark:bg-indigo-950',
  draft:'bg-amber-50 text-amber-700 dark:bg-amber-950',
  investigating:'bg-blue-50 text-blue-700 dark:bg-blue-950',
  open:'bg-rose-50 text-rose-700 dark:bg-rose-950',
  archived:'bg-slate-100 text-slate-600 dark:bg-slate-800',
  dismissed:'bg-slate-100 text-slate-500 dark:bg-slate-800',
}

const operationLabel:Record<string,string>={title:'Title generation',description:'Description writing',price:'Price guidance',search:'Search',recommend:'Recommendations',chat:'Assistant chat'}

// ---------------------------------------------------------------- overview

export function OverviewPanel({ stats, properties, reports, audit }:{ stats:AdminStats|null;properties:AdminProperty[];reports:AdminReport[];audit:AuditRow[] }){
  const total=(stats?.totalProperties??0)||1
  const breakdown=[
    {label:'Published',value:stats?.publishedProperties??0,color:'bg-emerald-500'},
    {label:'Draft',value:stats?.draftProperties??0,color:'bg-amber-500'},
    {label:'Archived',value:stats?.archivedProperties??0,color:'bg-slate-400'},
    {label:'Sold',value:stats?.soldProperties??0,color:'bg-violet-500'},
    {label:'Rented',value:stats?.rentedProperties??0,color:'bg-indigo-500'},
  ]
  const featured=properties.filter(p=>p.featured&&p.status==='published')
  const queue=reports.filter(r=>r.status==='open'||r.status==='investigating')
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Users/>} label="Total users" value={stats?.totalUsers??0} tone="teal"/>
      <Metric icon={<Building2/>} label="Published listings" value={stats?.publishedProperties??0} tone="indigo"/>
      <Metric icon={<Star/>} label="Featured spotlights" value={stats?.featuredProperties??0} tone="amber"/>
      <Metric icon={<Flag/>} label="Open reports" value={stats?.openReports??0} tone="rose"/>
      <Metric icon={<Sparkles/>} label="AI operations" value={stats?.totalAiCalls??0} tone="indigo"/>
      <Metric icon={<MessageCircle/>} label="Messages" value={stats?.totalMessages??0} tone="teal"/>
      <Metric icon={<Star/>} label="Favorites" value={stats?.totalFavorites??0} tone="amber"/>
      <Metric icon={<ScrollText/>} label="Total listings" value={stats?.totalProperties??0} tone="teal"/>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card title="Listing status" subtitle="Live distribution across the catalog">
        <div className="space-y-5">
          {breakdown.map(item=><Progress key={item.label} label={`${item.label} · ${item.value}`} value={Math.round(item.value/total*100)} color={item.color}/>)}
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">
            <span><strong className="text-slate-700 dark:text-slate-200">{stats?.totalConversations??0}</strong> conversations</span>
            <span><strong className="text-slate-700 dark:text-slate-200">{stats?.totalReports??0}</strong> total reports</span>
            <span><strong className="text-slate-700 dark:text-slate-200">{stats?.totalFavorites??0}</strong> favorites</span>
          </div>
        </div>
      </Card>
      <Card title="Featured spotlights" subtitle="Admin-curated listings surfaced on Discover" action={<span className="text-xs text-slate-400">{featured.length} live</span>}>
        {featured.length===0?<AdminEmpty title="No featured listings" description="Toggle the star on any property to spotlight it on Discover."/>:
          <div className="space-y-2">{featured.slice(0,5).map(p=><Link key={p.id} to={`/dashboard/property/${p.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"><img src={p.image} alt="" className="size-11 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.title}</p><p className="text-xs text-slate-400">{p.ownerName} · {p.area}</p></div><span className="text-sm font-bold text-teal-700 dark:text-teal-400">Rs. {p.price.toLocaleString()}</span></Link>)}</div>}
      </Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card title="Moderation queue" subtitle="Reports requiring operations review" action={<span className="text-xs text-slate-400">Live queue</span>}>
        {queue.length===0?<AdminEmpty title="Queue is clear" description="No open or in-progress reports right now."/>:
          <div className="space-y-2">{queue.slice(0,5).map(r=><div key={r.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950"><AlertTriangle className="size-5"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.propertyTitle||'Removed property'}</p><p className="text-xs text-slate-400">{r.reason} · {r.reporterName}</p></div><Priority value={r.priority}/><Status value={r.status}/></div>)}</div>}
      </Card>
      <Card title="Latest admin activity" subtitle="Recent operations from the audit trail">
        {audit.length===0?<AdminEmpty title="No activity yet" description="Admin operations will appear here as they happen."/>:
          <div className="space-y-2">{audit.slice(0,6).map(a=><div key={a.id} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950"><ShieldCheck className="size-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.action.replace(/_/g,' ')}</p><p className="text-xs text-slate-400">{a.adminName} · {a.entityType} {a.entityId.slice(0,8)}</p></div><span className="shrink-0 text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span></div>)}</div>}
      </Card>
    </div>
  </>
}

// ---------------------------------------------------------------- properties

const propertyFilters=['all','published','draft','archived','sold','rented'] as const

export function PropertiesPanel({ items, setItems }:{ items:AdminProperty[];setItems:(next:AdminProperty[])=>void }){
  const { toast }=useToast()
  const [query,setQuery]=useState('')
  const [status,setStatus]=useState<'all'|PropertyStatus>('all')
  const shown=items.filter(p=>(status==='all'||p.status===status)&&`${p.title} ${p.ownerName} ${p.area}`.toLowerCase().includes(query.toLowerCase()))
  const toggleFeatured=async(p:AdminProperty)=>{
    try{await adminRepository.toggleFeatured(p.id,!p.featured);setItems(items.map(x=>x.id===p.id?{...x,featured:!p.featured}:x));toast(p.featured?'Removed from featured.':'Added to featured.')}
    catch(e){toast(e instanceof Error?e.message:'Feature update failed.','error')}
  }
  const changeStatus=async(id:string,next:string)=>{
    try{await adminRepository.setStatus(id,next as PropertyStatus);setItems(items.map(x=>x.id===id?{...x,status:next as PropertyStatus}:x));toast(`Property status updated to ${next}.`)}
    catch(e){toast(e instanceof Error?e.message:'Status update failed.','error')}
  }
  return <DataSection title="Property management" description="Review, moderate, and feature every listing on the platform" query={query} setQuery={setQuery} filter={<select className="admin-select" value={status} onChange={e=>setStatus(e.target.value as 'all'|PropertyStatus)}>{propertyFilters.map(s=><option key={s} value={s}>{s==='all'?'All statuses':s}</option>)}</select>}>
    {items.length===0?<AdminEmpty title="No properties" description="Listings created by users will appear here."/>:
      <Table headers={['Property','Owner','Price','Status','Featured','Actions']}>
        {shown.map(p=><tr key={p.id}><Cell><div className="flex min-w-60 items-center gap-3"><img src={p.image} className="size-12 rounded-xl object-cover" alt=""/><div><p className="font-semibold">{p.title}</p><p className="text-xs text-slate-400">{displayPropertyType(p)} · {p.area} · {p.purpose}</p></div></div></Cell><Cell>{p.ownerName}</Cell><Cell className="font-semibold">Rs. {p.price.toLocaleString()}</Cell><Cell><Status value={p.status}/></Cell><Cell><IconButton title={p.featured?'Unfeature':'Feature on Discover'} onClick={()=>void toggleFeatured(p)} icon={<Star className={`size-4 ${p.featured?'fill-amber-400 text-amber-500':'text-slate-300'}`}/>}/></Cell><Cell><select className="admin-select" value={p.status} onChange={e=>changeStatus(p.id,e.target.value)}><option value="published">published</option><option value="draft">draft</option><option value="archived">archived</option><option value="sold">sold</option><option value="rented">rented</option></select></Cell></tr>)}
      </Table>}
  </DataSection>
}

// ---------------------------------------------------------------- reports

const reportFilters=['all','open','investigating','resolved','dismissed'] as const

export function ReportsPanel({ items, setItems }:{ items:AdminReport[];setItems:(next:AdminReport[])=>void }){
  const { toast }=useToast()
  const [query,setQuery]=useState('')
  const [status,setFilter]=useState<'all'|ReportStatus>('all')
  const shown=items.filter(r=>(status==='all'||r.status===status)&&`${r.propertyTitle} ${r.reporterName} ${r.reason}`.toLowerCase().includes(query.toLowerCase()))
  const update=async(id:string,next:ReportStatus)=>{
    try{await adminRepository.moderateReport(id,next);setItems(items.map(r=>r.id===id?{...r,status:next}:r));toast(`Report marked ${next}.`)}
    catch(e){toast(e instanceof Error?e.message:'Report update failed.','error')}
  }
  return <DataSection title="Trust & safety reports" description="Investigate community reports with complete audit context" query={query} setQuery={setQuery} filter={<select className="admin-select" value={status} onChange={e=>setFilter(e.target.value as 'all'|ReportStatus)}>{reportFilters.map(s=><option key={s} value={s}>{s==='all'?'All reports':s}</option>)}</select>}>
    {items.length===0?<AdminEmpty title="No reports" description="Reports filed by users will appear here."/>:
      <div className="grid gap-4">{shown.map(r=><article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950"><AlertTriangle className="size-5"/></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{r.propertyTitle||'Removed property'}</h3><Priority value={r.priority}/></div><p className="mt-1 text-xs text-slate-400">{r.reason} · Reported by {r.reporterName} · {new Date(r.createdAt).toLocaleDateString()}</p></div></div><Status value={r.status}/></div><p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">{r.details}</p><div className="mt-4 flex flex-wrap justify-end gap-2">{([['open','Open'],['investigating','Investigating'],['resolved','Resolved'],['dismissed','Dismissed']] as const).map(([value,label])=><Button key={value} variant={r.status===value?'secondary':'ghost'} disabled={r.status===value} onClick={()=>void update(r.id,value)}>{label}</Button>)}</div></article>)}
      {shown.length===0&&<AdminEmpty title="No matching reports" description="Try a different filter or search term."/>}</div>}
  </DataSection>
}

// ---------------------------------------------------------------- users

export function UsersPanel({ items, setItems, selfId }:{ items:AdminUser[];setItems:(next:AdminUser[])=>void;selfId:string }){
  const { toast }=useToast()
  const [query,setQuery]=useState('')
  const [role,setRole]=useState<'all'|'admin'|'member'>('all')
  const shown=items.filter(u=>(role==='all'||(role==='admin'?u.isAdmin:!u.isAdmin))&&`${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()))
  const toggleRole=async(u:AdminUser)=>{
    try{await adminRepository.setAdminRole(u.id,!u.isAdmin);setItems(items.map(x=>x.id===u.id?{...x,isAdmin:!u.isAdmin}:x));toast(u.isAdmin?'Administrator role removed.':'Administrator role granted.')}
    catch(e){toast(e instanceof Error?e.message:'Role update failed.','error')}
  }
  return <DataSection title="User management" description={`${items.length.toLocaleString()} platform accounts`} query={query} setQuery={setQuery} filter={<select className="admin-select" value={role} onChange={e=>setRole(e.target.value as 'all'|'admin'|'member')}><option value="all">All roles</option><option value="admin">Administrators</option><option value="member">Members</option></select>}>
    {items.length===0?<AdminEmpty title="No users" description="Registered accounts will appear here."/>:
      <Table headers={['User','Role','Listings','Published','Favorites','AI calls','Joined','Actions']}>
        {shown.map(u=><tr key={u.id}><Cell><div className="flex items-center gap-3"><Avatar name={u.name}/><div><p className="font-semibold">{u.name}{u.id===selfId&&<span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">You</span>}</p><p className="text-xs text-slate-400">{u.email}</p></div></div></Cell><Cell><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${u.isAdmin?'bg-amber-50 text-amber-700 dark:bg-amber-950':'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{u.isAdmin?<><ShieldCheck className="size-3"/>Admin</>:<>Member</>}</span></Cell><Cell>{u.propertyCount}</Cell><Cell>{u.publishedCount}</Cell><Cell>{u.favoritesCount}</Cell><Cell>{u.aiCalls}</Cell><Cell>{new Date(u.createdAt).toLocaleDateString()}</Cell><Cell><IconButton title={u.isAdmin?'Revoke administrator':'Grant administrator'} disabled={u.id===selfId} onClick={()=>void toggleRole(u)} icon={u.isAdmin?<ShieldOff className="size-4"/>:<ShieldCheck className="size-4"/>}/></Cell></tr>)}
      </Table>}
  </DataSection>
}

// ---------------------------------------------------------------- ai usage

export function AiUsagePanel({ items }:{ items:AiUsageRow[] }){
  const [query,setQuery]=useState('')
  const today=useMemo(()=>{const start=new Date();start.setHours(0,0,0,0);return items.filter(x=>Date.parse(x.createdAt)>=start.getTime()).length},[items])
  const counts=useMemo(()=>{const map=new Map<string,number>();items.forEach(x=>map.set(x.operation,(map.get(x.operation)??0)+1));return [...map.entries()].sort((a,b)=>b[1]-a[1])},[items])
  const shown=items.filter(x=>`${x.userName} ${x.operation}`.toLowerCase().includes(query.toLowerCase()))
  return <DataSection title="AI usage" description={`${items.length.toLocaleString()} AI operations · ${today.toLocaleString()} today`} query={query} setQuery={setQuery}>
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Metric icon={<Sparkles/>} label="Total AI operations" value={items.length} tone="indigo"/><Metric icon={<Sparkles/>} label="Operations today" value={today} tone="teal"/><div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Most used</p>{counts[0]?<p className="mt-3 font-display text-2xl font-semibold capitalize">{operationLabel[counts[0][0]]??counts[0][0]}</p>:<p className="mt-3 font-display text-2xl font-semibold">—</p>}<p className="mt-1 text-xs text-slate-400">{counts[0]?`${counts[0][1].toLocaleString()} calls`:''}</p></div></div>
    {items.length===0?<AdminEmpty title="No AI usage" description="AI tool calls will appear here as members use the studio."/>:
      <Table headers={['User','Operation','When']}>{shown.slice(0,200).map(x=><tr key={x.id}><Cell><div className="flex items-center gap-3"><Avatar name={x.userName}/><span className="font-semibold">{x.userName}</span></div></Cell><Cell className="capitalize">{operationLabel[x.operation]??x.operation}</Cell><Cell>{new Date(x.createdAt).toLocaleString()}</Cell></tr>)}</Table>}
  </DataSection>
}

// ---------------------------------------------------------------- audit

const auditFilters=['all','set_property_status','toggle_featured','moderate_report','grant_admin','revoke_admin','approved_role_request','rejected_role_request'] as const

export function AuditPanel({ items }:{ items:AuditRow[] }){
  const [query,setQuery]=useState('')
  const [action,setAction]=useState<string>('all')
  const shown=items.filter(a=>(action==='all'||a.action===action)&&`${a.action} ${a.adminName} ${a.entityType} ${a.entityId}`.toLowerCase().includes(query.toLowerCase()))
  return <DataSection title="Audit log" description="Immutable record of every administrative operation" query={query} setQuery={setQuery} filter={<select className="admin-select" value={action} onChange={e=>setAction(e.target.value)}>{auditFilters.map(a=><option key={a} value={a}>{a==='all'?'All actions':a.replace(/_/g,' ')}</option>)}</select>}>
    {items.length===0?<AdminEmpty title="No audit entries" description="Administrator actions will appear here."/>:
      <Table headers={['When','Administrator','Action','Entity','Reference']}>{shown.map(a=><tr key={a.id}><Cell>{new Date(a.createdAt).toLocaleString()}</Cell><Cell>{a.adminName}</Cell><Cell className="capitalize">{a.action.replace(/_/g,' ')}</Cell><Cell className="capitalize">{a.entityType.replace(/_/g,' ')}</Cell><Cell className="font-mono text-xs">{a.entityId.slice(0,12)}</Cell></tr>)}</Table>}
  </DataSection>
}

// ---------------------------------------------------------------- role requests

const roleRequestFilters=['all','pending','approved','rejected'] as const

export function RoleRequestsPanel({ items, setItems }: { items:AdminRoleRequest[];setItems:(next:AdminRoleRequest[])=>void }){
  const { toast }=useToast()
  const [query,setQuery]=useState('')
  const [status,setStatus]=useState<'all'|RoleRequestStatus>('all')
  const [reviewingId,setReviewingId]=useState<string|null>(null)
  const [notes,setNotes]=useState('')
  const shown=items.filter(r=>(status==='all'||r.status===status)&&`${r.userName} ${r.userEmail} ${r.fromRole} ${r.requestedRole}`.toLowerCase().includes(query.toLowerCase()))
  const pendingCount=items.filter(r=>r.status==='pending').length
  const review=async(id:string,next:RoleRequestStatus)=>{
    try{await adminRepository.reviewRoleRequest(id,next,notes);setItems(items.map(r=>r.id===id?{...r,status:next,adminNotes:notes||null,reviewedAt:new Date().toISOString()}:r));setReviewingId(null);setNotes('');toast(`Request ${next}.`)}
    catch(e){toast(e instanceof Error?e.message:'Review failed.','error')}
  }
  return <DataSection title="Role requests" description={`${pendingCount.toLocaleString()} pending marketplace role switch requests`} query={query} setQuery={setQuery} filter={<select className="admin-select" value={status} onChange={e=>setStatus(e.target.value as 'all'|RoleRequestStatus)}>{roleRequestFilters.map(s=><option key={s} value={s}>{s==='all'?'All requests':s}</option>)}</select>}>
    {items.length===0?<AdminEmpty title="No role requests" description="Buyer/seller switch requests will appear here."/>:
      <div className="grid gap-4">{shown.map(r=><article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950"><UserCircle className="size-5"/></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{r.userName}</h3><Status value={r.status}/></div><p className="mt-1 text-xs text-slate-400">{r.userEmail}</p><div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium capitalize dark:bg-slate-800">{r.fromRole}</span><ArrowRightLeft className="size-3 text-slate-400"/><span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium capitalize text-teal-700 dark:bg-teal-950 dark:text-teal-300">{r.requestedRole}</span><span className="text-slate-400">· {new Date(r.createdAt).toLocaleDateString()}</span></div></div></div></div>{r.adminNotes&&<p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">{r.adminNotes}</p>}{r.reviewedByName&&<p className="mt-2 text-xs text-slate-400">Reviewed by {r.reviewedByName}</p>}{reviewingId===r.id&&<div className="mt-4 space-y-3"><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Admin notes (optional)" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800" rows={2}/><div className="flex justify-end gap-2"><Button variant="ghost" onClick={()=>{setReviewingId(null);setNotes('')}}>Cancel</Button><Button variant="secondary" onClick={()=>void review(r.id,'rejected')}>Reject</Button><Button onClick={()=>void review(r.id,'approved')}>Approve</Button></div></div>}{r.status==='pending'&&!reviewingId&&<div className="mt-4 flex justify-end"><Button variant="secondary" onClick={()=>setReviewingId(r.id)}>Review request</Button></div>}{!r.adminNotes&&r.status!=='pending'&&<p className="mt-3 text-xs italic text-slate-400">No admin notes</p>}</article>)}
        {shown.length===0&&<AdminEmpty title="No matching requests" description="Try a different filter or search term."/>}</div>}
  </DataSection>
}
