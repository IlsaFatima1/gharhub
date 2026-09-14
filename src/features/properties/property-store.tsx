import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { captureError, logEvent } from '../../lib/monitoring'
import { useAuth } from '../../lib/auth'
import { fromRow, propertyRepository } from './property-repository'
import type { Property, PropertyInput, PropertyStatus } from './types'
import type { SearchFilters } from '../search/search-service'

type Store={properties:Property[];loading:boolean;error:string|null;refresh:()=>Promise<void>;fetchOne:(id:string)=>Promise<Property|null>;search:(filters:SearchFilters)=>Promise<Property[]>;create:(input:PropertyInput,publish:boolean)=>Promise<Property>;update:(id:string,input:PropertyInput)=>Promise<void>;remove:(id:string)=>Promise<void>;setStatus:(id:string,status:PropertyStatus)=>Promise<void>;get:(id:string)=>Property|undefined}
const Context=createContext<Store|null>(null)
export function PropertyProvider({children}:{children:ReactNode}){const {user,loading:authLoading}=useAuth();const [properties,setProperties]=useState<Property[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null)
 const refresh=async()=>{setLoading(true);try{setProperties(await propertyRepository.list());setError(null)}catch(e){captureError(e,{feature:'properties',operation:'list'});setError(e instanceof Error?e.message:'Properties could not be loaded.')}finally{setLoading(false)}}
 useEffect(()=>{if(authLoading)return;if(supabase&&!user?.id){setProperties([]);setError(null);setLoading(false);return}setProperties([]);void refresh();if(!supabase)return;const channel=supabase.channel(`live-properties:${user?.id??'public'}`).on('postgres_changes',{event:'*',schema:'public',table:'properties'},payload=>{if(payload.eventType==='DELETE'){setProperties(current=>current.filter(p=>p.id!==(payload.old as {id:string}).id));return}const changed=fromRow(payload.new as Parameters<typeof fromRow>[0]);setProperties(current=>[changed,...current.filter(p=>p.id!==changed.id)].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)))}).subscribe();return()=>{void supabase.removeChannel(channel)}},[user?.id,authLoading])
 const value=useMemo<Store>(()=>({properties,loading,error,refresh,fetchOne:async id=>{const existing=properties.find(p=>p.id===id);if(existing)return existing;const property=await propertyRepository.getById(id);if(property)setProperties(current=>[property,...current.filter(p=>p.id!==id)]);return property},search:async filters=>{try{return await propertyRepository.search(filters)}catch(e){captureError(e,{feature:'properties',operation:'search'});throw e}},create:async(input,publish)=>{const property=await propertyRepository.create(input,publish?'published':'draft');setProperties(current=>[property,...current]);logEvent('property_created',{id:property.id,status:property.status});return property},update:async(id,input)=>{const property=await propertyRepository.update(id,input);setProperties(current=>current.map(p=>p.id===id?property:p));logEvent('property_updated',{id})},remove:async id=>{await propertyRepository.remove(id);setProperties(current=>current.filter(p=>p.id!==id));logEvent('property_deleted',{id})},setStatus:async(id,status)=>{const property=await propertyRepository.status(id,status);setProperties(current=>current.map(p=>p.id===id?property:p));logEvent('property_status_changed',{id,status})},get:id=>properties.find(p=>p.id===id)}),[properties,loading,error]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useProperties(){const value=useContext(Context);if(!value)throw new Error('useProperties must be inside PropertyProvider');return value}

export function useAllPublishedProperties(){
  const [properties,setProperties]=useState<Property[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{let cancelled=false;(async()=>{try{const data=await propertyRepository.allPublished();if(!cancelled)setProperties(data)}catch{if(!cancelled)setProperties([])}finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[])
  return {properties,loading}
}
