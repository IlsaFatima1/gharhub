import { z } from 'npm:zod'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

const REPLICATE_MODEL = 'openai/gpt-4.1-mini'
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions'

const searchSchema = z.object({ filters: z.object({ query: z.string(), city: z.string(), area: z.string(), minPrice: z.string(), maxPrice: z.string(), minSquareFeet: z.string(), maxSquareFeet: z.string(), bedrooms: z.string(), bathrooms: z.string(), purpose: z.enum(['', 'sale', 'rent']), propertyType: z.enum(['', 'house', 'apartment', 'villa', 'townhouse', 'land', 'commercial']), sort: z.enum(['newest', 'oldest', 'price-low', 'price-high']) }), summary: z.string(), assumptions: z.array(z.string()) })
const schemas = {
  title: z.object({ title: z.string().min(5).max(100) }),
  description: z.object({ description: z.string().min(30).max(3000) }),
  price: z.object({ suggestedPrice: z.number().positive(), low: z.number().positive(), high: z.number().positive(), confidence: z.number().min(0).max(100), rationale: z.string(), currency: z.string() }),
  search: searchSchema,
  recommend: z.object({ propertyIds: z.array(z.string()).max(6), reason: z.string(), matches: z.array(z.object({ id: z.string(), criteria: z.array(z.string()) })).max(6) }),
  chat: z.object({ answer: z.string().max(1500), suggestedPrompts: z.array(z.string()).max(4), propertyIds: z.array(z.string()).max(5) }),
  studio: z.object({
    title: z.string().max(100).nullable(),
    description: z.string().max(3000).nullable(),
    highlights: z.array(z.string().max(300)).max(12).nullable(),
    estimatedPrice: z.object({ min: z.number().positive(), max: z.number().positive(), currency: z.string(), note: z.string().max(300) }).nullable(),
  }),
} as const
type Task = keyof typeof schemas

const instructions: Record<Task, string> = {
  title: 'Create one specific, truthful, premium property listing title. Never invent features.',
  description: 'Write a polished, fair-housing-compliant property description from only supplied facts. Do not invent amenities, views, schools, distances, or guarantees. Avoid discriminatory language.',
  price: 'Act as a conservative property valuation assistant. Analyze supplied listing facts and comparables. Express all amounts in Pakistani Rupees (PKR). Never present as an appraisal.',
  search: 'Convert multilingual property intent into structured search filters. Understand Pakistani units: 1 crore PKR=10,000,000 and 1 lakh=100,000. DHA is an area. Preserve unknown concepts in query or assumptions. Use empty strings when unspecified.',
  recommend: 'You are GharHub AI Matches. Rank the supplied published properties against the user preferences and optional reference property. Consider purpose, budget, Karachi area, property type, bedrooms, bathrooms, and square feet. Output the top ranked property IDs (max 6) and a reason text that names the specific criteria each top property satisfied (e.g., budget, area, bedrooms, type). Never output an ID that is not in the supplied catalog.',
  chat: 'You are GharHub AI, a concise property marketplace assistant. Answer from supplied catalog and app context. Never provide legal, financial, or appraisal certainty. Recommend only supplied property IDs. For a property search, mention useful constraints and provide matching IDs.',
  studio: 'You are GharHub AI Listing Studio. A seller gives you property facts and an ACTION (title, description, highlights, price, or improve). Generate content ONLY for the requested action and set every other field to null. Use ONLY the supplied facts. Never invent location, bedrooms, bathrooms, square footage, amenities, condition, ownership, nearby facilities, exact market value, or availability. If required information is missing, say so in the note or answer instead of inventing values. Price output is AI guidance only: label it clearly as an ESTIMATE, never a guaranteed market value. The improve action rewrites BOTH the title and the description, preserving factual information and only polishing wording.',
}

