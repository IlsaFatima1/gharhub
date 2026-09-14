import { readFileSync } from 'fs'

const token = process.env.SUPABASE_ACCESS_TOKEN
const ref = 'scrvdiwlnosmrxnktloc'

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  })
  const data = await res.json()
  if (!res.ok) {
    console.log('HTTP ERROR:', res.status, JSON.stringify(data).slice(0, 500))
    return null
  }
  return data
}

console.log('=== FUNCTIONS ===')
const funcs = await runSql(`
  SELECT p.proname, p.prosecdef as security_definer
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid 
  WHERE n.nspname = 'public' 
  AND p.proname IN ('get_or_create_property_conversation','is_conversation_member','mark_conversation_read')
`)
if (funcs) console.table(funcs)

console.log('\n=== RPC PERMISSIONS ===')
const perms = await runSql(`
  SELECT grantee, privilege_type 
  FROM information_schema.routine_privileges 
  WHERE routine_name = 'get_or_create_property_conversation'
  AND routine_schema = 'public'
`)
if (perms) console.table(perms)

console.log('\n=== RLS POLICIES ===')
const policies = await runSql(`
  SELECT tablename, policyname, cmd 
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('conversations','conversation_members','messages')
  ORDER BY tablename, policyname
`)
if (policies) console.table(policies)

console.log('\n=== ALL USERS ===')
const users = await runSql(`SELECT id, email FROM auth.users`)
if (users) console.table(users)

console.log('\n=== ALL PROFILES ===')
const profiles = await runSql(`SELECT user_id, full_name, marketplace_role FROM profiles`)
if (profiles) console.table(profiles)

console.log('\n=== PUBLISHED PROPERTIES ===')
const props = await runSql(`SELECT id, title, owner_id, status FROM properties WHERE status = 'published'`)
if (props) console.table(props)

console.log('\n=== CONVERSATIONS ===')
const convs = await runSql(`SELECT * FROM conversations`)
if (convs) console.table(convs)

console.log('\n=== CONVERSATION MEMBERS ===')
const mems = await runSql(`SELECT * FROM conversation_members`)
if (mems) console.table(mems)

console.log('\n=== MESSAGES ===')
const msgs = await runSql(`SELECT * FROM messages`)
if (msgs) console.table(msgs)

// Test RPC as postgres (bypasses RLS)
if (props && props.length > 0 && users && users.length > 1) {
  const buyer = users.find(u => {
    const p = profiles?.find(pr => pr.user_id === u.id)
    return !p || p.marketplace_role !== 'seller'
  }) || users[0]
  const prop = props[0]
  console.log(`\n=== TEST RPC as postgres ===`)
  console.log(`Using property: ${prop.id}, seller/owner: ${prop.owner_id}, buyer: ${buyer.id}`)
  const rpc = await runSql(`SELECT public.get_or_create_property_conversation('${prop.id}'::uuid, '${prop.owner_id}'::uuid) as conv_id`)
  console.log('RPC result:', rpc)
}

console.log('\nDone.')
