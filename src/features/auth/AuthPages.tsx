import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Building2, Eye, EyeOff, Home, KeyRound, LoaderCircle, LockKeyhole, Mail, ShoppingBag } from 'lucide-react'
import { Button, Input, useToast } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { Seo } from '../../lib/seo'
import type { MarketplaceRole } from '../../lib/auth'

const loginSchema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(8, 'Use at least 8 characters.') })
const signupSchema = loginSchema.extend({ name: z.string().min(2, 'Enter your full name.'), terms: z.literal(true, { error: 'Please accept the terms.' }), marketplaceRole: z.enum(['buyer', 'seller'] as const) })
type LoginFields = z.infer<typeof loginSchema>
type SignupFields = z.infer<typeof signupSchema>

function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return <><Seo
    title={title}
    description={`${title} — GharHub property marketplace.`}
    robots="noindex, nofollow"
  /><main className="grid min-h-screen lg:grid-cols-[.55fr_.45fr]">
    <section className="relative hidden overflow-hidden bg-[#073b3a] p-12 text-white lg:flex lg:flex-col">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.06, 0.18, 0.06], x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-20 -top-20 size-96 rounded-full bg-teal-400/10 blur-3xl"/>
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.2, 0.08], x: [0, -20, 0], y: [0, 25, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute -left-20 bottom-10 size-80 rounded-full bg-teal-300/8 blur-3xl"/>
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute top-1/3 left-1/4 size-[500px] rounded-full border border-teal-500/5"/>
        <motion.div animate={{ rotate: [360, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute top-1/2 left-1/2 size-[300px] rounded-full border border-teal-400/5"/>
      </div>
      <Link to="/" className="relative flex items-center gap-2 font-display text-xl font-bold"><motion.span whileHover={{ rotate: -20, scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }} className="grid size-9 place-items-center rounded-xl bg-teal-400 text-teal-950"><Building2 className="size-5"/></motion.span>GharHub</Link>
      <div className="relative my-auto max-w-xl">
        <motion.p initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 80 }} className="mb-5 text-sm font-bold uppercase tracking-[.22em] text-teal-300">Property, thoughtfully managed</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.4, duration: 0.9, type: 'spring', stiffness: 60 }} className="font-display text-5xl font-semibold leading-[1.08]">The foundation for your next move.</motion.h2>
        <motion.p initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-6 max-w-md text-lg leading-8 text-teal-50/70">A secure, beautifully simple workspace for people building their property future.</motion.p>
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="relative text-sm text-teal-100/50">© 2026 GharHub, Inc. Built with care.</motion.p>
    </section>
    <section className="flex flex-col items-center justify-center bg-slate-50 px-5 py-12 dark:bg-slate-950">
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, type: 'spring', stiffness: 80 }} className="w-full max-w-sm">
        <div className="mb-8 text-center lg:hidden"><Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold"><span className="grid size-9 place-items-center rounded-xl bg-teal-600 text-white"><Building2 className="size-5"/></span>GharHub</Link></div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="font-display text-2xl font-semibold tracking-tight">{title}</motion.h1>
        <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="mt-2 text-sm text-slate-500">{subtitle}</motion.p>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="mt-8">{children}</motion.div>
      </motion.div>
    </section>
  </main></>
}

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [show, setShow] = useState(false)
  const from = (location.state as { from?: string })?.from ?? '/dashboard'
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) })
  if (user) return <Navigate to={from} replace />
  const submit = async (values: LoginFields) => {
    const result = await signIn(values.email, values.password)
    if (result.error) { setError('root', { message: result.error }); return }
    toast('Welcome back to GharHub.')
    navigate(from)
  }
  return <AuthShell title="Welcome back" subtitle="Enter your details to access your workspace.">
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}><Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')}/></Field></motion.div>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}><Field label="Password" error={errors.password?.message} extra={<Link to="/forgot-password" className="text-sm font-semibold text-teal-700 hover:underline">Forgot password?</Link>}>
        <div className="relative"><Input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" {...register('password')}/><button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShow(!show)} aria-label="Toggle password visibility">{show ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}</button></div>
      </Field></motion.div>
      {errors.root && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><ErrorBox message={errors.root.message}/></motion.div>}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button className="w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="size-4 animate-spin"/> : <>Sign in <ArrowRight className="size-4"/></>}</Button></motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center text-sm text-slate-500">New to GharHub? <Link to="/signup" className="font-semibold text-teal-700">Create an account</Link></motion.p>
    </form>
  </AuthShell>
}

