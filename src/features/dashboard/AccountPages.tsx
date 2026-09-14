import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Monitor, Moon, RefreshCw, Save, Sun, UserPlus, Users, ArrowRightLeft, LoaderCircle, CheckCircle2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, EmptyState, Input, useToast } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/theme'
import { Avatar, Section } from './Dashboard'
import { supabase } from '../../lib/supabase'

const profileSchema = z.object({ name: z.string().min(2, 'Name is too short.'), email: z.string().email() })
type ProfileFields = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFields>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name, email: user?.email } })
  if (!user) return <Navigate to="/login"/>

  const submit = async (values: ProfileFields) => {
    await new Promise((r) => setTimeout(r, 450))
    updateProfile(values.name)
    toast('Profile changes saved.')
  }

  return <Section eyebrow="Account" title="Personal profile" description="Manage your identity and contact details.">
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
        <Avatar name={user.name}/>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(submit)} className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="text-sm font-semibold">Full name<Input className="mt-2" {...register('name')}/>{errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name.message}</span>}</label>
        <label className="text-sm font-semibold">Email address<Input className="mt-2 opacity-60" readOnly {...register('email')}/></label>
        <label className="text-sm font-semibold">Account role<Input className="mt-2 opacity-60" readOnly value={user.role}/></label>
        <label className="text-sm font-semibold">Member ID<Input className="mt-2 opacity-60" readOnly value={user.id.slice(0, 13)}/></label>
        <div className="sm:col-span-2"><Button disabled={isSubmitting}><Save className="size-4"/>{isSubmitting ? 'Saving…' : 'Save changes'}</Button></div>
      </form>
    </div>
    <MarketplaceRoleCard/>
  </Section>
}

function MarketplaceRoleCard() {
  const { user, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const isSeller = user?.marketplaceRole === 'seller'

  const submitRequest = async () => {
    if (!supabase || !user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('role_requests').insert({
        user_id: user.id,
        from_role: user.marketplaceRole,
        requested_role: isSeller ? 'buyer' : 'seller',
        admin_notes: adminNotes || null,
      })
      if (error) throw error
      toast('Your role change request has been submitted. An admin will review it shortly.')
      setShowRequestModal(false)
      setAdminNotes('')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Request could not be submitted.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return <>
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Marketplace role</h3>
          <p className="mt-1 text-sm text-slate-500">Your current role determines what you can do on GharHub.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isSeller ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'}`}>
          {isSeller ? 'Seller / Owner' : 'Buyer / Renter'}
        </span>
      </div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400">
        {isSeller
          ? 'As a seller, you can create, edit, publish, and manage property listings. You can also browse and buy/rent properties.'
          : 'As a buyer/renter, you can browse, search, save, and contact sellers about properties. You cannot create listings.'}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setShowRequestModal(true)}>
          <ArrowRightLeft className="size-4"/>
          Request to switch to {isSeller ? 'Buyer/Renter' : 'Seller/Owner'}
        </Button>
        <Button variant="ghost" onClick={() => void refreshProfile()} title="Reload your profile from server">
          <RefreshCw className="size-4"/> Refresh profile
        </Button>
      </div>
    </div>

    {showRequestModal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Switch to {isSeller ? 'Buyer/Renter' : 'Seller/Owner'}?</h2>
          <button onClick={() => setShowRequestModal(false)} className="grid size-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4"/></button>
        </div>
        <p className="mt-3 text-sm text-slate-500">Your request will be sent to an admin for review. You'll receive a notification once it's approved or rejected.</p>
        <label className="mt-4 block text-sm font-semibold">Reason (optional)
          <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900" rows={3} placeholder="Why do you want to switch roles?"/>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowRequestModal(false)}>Cancel</Button>
          <Button onClick={() => void submitRequest()} disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin"/> : <ArrowRightLeft className="size-4"/>}
            Submit request
          </Button>
        </div>
      </div>
    </div>}
  </>
}

export function TeamPage() { const { toast } = useToast(); return <Section eyebrow="Collaboration" title="Your team" description="Invite and manage people in your workspace."><EmptyState icon={<Users/>} title="It's quiet in here" description="Your team will appear here once you invite your first collaborator."/><Button className="mx-auto mt-5 flex" onClick={() => toast('Invitation flow is ready for your first teammate.')}><UserPlus className="size-4"/>Invite teammate</Button></Section> }

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [digest, setDigest] = useState(true)
  return <Section eyebrow="Preferences" title="Workspace settings" description="Personalize your GharHub experience.">
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-slate-500">Choose how GharHub looks on this device.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {([{ id:'light', label:'Light', icon: Sun },{ id:'dark', label:'Dark', icon: Moon },{ id:'system', label:'System', icon: Monitor }] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTheme(id); toast(`${label} theme selected.`) }} className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition ${theme === id ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'border-slate-200 dark:border-slate-700'}`}>
              <Icon className="size-5"/>{label}
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block font-semibold">Weekly digest</span>
            <span className="text-sm text-slate-500">Receive a concise account summary every Monday.</span>
          </span>
          <button onClick={() => { setDigest(!digest); toast('Notification preference updated.') }} className={`relative h-7 w-12 rounded-full transition ${digest ? 'bg-teal-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-1 size-5 rounded-full bg-white transition ${digest ? 'left-6' : 'left-1'}`}/>
          </button>
        </label>
      </div>
    </div>
  </Section>
}