const jsonShapes: Record<Task, string> = {
  title: '{"title":"one premium listing title (5-100 chars)"}',
  description: '{"description":"polished property description (30-3000 chars)"}',
  price: '{"suggestedPrice":number,"low":number,"high":number,"confidence":number(0-100),"rationale":"string","currency":"PKR"}',
  search: '{"filters":{"query":"string","city":"string","area":"string","minPrice":"string","maxPrice":"string","minSquareFeet":"string","maxSquareFeet":"string","bedrooms":"string","bathrooms":"string","purpose":"sale|rent|(empty string)","propertyType":"house|apartment|villa|townhouse|land|commercial|(empty string)","sort":"newest|oldest|price-low|price-high"},"summary":"string","assumptions":["string"]}',
  recommend: '{"propertyIds":["id from supplied catalog only, max 6"],"reason":"text naming the specific matching criteria (budget, area, type, bedrooms, etc.)"}',
  chat: '{"answer":"your reply to the user","suggestedPrompts":["optional follow-up prompts, max 4"],"propertyIds":["matching real property ids from the supplied catalog only, max 5"]}',
  studio: '{"title":"...only for title action or improve action, else null","description":"...only for description action or improve action, else null","highlights":["one","two","..."] or null when not requested,"estimatedPrice":{"min":number,"max":number,"currency":"PKR","note":"AI estimate only - do not treat as a guaranteed market value; mention any missing facts"} or null when not the price action}',
}

function safeLog(kind: string, message: string, extra?: Record<string, unknown>): void {
  const base = `[ai-property][${kind}] ${message}`
  if (extra) {
    const safeExtra = {}
    for (const [k, v] of Object.entries(extra)) {
      if (k !== 'stack' && !k.includes('key') && !k.includes('token') && !k.includes('secret')) {
        safeExtra[k] = v
      }
    }
    console.error(base, JSON.stringify(safeExtra))
  } else {
    console.error(base)
  }
}

async function runReplicate(systemPrompt: string, userPrompt: string): Promise<string> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await runReplicateOnce(systemPrompt, userPrompt)
    } catch (e) {
      lastError = e
      const msg = e instanceof Error ? e.message : String(e)
      const transient = msg.includes('timed out') || msg.includes('prediction failed') || msg.includes('canceled') || /Replicate API error: (429|[5]\d\d)/.test(msg)
      if (attempt === 4 || !transient) break
      const retryAfterMs = Number((e as { retryAfterMs?: number })?.retryAfterMs) || 2500
      safeLog('warn', 'Replicate transient failure, retrying', { attempt, retryMs: Math.round(retryAfterMs) })
      await new Promise(r => setTimeout(r, Math.min(retryAfterMs, 12000)))
    }
  }
  throw lastError
}

async function runReplicateOnce(systemPrompt: string, userPrompt: string): Promise<string> {
  const token = Deno.env.get('REPLICATE_API_TOKEN')
  if (!token) throw new Error('REPLICATE_API_TOKEN not configured')

  const version = Deno.env.get('REPLICATE_MODEL_VERSION') || REPLICATE_MODEL
  const input = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    top_p: 0.9,
  }

  const createResp = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({ version, input }),
  })

  if (!createResp.ok) {
    const errText = await createResp.text()
    const retryAfterRaw = createResp.headers.get('retry-after')
    const retryAfterSec = retryAfterRaw ? Math.max(0, parseInt(retryAfterRaw, 10)) : 0
    const err = new Error(`Replicate API error: ${createResp.status} ${errText.slice(0, 120)}`)
    if (createResp.status === 429 && retryAfterSec) (err as { retryAfterMs?: number }).retryAfterMs = retryAfterSec * 1000
    safeLog('error', 'Replicate prediction create failed', { status: createResp.status })
    throw err
  }

  const prediction = await createResp.json()
  if (prediction.error) {
    safeLog('error', 'Replicate prediction error', { error: prediction.error })
    throw new Error(`Replicate prediction failed: ${String(prediction.error).slice(0, 120)}`)
  }

  let output = prediction.output
  if (prediction.status !== 'succeeded') {
    const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1000))
      const pollResp = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      const pollData = await pollResp.json()
      if (pollData.status === 'succeeded') { output = pollData.output; break }
      if (pollData.status === 'failed' || pollData.status === 'canceled') {
        const detail = typeof pollData.error === 'string' ? pollData.error : ''
        safeLog('error', 'Replicate prediction failed', { status: pollData.status })
        throw new Error(`Replicate prediction ${pollData.status}${detail ? `: ${detail.slice(0, 120)}` : ''}`)
      }
    }
    if (!output) throw new Error('Replicate prediction timed out')
  }

  return Array.isArray(output) ? output.join('') : String(output ?? '')
}

