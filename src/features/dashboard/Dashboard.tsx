import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Building2, ChevronDown, CircleHelp, Compass, Heart, Home, House, HousePlus, LayoutDashboard, LogOut, Menu, Moon, Settings, Sparkles, Sun, UserRound, Users, Wand2, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useTheme } from '../../lib/theme'
import { Seo } from '../../lib/seo'
import { Button, Skeleton, useToast } from '../../components/ui'

const sellerNav = [{ label: 'Overview', path: '/dashboard', icon: Home }, { label: 'My Properties', path: '/dashboard/properties', icon: House }, { label: 'AI Studio', path: '/dashboard/ai-studio', icon: Wand2 }, { label: 'AI Matches', path: '/dashboard/ai-recommendations', icon: Sparkles }, { label: 'Team', path: '/dashboard/team', icon: Users }, { label: 'Notifications', path: '/dashboard/notifications', icon: Bell }, { label: 'Profile', path: '/dashboard/profile', icon: UserRound }, { label: 'Settings', path: '/dashboard/settings', icon: Settings }]
const buyerNav = [{ label: 'Overview', path: '/dashboard', icon: Home }, { label: 'Discover', path: '/dashboard/search', icon: Compass }, { label: 'Favorites', path: '/dashboard/favorites', icon: Heart }, { label: 'AI Matches', path: '/dashboard/ai-recommendations', icon: Sparkles }, { label: 'Notifications', path: '/dashboard/notifications', icon: Bell }, { label: 'Profile', path: '/dashboard/profile', icon: UserRound }, { label: 'Settings', path: '/dashboard/settings', icon: Settings }]

export function ProtectedLayout() {
  const { user, loading, signOut } = useAuth(); const { isDark, setTheme } = useTheme(); const navigate = useNavigate(); const location = useLocation(); const { toast } = useToast(); const [menu, setMenu] = useState(false); const [profile, setProfile] = useState(false)
  const isSeller = user?.marketplaceRole === 'seller'
  const isAdmin = user?.role === 'Admin'
  const nav = isAdmin ? [{ label: 'Admin control', path: '/dashboard/admin', icon: LayoutDashboard }, ...sellerNav] : isSeller ? sellerNav : buyerNav
  useEffect(() => setMenu(false), [location.pathname])
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950"><motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3 text-center"><motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-600 text-white"><Building2/></motion.div><p className="text-sm font-medium text-slate-500">Preparing your workspace…</p></motion.div></div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  const logout = () => { signOut(); toast('You have been signed out.'); navigate('/login') }
  return <><Seo
    title="GharHub Workspace"
    description="Your GharHub property marketplace workspace."
    robots="noindex, nofollow"
  /><div className="min-h-screen bg-[#f6f8f7] text-slate-900 dark:bg-slate-950 dark:text-slate-100"><aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-14 items-center justify-between px-2"><div className="flex items-center gap-2 font-display text-xl font-bold"><motion.span whileHover={{ rotate: -15, scale: 1.1 }} className="grid size-9 place-items-center rounded-xl bg-teal-600 text-white cursor-pointer"><Building2 className="size-5"/></motion.span>GharHub</div><button className="lg:hidden" onClick={() => setMenu(false)} aria-label="Close navigation"><X/></button></div><nav className="mt-7 space-y-1">{nav.map(({ label, path, icon: Icon }, i) => <motion.div key={path} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}><NavLink to={path} end={path === '/dashboard'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${isActive ? 'bg-teal-50 text-teal-800 shadow-sm dark:bg-teal-950 dark:text-teal-300' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'}`}><Icon className="size-[18px]"/>{label}</NavLink></motion.div>)}</nav><div className="mt-auto rounded-2xl bg-[#073b3a] p-4 text-white"><CircleHelp className="size-5 text-teal-300"/><p className="mt-3 text-sm font-semibold">Need a hand?</p><p className="mt-1 text-xs leading-5 text-teal-50/65">Our support team is here when you need us.</p><button onClick={() => toast('A support conversation has been opened.')} className="mt-3 text-xs font-bold text-teal-300 hover:text-white transition-colors">Contact support →</button></div></aside>{menu && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMenu(false)} aria-label="Close menu"/>}<div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-7"><button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu className="size-5"/></button><div className="flex-1"/><div className="flex items-center gap-3"><button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{isDark ? <Sun className="size-[18px]"/> : <Moon className="size-[18px]"/>}</button><div className="relative"><button onClick={() => setProfile(!profile)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><span className="grid size-8 place-items-center rounded-lg bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-200">{user.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</span><ChevronDown className="size-4 text-slate-400"/></button><AnimatePresence>{profile && <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></div><div className="p-2"><NavLink to="/dashboard/profile" onClick={() => setProfile(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><UserRound className="size-4"/>Profile</NavLink><NavLink to="/dashboard/settings" onClick={() => setProfile(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><Settings className="size-4"/>Settings</NavLink><button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"><LogOut className="size-4"/>Sign out</button></div></motion.div>}</AnimatePresence></div></div></header><main className="p-4 sm:p-7"><Outlet/></main></div></div></>
}

export function DashboardHome() {
  const { user } = useAuth(); const [loading, setLoading] = useState(true)
  const isSeller = user?.marketplaceRole === 'seller'
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 700); return () => clearTimeout(timer) }, [])
  if (loading) return <div><Skeleton className="h-9 w-64"/><Skeleton className="mt-3 h-5 w-80"/><div className="mt-8 grid gap-4 md:grid-cols-3">{[1,2,3].map((n) => <Skeleton key={n} className="h-36"/>)}</div><Skeleton className="mt-6 h-72"/></div>
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name.split(' ')[0] ?? 'there'
  return <div className="mx-auto max-w-6xl">
    <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <p className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Workspace</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}, {firstName}.</h1>
      <p className="mt-2 text-slate-500">Here's an overview of your GharHub account.</p>
    </motion.div>

    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <Stat label="Account status" value="Verified" detail="Identity confirmed" tone="teal" delay={0.1}/>
      <Stat label="Profile strength" value="80%" detail="One step remaining" tone="orange" delay={0.2}/>
      <Stat label="Member since" value={new Date(user?.joinedAt ?? '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} detail="GharHub member" tone="slate" delay={0.3}/>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {!isSeller && <QuickAction icon={Compass} label="Discover properties" desc="Search verified listings across Karachi" path="/dashboard/search" color="teal" delay={0.15}/>}
      <QuickAction icon={Sparkles} label="AI Matches" desc="Find properties matching your preferences" path="/dashboard/ai-recommendations" color="violet" delay={0.25}/>
      {isSeller && <QuickAction icon={HousePlus} label="Add property" desc="Create a new listing for sale or rent" path="/dashboard/properties/new" color="teal" delay={0.25}/>}
    </div>

    <motion.section initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-display text-xl font-semibold">Your workspace is ready</h2><p className="mt-1 text-sm text-slate-500">Complete these foundation steps before you get started.</p></div>
        <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">2 of 3 complete</motion.span>
      </div>
      <div className="mt-7 space-y-3"><Checklist done title="Create your secure account"/><Checklist done title="Verify your email address"/><Checklist title="Complete your personal profile"/></div>
    </motion.section>
  </div>
}

function Stat({ label, value, detail, tone, delay = 0 }: { label: string; value: string; detail: string; tone: 'teal'|'orange'|'slate'; delay?: number }) {
  const color = { teal: 'bg-teal-500', orange: 'bg-orange-400', slate: 'bg-slate-400' }[tone]
  const glow = { teal: 'shadow-teal-200 dark:shadow-teal-900', orange: 'shadow-orange-200 dark:shadow-orange-900', slate: 'shadow-slate-200 dark:shadow-slate-900' }[tone]
  return <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay, duration: 0.5, type: 'spring', stiffness: 150 }} whileHover={{ y: -8, scale: 1.03, boxShadow: `0 20px 40px -12px ${tone === 'teal' ? 'rgba(20,184,166,0.15)' : tone === 'orange' ? 'rgba(249,115,22,0.15)' : 'rgba(148,163,184,0.15)'}` }} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 cursor-default">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400"><motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay }} className={`size-2 rounded-full ${color}`}/>{label}</div>
    <p className="mt-4 font-display text-2xl font-semibold">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{detail}</p>
  </motion.div>
}

