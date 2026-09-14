import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url=import.meta.env.VITE_SUPABASE_URL as string|undefined
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined
export const isSupabaseConfigured=Boolean(url&&key&&!url.includes('your-project'))
// The runtime can be null in local preview mode; the client type keeps
// realtime callbacks stable after the provider's explicit configuration guard.
export const supabase=(isSupabaseConfigured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},realtime:{params:{eventsPerSecond:10}}}):null) as SupabaseClient