function parseJson(text: string): unknown {
  const t = text.trim()
  if (!t) return undefined
  try { return JSON.parse(t) } catch { /* not plain JSON */ }
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (m) { try { return JSON.parse(m[1].trim()) } catch { /* not fenced JSON */ } }
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end > start) { try { return JSON.parse(t.slice(start, end + 1)) } catch { /* not an object */ } }
  return undefined
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v.replace(/,/g, ''))
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function normalizeResult(task: Task, raw: string, meta?: Record<string, unknown>): unknown {
  const parsed = parseJson(raw)
  let box: Record<string, unknown> | null = isObj(parsed) ? parsed : null
  let content = box ? '' : raw.trim()

  if (box) {
    const needsUnwrap = typeof box.response === 'string' &&
      box.answer === undefined && box.title === undefined && box.description === undefined &&
      box.filters === undefined && box.propertyIds === undefined && box.suggestedPrice === undefined
    if (needsUnwrap) {
      const inner = parseJson(box.response)
      if (isObj(inner)) {
        box = { ...box, ...inner }
        delete box.response
      } else {
        content = box.response
        box = null
      }
    }
  }

  switch (task) {
    case 'chat': {
      const answer = box?.answer ?? content
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Replicate returned no chat answer')
      return {
        answer: answer.trim().slice(0, 1500),
        suggestedPrompts: Array.isArray(box?.suggestedPrompts) ? box.suggestedPrompts.map(String).slice(0, 4) : [],
        propertyIds: Array.isArray(box?.propertyIds) ? box.propertyIds.map(String).slice(0, 5) : [],
      }
    }
    case 'title': {
      const title = box?.title ?? content
      if (typeof title !== 'string' || !title.trim()) throw new Error('Replicate returned no title')
      return { title: title.trim().slice(0, 100) }
    }
    case 'description': {
      const description = box?.description ?? content
      if (typeof description !== 'string' || !description.trim()) throw new Error('Replicate returned no description')
      return { description: description.trim().slice(0, 3000) }
    }
    case 'price': {
      const w = box ?? {}
      const suggestedPrice = toNumber(w.suggestedPrice) ?? null
      if (!suggestedPrice) throw new Error('Replicate returned no price estimate')
      return {
        suggestedPrice,
        low: toNumber(w.low) ?? Math.round(suggestedPrice * 0.9),
        high: toNumber(w.high) ?? Math.round(suggestedPrice * 1.1),
        confidence: toNumber(w.confidence) ?? 40,
        rationale: typeof w.rationale === 'string' && w.rationale.trim() ? w.rationale.trim() : (content.trim() || 'AI valuation estimate based on supplied listing facts and comparables.'),
        currency: typeof w.currency === 'string' && w.currency ? w.currency : 'PKR',
      }
    }
    case 'search': {
      const rawFilters = isObj(box?.filters) ? box.filters : {}
      const s = (v: unknown) => (v === undefined || v === null ? '' : String(v))
      const filters = {
        query: s(rawFilters.query),
        city: s(rawFilters.city),
        area: s(rawFilters.area),
        minPrice: s(rawFilters.minPrice),
        maxPrice: s(rawFilters.maxPrice),
        minSquareFeet: s(rawFilters.minSquareFeet),
        maxSquareFeet: s(rawFilters.maxSquareFeet),
        bedrooms: s(rawFilters.bedrooms),
        bathrooms: s(rawFilters.bathrooms),
        purpose: s(rawFilters.purpose) as '' | 'sale' | 'rent',
        propertyType: s(rawFilters.propertyType) as '' | 'house' | 'apartment' | 'villa' | 'townhouse' | 'land' | 'commercial',
        sort: s(rawFilters.sort) as 'newest' | 'oldest' | 'price-low' | 'price-high',
      }
      return {
        filters,
        summary: typeof box?.summary === 'string' ? box.summary : '',
        assumptions: Array.isArray(box?.assumptions) ? box.assumptions.map(String) : [],
      }
    }
    case 'recommend': {
      if (!Array.isArray(box?.propertyIds) || !box.propertyIds.length) throw new Error('Replicate returned no property matches')
      if (typeof box?.reason !== 'string') throw new Error('Replicate returned no match reason')
      return { propertyIds: box.propertyIds.map(String).slice(0, 6), reason: box.reason }
    }
    case 'studio': {
      const action = meta?.action
      const result: { title: string | null; description: string | null; highlights: string[] | null; estimatedPrice: { min: number; max: number; currency: string; note: string } | null } = { title: null, description: null, highlights: null, estimatedPrice: null }
      if (action === 'title' || action === 'improve') {
        const title = typeof box?.title === 'string' && box.title.trim() ? box.title.trim().slice(0, 100) : content.trim().slice(0, 100)
        if (!title && action !== 'improve') throw new Error('Replicate returned no title')
        if (title) result.title = title
      }
      if (action === 'description' || action === 'improve') {
        const description = typeof box?.description === 'string' && box.description.trim() ? box.description.trim().slice(0, 3000) : content.trim().slice(0, 3000)
        if (!description && action !== 'improve') throw new Error('Replicate returned no description')
        if (description) result.description = description
      }
      if (action === 'improve' && !result.title && !result.description) throw new Error('Replicate returned no improved content')
      if (action === 'highlights') {
        const highlights = Array.isArray(box?.highlights) ? box.highlights.map(String).map(h => h.trim()).filter(Boolean).slice(0, 12) : (content.trim() ? content.split('\n').map(l => l.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 12) : [])
        if (!highlights.length) throw new Error('Replicate returned no highlights')
        result.highlights = highlights
      }
      if (action === 'price') {
        const w = isObj(box?.estimatedPrice) ? box.estimatedPrice : box ?? {}
        const min = toNumber(w.min)
        const max = toNumber(w.max)
        if (!min || !max) throw new Error('Replicate returned no price estimate')
        result.estimatedPrice = {
          min: Math.min(min, max),
          max: Math.max(min, max),
          currency: typeof w.currency === 'string' && w.currency ? String(w.currency) : 'PKR',
          note: typeof w.note === 'string' && w.note.trim() ? w.note.trim().slice(0, 300) : 'AI estimate only, not a guaranteed market value.',
        }
      }
      return result
    }
  }
}

