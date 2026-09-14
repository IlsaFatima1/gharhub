import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { FileText, IndianRupee, ListChecks, LoaderCircle, Sparkles, Type, Wand2 } from 'lucide-react'
import { Button, Input, useToast } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { KARACHI_AREAS, KARACHI_CITY } from '../../lib/karachi'
import { aiService } from './ai-service'
import type { EstimatedPrice, StudioAction, StudioContext } from './types'
import type { PropertyFormValues } from '../properties/schema'

const textareaClass = 'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

const actions: { key: StudioAction; label: string; icon: typeof Type }[] = [
  { key: 'title', label: 'Title', icon: Type },
  { key: 'description', label: 'Description', icon: FileText },
  { key: 'highlights', label: 'Highlights', icon: ListChecks },
  { key: 'price', label: 'Estimate', icon: IndianRupee },
  { key: 'improve', label: 'Improve', icon: Wand2 },
]

export function AIStudioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [facts, setFacts] = useState<StudioContext>({
    propertyType: 'house',
    customPropertyType: '',
    purpose: 'sale',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    city: KARACHI_CITY,
    area: 'DHA',
    address: '',
    price: 0,
    description: '',
    details: '',
  })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [highlights, setHighlights] = useState<string[]>([])
  const [estimate, setEstimate] = useState<EstimatedPrice | null>(null)
  const [busy, setBusy] = useState<StudioAction | null>(null)

  if (user?.marketplaceRole !== 'seller') return <Navigate to="/dashboard" replace />

  const set = <K extends keyof StudioContext>(key: K, value: StudioContext[K]) => setFacts((c) => ({ ...c, [key]: value }))

  const run = async (action: StudioAction) => {
    setBusy(action)
    try {
      const result = await aiService.studio(action, facts)
      if (action === 'title' && result.title) setTitle(result.title)
      if (action === 'description' && result.description) setDescription(result.description)
      if (action === 'improve') {
        if (result.title) setTitle(result.title)
        if (result.description) setDescription(result.description)
      }
      if (action === 'highlights' && result.highlights) setHighlights(result.highlights)
      if (action === 'price' && result.estimatedPrice) setEstimate(result.estimatedPrice)
      toast('AI output ready. Review it before using it in your listing.')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'AI request could not be completed.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const apply = () => {
    const prefill: Partial<PropertyFormValues> = {
      purpose: facts.purpose,
      propertyType: facts.propertyType as PropertyFormValues['propertyType'],
      customPropertyType: facts.customPropertyType ?? '',
      city: KARACHI_CITY,
      area: facts.area as PropertyFormValues['area'],
      bedrooms: facts.bedrooms,
      bathrooms: facts.bathrooms,
      squareFeet: facts.squareFeet,
    }
    if (title) prefill.title = title
    if (description) prefill.description = description
    if (facts.price) prefill.price = facts.price
    if (facts.address) prefill.address = facts.address
    navigate('/dashboard/properties/new', { state: { studioPrefill: prefill } })
  }

  return (
    <div className="mx-auto max-w-6xl">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700"><Sparkles className="size-4"/>GharHub intelligence</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">AI listing studio</h1>
      <p className="mt-2 text-slate-500">Build accurate listing content and comparable-based price guidance for your next property.</p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold">Property facts</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs font-bold">Purpose
              <select className="admin-select mt-2 block w-full max-w-none" value={facts.purpose} onChange={(e) => set('purpose', e.target.value as 'sale' | 'rent')}>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </select>
            </label>
            <label className="text-xs font-bold">Property type
              <select className="admin-select mt-2 block w-full max-w-none" value={facts.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                {['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial', 'shop', 'office', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          {facts.propertyType === 'other' && <label className="block text-xs font-bold">Specify type
            <Input className="mt-2" value={facts.customPropertyType ?? ''} onChange={(e) => set('customPropertyType', e.target.value)} placeholder="e.g. Showroom, Warehouse, Building"/>
          </label>}
          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs font-bold">Bedrooms
              <Input className="mt-2" type="number" min="0" value={facts.bedrooms} onChange={(e) => set('bedrooms', Number(e.target.value))}/>
            </label>
            <label className="text-xs font-bold">Bathrooms
              <Input className="mt-2" type="number" min="0" value={facts.bathrooms} onChange={(e) => set('bathrooms', Number(e.target.value))}/>
            </label>
            <label className="text-xs font-bold">Square feet
              <Input className="mt-2" type="number" min="0" value={facts.squareFeet} onChange={(e) => set('squareFeet', Number(e.target.value))}/>
            </label>
            <label className="text-xs font-bold">Asking price (PKR)
              <Input className="mt-2" type="number" min="0" value={facts.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="e.g. 8500000"/>
            </label>
          </div>
          <label className="block text-xs font-bold">Area
            <select className="admin-select mt-2 block w-full max-w-none" value={facts.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">Any area</option>
              {KARACHI_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold">Address
            <Input className="mt-2" value={facts.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Street, phase/block, area, Karachi"/>
          </label>
          <label className="block text-xs font-bold">Existing description <span className="font-normal text-slate-400">(optional — used by Improve)</span>
            <textarea rows={4} className={`${textareaClass} mt-2`} value={facts.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Paste your current draft so AI can polish the wording."/>
          </label>
          <label className="block text-xs font-bold">Extra facts <span className="font-normal text-slate-400">(optional)</span>
            <textarea rows={3} className={`${textareaClass} mt-2`} value={facts.details ?? ''} onChange={(e) => set('details', e.target.value)} placeholder="Verified details like orientation, floor number, ownership status, condition…"/>
          </label>
          <p className="text-[11px] leading-5 text-slate-400">AI uses only these facts. It never invents location, size, amenities, condition, ownership, or market value.</p>
        </section>

        <section className="space-y-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-white to-teal-50 p-5 dark:border-teal-900 dark:from-slate-900 dark:to-teal-950/40">
          <div className="flex flex-wrap gap-2">
            {actions.map(({ key, label, icon: Icon }) => (
              <Button key={key} type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => void run(key)}>
                {busy === key ? <LoaderCircle className="size-4 animate-spin"/> : <Icon className="size-4"/>}{label}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">{busy ? `Generating… this usually takes 15-30 seconds.` : 'Pick an action above. Only the chosen action is generated — everything else stays untouched.'}</p>

          <div>
            <div className="flex items-center justify-between gap-2"><label className="text-sm font-bold">Listing title</label><span className="text-[11px] text-slate-400">{title.length}/100</span></div>
            <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="AI-generated title appears here…"/>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2"><label className="text-sm font-bold">Description</label><span className="text-[11px] text-slate-400">{description.length}/3000</span></div>
            <textarea rows={8} className={`${textareaClass} mt-2`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="AI-generated, fact-grounded description…"/>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2"><label className="text-sm font-bold">Key highlights</label><span className="text-[11px] text-slate-400">{highlights.length} highlight{highlights.length === 1 ? '' : 's'} — one per line</span></div>
            <textarea rows={5} className={`${textareaClass} mt-2`} value={highlights.join('\n')} onChange={(e) => setHighlights(e.target.value.split('\n'))} placeholder="AI-generated highlights appear here…"/>
          </div>

          {estimate && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Estimated price range (AI estimate only)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">{estimate.currency || 'PKR'} {estimate.min.toLocaleString()} – {estimate.max.toLocaleString()}</p>
              {estimate.note && <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/70">{estimate.note}</p>}
              <Button className="mt-3" type="button" variant="secondary" onClick={() => { setFacts((c) => ({ ...c, price: Math.round((estimate.min + estimate.max) / 2) })); toast(`Asking price set to PKR ${Math.round((estimate.min + estimate.max) / 2).toLocaleString()}.`); }}>
                <IndianRupee className="size-4"/>Use mid-range as asking price
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-900/60">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Ready to build the listing?</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Nothing is published automatically. This previews the property form with your reviewed content — add photos, a map pin, and seller contact before publishing.</p>
            </div>
            <Button onClick={apply}>Apply to property form</Button>
          </div>
        </section>
      </div>
    </div>
  )
}