function QuickAction({ icon: Icon, label, desc, path, color, delay = 0 }: { icon: typeof Compass; label: string; desc: string; path: string; color: 'teal'|'violet'|'blue'; delay?: number }) {
  const colorMap = {
    teal: { bg: 'bg-teal-50 dark:bg-teal-950', icon: 'text-teal-600 dark:text-teal-400', hover: 'group-hover:bg-teal-600 group-hover:text-white', glow: 'rgba(20,184,166,0.2)' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950', icon: 'text-violet-600 dark:text-violet-400', hover: 'group-hover:bg-violet-600 group-hover:text-white', glow: 'rgba(139,92,246,0.2)' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950', icon: 'text-blue-600 dark:text-blue-400', hover: 'group-hover:bg-blue-600 group-hover:text-white', glow: 'rgba(59,130,246,0.2)' },
  }[color]
  return <motion.a href={path} initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay, duration: 0.5, type: 'spring', stiffness: 120 }} whileHover={{ y: -10, scale: 1.03, boxShadow: `0 25px 50px -12px ${colorMap.glow}` }} whileTap={{ scale: 0.97 }} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
    <motion.div whileHover={{ rotate: -15, scale: 1.15 }} transition={{ type: 'spring', stiffness: 300 }} className={`mb-3 grid size-10 place-items-center rounded-xl transition-colors duration-300 ${colorMap.bg} ${colorMap.icon} ${colorMap.hover}`}><Icon className="size-5"/></motion.div>
    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">{label}</h3>
    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
    <motion.div className="mt-3 overflow-hidden"><ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-teal-600"/></motion.div>
  </motion.a>
}

function Checklist({ done, title }: { done?: boolean; title: string }) {
  return <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 6, backgroundColor: 'rgba(248,250,252,1)' }} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
    <motion.span initial={done ? { scale: 0 } : {}} animate={done ? { scale: 1 } : {}} transition={{ type: 'spring', stiffness: 300, delay: 0.5 }} className={`grid size-6 place-items-center rounded-full text-xs font-bold ${done ? 'bg-teal-600 text-white' : 'border-2 border-slate-300 text-transparent'}`}>✓</motion.span>
    <span className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : ''}`}>{title}</span>
  </motion.div>
}
export function Avatar({ name }: { name: string }) { return <span className="grid size-9 place-items-center rounded-xl bg-teal-100 text-xs font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-200">{name.split(' ').map((x) => x[0]).slice(0,2).join('').toUpperCase()}</span> }
export function Section({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) { return <div className="mx-auto max-w-4xl"><p className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">{eyebrow}</p><h1 className="mt-2 font-display text-3xl font-semibold">{title}</h1><p className="mt-2 text-slate-500">{description}</p><div className="mt-8">{children}</div></div> }