async function handleRecommend(supabase: ReturnType<typeof createClient>, payload: Record<string, unknown>, systemPrompt: string): Promise<Response> {
  const preferences = isObj(payload.preferences) ? payload.preferences : {}
  const excludeIds = Array.isArray(payload.excludeIds) ? payload.excludeIds.map(String) : []
  const reference = isObj(payload.reference) ? payload.reference : null

  const toNum = (v: unknown): number | null => { if (typeof v === 'number' && Number.isFinite(v)) return v; if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v); return null }
  const purpose = typeof preferences.purpose === 'string' && preferences.purpose ? preferences.purpose : ''
  const area = typeof preferences.area === 'string' ? preferences.area : ''
  const propertyType = typeof preferences.propertyType === 'string' ? preferences.propertyType : ''
  const minPrice = toNum(preferences.minPrice)
  const maxPrice = toNum(preferences.maxPrice)
  const minSqft = toNum(preferences.minSquareFeet)
  const maxSqft = toNum(preferences.maxSquareFeet)
  const bedrooms = toNum(preferences.bedrooms)
  const bathrooms = toNum(preferences.bathrooms)

  let q = supabase.from('properties').select('*').eq('status', 'published')
  if (purpose) q = q.eq('purpose', purpose)
  if (area) q = q.eq('area', area)
  if (propertyType) q = q.eq('property_type', propertyType)
  if (minPrice) q = q.gte('price', minPrice)
  if (maxPrice) q = q.lte('price', maxPrice)
  if (minSqft) q = q.gte('square_feet', minSqft)
  if (maxSqft) q = q.lte('square_feet', maxSqft)
  if (bedrooms) q = q.gte('bedrooms', bedrooms)
  if (bathrooms) q = q.gte('bathrooms', bathrooms)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(`Published properties could not be loaded: ${error.message}`)

  const candidates = ((data ?? []) as Record<string, unknown>[]).map(compactRow).filter(c => !excludeIds.includes(c.id))
  const prefs = { purpose, area, propertyType, minPrice, maxPrice, minSqft, maxSqft, bedrooms, bathrooms }
  const noMatch = 'No matching properties found. Try increasing your budget or changing your preferred area.'
  if (!candidates.length) {
    const reason = reference ? 'GharHub AI did not find other published properties matching these preferences. Try a different area or budget.' : noMatch
    return response({ result: { propertyIds: [], reason, matches: [] } }, 200)
  }

  safeLog('info', 'Calling Replicate', { task: 'recommend', model: REPLICATE_MODEL, candidates: candidates.length })
  const raw = await runReplicate(systemPrompt, `Input data:\n${JSON.stringify({ preferences, reference, catalog: candidates })}\n\nReturn ONLY the JSON object described in the system prompt, nothing else.`)
  const base = normalizeResult('recommend', raw) as { propertyIds: string[]; reason: string }
  const valid = [...new Set(base.propertyIds.map(String).slice(0, 6).filter(id => candidates.some(c => c.id === id)))]
  const matches = valid.map(id => { const c = candidates.find(x => x.id === id)!; return { id, criteria: matchCriteria(c, prefs, reference) } })
  const reason = matches.length ? base.reason : noMatch
  const assembled = { propertyIds: valid, reason, matches }
  const parsed = schemas.recommend.safeParse(assembled)
  if (!parsed.success) throw new Error('Model returned invalid match results')
  safeLog('info', 'Replicate call succeeded', { task: 'recommend', matches: matches.length })
  return response({ result: parsed.data }, 200)
}