export function SignupPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [show, setShow] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, watch } = useForm<SignupFields>({ resolver: zodResolver(signupSchema), defaultValues: { marketplaceRole: 'buyer' } })
  if (user) return <Navigate to="/dashboard" replace />
  const submit = async (values: SignupFields) => {
    const result = await signUp(values.name, values.email, values.password, values.marketplaceRole as MarketplaceRole)
    if (result.error) {
      if (result.error === '__EMAIL_CONFIRMATION__') { toast('Please check your email to confirm your account.'); navigate('/login'); return }
      setError('root', { message: result.error })
      return
    }
    toast('Your workspace is ready.')
    navigate('/dashboard')
  }
  const selectedRole = watch('marketplaceRole')
  return <AuthShell title="Create your account" subtitle="Set up your secure GharHub workspace.">
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}><Field label="Full name" error={errors.name?.message}><Input autoComplete="name" placeholder="Alex Morgan" {...register('name')}/></Field></motion.div>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}><Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" placeholder="you@company.com" {...register('email')}/></Field></motion.div>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}><Field label="Password" error={errors.password?.message}><div className="relative"><Input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" {...register('password')}/><button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShow(!show)} aria-label="Toggle password visibility">{show ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}</button></div></Field></motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">I want to</label>
        <div className="grid grid-cols-2 gap-3">
          <motion.label initial={{ opacity: 0, x: -30, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.7, type: 'spring', stiffness: 120 }} whileHover={{ scale: 1.05, y: -4, boxShadow: '0 15px 30px -8px rgba(20,184,166,0.2)' }} whileTap={{ scale: 0.95 }} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${selectedRole === 'buyer' ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/15 dark:bg-teal-950' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'}`}>
            <input type="radio" value="buyer" className="sr-only" {...register('marketplaceRole')}/>
            <motion.span animate={selectedRole === 'buyer' ? { scale: [1, 1.2, 1], rotate: [0, -10, 0] } : {}} transition={{ duration: 0.4 }} className={`grid size-10 place-items-center rounded-xl transition-colors duration-300 ${selectedRole === 'buyer' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}><Home className="size-5"/></motion.span>
            <div><span className="block text-sm font-semibold">Find a property</span><span className="block text-xs text-slate-500">Buy or rent a home</span></div>
          </motion.label>
          <motion.label initial={{ opacity: 0, x: 30, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.75, type: 'spring', stiffness: 120 }} whileHover={{ scale: 1.05, y: -4, boxShadow: '0 15px 30px -8px rgba(20,184,166,0.2)' }} whileTap={{ scale: 0.95 }} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${selectedRole === 'seller' ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/15 dark:bg-teal-950' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'}`}>
            <input type="radio" value="seller" className="sr-only" {...register('marketplaceRole')}/>
            <motion.span animate={selectedRole === 'seller' ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}} transition={{ duration: 0.4 }} className={`grid size-10 place-items-center rounded-xl transition-colors duration-300 ${selectedRole === 'seller' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}><ShoppingBag className="size-5"/></motion.span>
            <div><span className="block text-sm font-semibold">List a property</span><span className="block text-xs text-slate-500">Sell or rent your property</span></div>
          </motion.label>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}><label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" className="mt-1 accent-teal-600" {...register('terms')}/>I agree to the <Link to="/terms" className="font-semibold text-teal-700 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-teal-700 hover:underline">Privacy Policy</Link>.</label></motion.div>
      {errors.terms && <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-xs font-medium text-rose-600">{errors.terms.message}</motion.p>}
      {errors.root && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><ErrorBox message={errors.root.message}/></motion.div>}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button className="w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="size-4 animate-spin"/> : <>Create account <ArrowRight className="size-4"/></>}</Button></motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-teal-700">Sign in</Link></motion.p>
    </form>
  </AuthShell>
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await resetPassword(email)
    setLoading(false)
    if (result.error) { toast(result.error, 'error'); return }
    setSent(true)
  }

  return <AuthShell title="Reset your password" subtitle="Enter the email address associated with your account.">
    {sent ? <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="mx-auto grid size-16 place-items-center rounded-3xl bg-teal-50 text-teal-600 dark:bg-teal-950"><Mail className="size-7"/></motion.div><h2 className="font-display text-xl font-semibold">Check your email</h2><p className="mx-auto max-w-sm text-sm text-slate-500">We sent a password reset link to <strong>{email}</strong>. Follow the link to set a new password. The link expires in 1 hour.</p><p className="text-xs text-slate-400">Didn't receive it? Check your spam folder or <button onClick={() => setSent(false)} className="font-semibold text-teal-700 hover:underline">try another email</button>.</p></motion.div> : <form onSubmit={submit} className="space-y-5"><p className="text-sm text-slate-500">We'll send a reset link you can use to create a new password.</p><motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}><Field label="Email address" error={undefined}><Input type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required/></Field></motion.div><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button className="w-full" disabled={loading || !email}>{loading ? <LoaderCircle className="size-4 animate-spin"/> : <>Send reset link <ArrowRight className="size-4"/></>}</Button></motion.div><p className="text-center text-sm text-slate-500"><Link to="/login" className="font-semibold text-teal-700 hover:underline">Back to sign in</Link></p></form>}
  </AuthShell>
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const result = await updatePassword(password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setPassword(''); setConfirm('')
    setDone(true)
    toast('Your password has been updated.')
  }

  return <AuthShell title="Set new password" subtitle="Choose a strong password for your account.">
    {done ? <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="mx-auto grid size-16 place-items-center rounded-3xl bg-teal-50 text-teal-600 dark:bg-teal-950"><LockKeyhole className="size-7"/></motion.div><h2 className="font-display text-xl font-semibold">Password updated</h2><p className="mx-auto max-w-sm text-sm text-slate-500">Your password has been changed successfully. You can now sign in with your new password.</p><Button className="mx-auto" onClick={() => navigate('/login')}>Continue to sign in <ArrowRight className="size-4"/></Button></motion.div> : <form onSubmit={submit} className="space-y-5">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}><Field label="New password" error={undefined}><div className="relative"><Input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)}/><button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShow(!show)} aria-label="Toggle password visibility">{show ? <EyeOff className="size-5"/> : <Eye className="size-5"/>}</button></div></Field></motion.div>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}><Field label="Confirm password" error={undefined}><Input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)}/></Field></motion.div>
      {error && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><ErrorBox message={error}/></motion.div>}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button className="w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin"/> : <>Update password <ArrowRight className="size-4"/></>}</Button></motion.div>
      <p className="text-center text-sm text-slate-500"><Link to="/login" className="font-semibold text-teal-700 hover:underline">Back to sign in</Link></p>
    </form>}
  </AuthShell>
}

function Field({ label, error, extra, children }: { label: string; error?: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300"><span>{label}</span>{extra}</span>{children}{error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}</label>
}
function ErrorBox({ message }: { message?: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><LockKeyhole className="size-4"/>{message}</div>
}
