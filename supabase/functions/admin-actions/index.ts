import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Resolve the caller from their session JWT and require the admin claim.
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: { user } } = await caller.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)
  const { data: isAdmin, error: isAdminError } = await caller.rpc('is_admin')
  if (isAdminError || !isAdmin) return json({ error: 'Administrator access required' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const action = body.action
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  if (action === 'set_admin_role') {
    const user_id = body.user_id
    const is_admin = body.is_admin
    if (typeof user_id !== 'string' || typeof is_admin !== 'boolean') {
      return json({ error: 'user_id and is_admin are required' }, 400)
    }
    if (user_id === user.id) return json({ error: 'You cannot change your own role' }, 400)

    const { data: target, error: targetError } = await service.auth.admin.getUserById(user_id)
    if (targetError || !target?.user) return json({ error: 'User not found' }, 404)

    const appMetadata = { ...target.user.app_metadata } as Record<string, unknown>
    if (is_admin) appMetadata.role = 'admin'
    else delete appMetadata.role

    const { error: updateError } = await service.auth.admin.updateUserById(user_id, { app_metadata: appMetadata })
    if (updateError) return json({ error: updateError.message }, 500)

    await service.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: is_admin ? 'grant_admin' : 'revoke_admin',
      entity_type: 'user',
      entity_id: user_id,
      after_data: { role: is_admin ? 'admin' : 'member' },
    })

    return json({ ok: true, is_admin })
  }

  return json({ error: 'Unknown action' }, 400)
})

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
