import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Building2, FileWarning, RefreshCw, ScrollText, ShieldAlert, ShieldCheck, Sparkles, Users, UserCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { isSupabaseConfigured } from '../../lib/supabase'
import { adminRepository } from './admin-repository'
import type { AdminProperty, AdminReport, AdminSection, AdminStats, AdminUser, AiUsageRow, AuditRow, AdminRoleRequest } from './types'
import { AdminEmpty, AuditPanel, AiUsagePanel, LoadingState, OverviewPanel, PropertiesPanel, ReportsPanel, UsersPanel, RoleRequestsPanel } from './panels'

const sections:{id:AdminSection;label:string;icon:typeof Users}[]=[
  {id:'overview',label:'Overview',icon:BarChart3},
  {id:'properties',label:'Properties',icon:Building2},
  {id:'reports',label:'Reports',icon:FileWarning},
  {id:'users',label:'Users',icon:Users},
  {id:'ai',label:'AI usage',icon:Sparkles},
  {id:'audit',label:'Audit log',icon:ScrollText},
  {id:'role-requests',label:'Role requests',icon:UserCircle},
]

export function AdminRoute(){
  const {user}=useAuth()
  if(!user)return <Navigate to="/login" replace/>
  if(user.role!=='Admin')return <AccessDenied/>
  return <AdminDashboard/>
}

function AccessDenied(){
  return <div className="mx-auto grid min-h-[65vh] max-w-xl place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-rose-50 text-rose-600 dark:bg-rose-950"><ShieldAlert className="size-7"/></span><h1 className="mt-5 font-display text-2xl font-semibold">Administrator access required</h1><p className="mt-2 text-sm leading-6 text-slate-500">This workspace is restricted to authorized GharHub operations staff. Administrator roles are assigned through secure identity claims.</p></div></div>
}

type AdminData={s:AdminStats|null;u:AdminUser[];p:AdminProperty[];r:AdminReport[];a:AiUsageRow[];g:AuditRow[];rr:AdminRoleRequest[]}

function hydrate(input:AdminData):Required<Pick<AdminData,'s'|'u'|'p'|'r'|'a'|'g'|'rr'>>{
  const names=new Map(input.u.map(x=>[x.id,x.name]))
  return{
    s:input.s,
    u:input.u,
    p:input.p.map(x=>({...x,ownerName:names.get(x.ownerId)??'Unknown owner'})),
    r:input.r.map(x=>({...x,propertyTitle:input.p.find(y=>y.id===x.propertyId)?.title??'Removed property',reporterName:names.get(x.reporterId)??'Unknown reporter'})),
    a:input.a.map(x=>({...x,userName:names.get(x.userId)??'Unknown user'})),
    g:input.g.map(x=>({...x,adminName:names.get(x.adminId)??'Unknown admin'})),
    rr:input.rr,
  }
}

function messageFor(error:unknown):string{return error instanceof Error?error.message:'Admin data could not be loaded.'}

function useAdminData(){
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState<string|null>(null)
  const [stats,setStats]=useState<AdminStats|null>(null)
  const [users,setUsers]=useState<AdminUser[]>([])
  const [properties,setProperties]=useState<AdminProperty[]>([])
  const [reports,setReports]=useState<AdminReport[]>([])
  const [ai,setAi]=useState<AiUsageRow[]>([])
  const [audit,setAudit]=useState<AuditRow[]>([])
  const [roleRequests,setRoleRequests]=useState<AdminRoleRequest[]>([])
  const commit=useCallback((input:AdminData)=>{const next=hydrate(input);setStats(next.s);setUsers(next.u);setProperties(next.p);setReports(next.r);setAi(next.a);setAudit(next.g);setRoleRequests(next.rr)},[])
  useEffect(()=>{
    let active=true
    void Promise.all([
      adminRepository.stats(),
      adminRepository.users(),
      adminRepository.properties(),
      adminRepository.reports(),
      adminRepository.aiUsage(),
      adminRepository.auditLogs(),
      adminRepository.roleRequests(),
    ]).then(([s,u,p,r,a,g,rr])=>{
      if(!active)return
      commit({s,u,p,r,a,g,rr})
    }).catch((cause)=>{
      if(active)setError(messageFor(cause))
    }).finally(()=>{
      if(active)setLoading(false)
    })
    return()=>{active=false}
  },[commit])
  const reload=useCallback(async()=>{
    setLoading(true);setError(null)
    try{
      const [s,u,p,r,a,g,rr]=await Promise.all([
        adminRepository.stats(),
        adminRepository.users(),
        adminRepository.properties(),
        adminRepository.reports(),
        adminRepository.aiUsage(),
        adminRepository.auditLogs(),
        adminRepository.roleRequests(),
      ])
      commit({s,u,p,r,a,g,rr})
    }catch(cause){
      setError(messageFor(cause))
    }finally{
      setLoading(false)
    }
  },[commit])
  return{loading,error,stats,users,properties,reports,ai,audit,roleRequests,setProperties,setReports,setUsers,setRoleRequests,reload}
}

function AdminDashboard(){
  const {user}=useAuth()
  const [section,setSection]=useState<AdminSection>('overview')
  const {loading,error,stats,users,properties,reports,ai,audit,roleRequests,setProperties,setReports,setUsers,setRoleRequests,reload}=useAdminData()
  const openReports=reports.filter(r=>r.status==='open').length
  const pendingRoles=roleRequests.filter(r=>r.status==='pending').length
  return <div className="mx-auto max-w-[1500px]">
    <motion.header initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-teal-700"><ShieldCheck className="size-4"/>Operations control center</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Platform intelligence</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor marketplace health, trust, growth, and revenue in real time.</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900 sm:flex"><span className="size-2 rounded-full bg-emerald-500"/>Live Supabase data</span>
        <Button variant="secondary" onClick={()=>void reload()}><RefreshCw className={`size-4 ${loading?'animate-spin':''}`}/>Refresh</Button>
      </div>
    </motion.header>
    <div className="mt-7 overflow-x-auto border-b border-slate-200 dark:border-slate-800"><nav className="flex min-w-max gap-1">
      {sections.map(({id,label,icon:Icon})=><button key={id} onClick={()=>setSection(id)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${section===id?'border-teal-600 text-teal-700':'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Icon className="size-4"/>{label}{id==='reports'&&openReports>0&&<span className="rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600">{openReports}</span>}{id==='role-requests'&&pendingRoles>0&&<span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-700">{pendingRoles}</span>}</button>)}
    </nav></div>
    <motion.div key={section} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="mt-7">
      {loading&&!error?<LoadingState/>:
       error?<div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30"><p className="font-semibold text-rose-700 dark:text-rose-300">Operations data could not be loaded</p><p className="mt-1 text-sm text-rose-600/70">{error}</p><Button className="mt-4" variant="secondary" onClick={()=>void reload()}>Try again</Button></div>:
       !isSupabaseConfigured?<div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"><AdminEmpty title="Supabase is not configured" description="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect the admin panel to live platform data."/></div>:
       section==='overview'?<OverviewPanel stats={stats} properties={properties} reports={reports} audit={audit}/>:
       section==='properties'?<PropertiesPanel items={properties} setItems={setProperties}/>:
       section==='reports'?<ReportsPanel items={reports} setItems={setReports}/>:
       section==='users'?<UsersPanel items={users} setItems={setUsers} selfId={user?.id??''}/>:
       section==='ai'?<AiUsagePanel items={ai}/>:
       section==='role-requests'?<RoleRequestsPanel items={roleRequests} setItems={setRoleRequests}/>:
       <AuditPanel items={audit}/>}
    </motion.div>
  </div>
}