function compactRow(r: Record<string, unknown>) {
  return { id: String(r.id), title: String(r.title ?? ''), price: Number(r.price ?? 0), purpose: String(r.purpose ?? ''), propertyType: String(r.property_type ?? ''), customPropertyType: String(r.custom_property_type ?? ''), bedrooms: Number(r.bedrooms ?? 0), bathrooms: Number(r.bathrooms ?? 0), squareFeet: Number(r.square_feet ?? 0), city: String(r.city ?? ''), area: String(r.area ?? '') }
}

function matchCriteria(prop: ReturnType<typeof compactRow>, prefs: Record<string, unknown>, reference: Record<string, unknown> | null): string[] {
  const criteria: string[] = []
  const purpose = String(prefs.purpose ?? '')
  const area = String(prefs.area ?? '')
  const propertyType = String(prefs.propertyType ?? '')
  const minPrice = prefs.minPrice as number | null
  const maxPrice = prefs.maxPrice as number | null
  const minSqft = prefs.minSqft as number | null
  const maxSqft = prefs.maxSqft as number | null
  const bedrooms = prefs.bedrooms as number | null
  const bathrooms = prefs.bathrooms as number | null
  if (purpose && prop.purpose === purpose) criteria.push('Purpose matches')
  if (area && prop.area === area) criteria.push('Area matches')
  if (propertyType && prop.propertyType === propertyType) criteria.push('Property type matches')
  if (minPrice && maxPrice && prop.price >= minPrice && prop.price <= maxPrice) criteria.push('Budget matches')
  else if (minPrice && !maxPrice && prop.price >= minPrice) criteria.push('Within budget range')
  else if (maxPrice && !minPrice && prop.price <= maxPrice) criteria.push('Within budget range')
  if (bedrooms && prop.bedrooms >= bedrooms) criteria.push('Bedrooms match')
  if (bathrooms && prop.bathrooms >= bathrooms) criteria.push('Bathrooms match')
  if (minSqft && maxSqft && prop.squareFeet >= minSqft && prop.squareFeet <= maxSqft) criteria.push('Square feet matches')
  else if (minSqft && !maxSqft && prop.squareFeet >= minSqft) criteria.push('Meets minimum square feet')
  else if (maxSqft && !minSqft && prop.squareFeet <= maxSqft) criteria.push('Within maximum square feet')
  if (reference) {
    const refPrice = Number(reference.price)
    if (refPrice && prop.id !== reference.id && prop.price >= refPrice * 0.75 && prop.price <= refPrice * 1.25) criteria.push('Similar budget to your property')
    if (reference.area && prop.area === reference.area) criteria.push('Same area as your property')
    if (reference.propertyType && prop.propertyType === reference.propertyType) criteria.push('Same type as your property')
  }
  return criteria
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const auth = req.headers.get('Authorization')
    if (!auth) return response({ error: 'Authentication required' }, 401)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return response({ error: 'Authentication required' }, 401)

    const { task, payload } = await req.json()
    if (!(task in schemas)) return response({ error: 'Unsupported AI task' }, 400)

    const input = JSON.stringify(payload)
    if (input.length > 30000) return response({ error: 'Request is too large' }, 413)

    const { data: allowed, error: rateError } = await supabase.rpc('consume_ai_quota', { operation: task })
    if (rateError || !allowed) return response({ error: 'AI usage limit reached. Try again shortly.' }, 429)

    const systemPrompt = task === 'studio'
      ? `${instructions.studio}\n\nREQUESTED ACTION: "${String(payload?.action ?? '')}".\n\nRespond with ONLY a single valid JSON object in EXACTLY this shape (NO markdown, NO commentary, NO extra text):\n\n${jsonShapes.studio}`
      : `${instructions[task]}\n\nRespond with ONLY a single valid JSON object in EXACTLY this shape (NO markdown, NO commentary, NO extra text):\n\n${jsonShapes[task]}`

    if (task === 'recommend') return await handleRecommend(supabase, payload, systemPrompt)

    const userPrompt = `Input data:\n${input}\n\nReturn ONLY the JSON object described in the system prompt, nothing else.`

    safeLog('info', 'Calling Replicate', { task, model: REPLICATE_MODEL })
    const raw = await runReplicate(systemPrompt, userPrompt)
    const normalized = normalizeResult(task, raw, { action: payload?.action })
    const parsed = schemas[task].safeParse(normalized)
    if (!parsed.success) {
      safeLog('error', 'Result validation failed', { task })
      throw new Error('Model returned invalid structured output')
    }
    safeLog('info', 'Replicate call succeeded', { task })
    return response({ result: parsed.data }, 200)
  } catch (error) {
    const errName = error instanceof Error ? error.name : 'UnknownError'
    const errMessage = error instanceof Error ? error.message : String(error)
    const code = /^Replicate/.test(errMessage) ? 'REPLICATE_ERROR' : errName === 'Error' ? 'AI_ERROR' : errName
    safeLog('error', 'AI request failed', { errorName: errName, errorMessage: errMessage })
    return response({ error: 'AI service is temporarily unavailable. Please try again.', code, reason: errMessage.slice(0, 160) }, 500)
  }
})

function response(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }) }