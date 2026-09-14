import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Building2, CheckCircle2, ChevronRight, Eye, Globe, Home, KeyRound, MapPin, Search, Shield, Sparkles, Star, X, ArrowRight } from 'lucide-react'
import { Seo } from '../../lib/seo'
import { SITE_DEFAULT_DESCRIPTION, SITE_DEFAULT_TITLE, SITE_NAME, SITE_URL } from '../../lib/site'

const features = [
  { icon: Search, title: 'Smart Discovery', desc: 'AI-powered search that understands what you need. Find properties by area, budget, size, and lifestyle preferences.' },
  { icon: Shield, title: 'Verified Listings', desc: 'Every property is reviewed and verified. No fake listings, no spam — only genuine opportunities.' },
  { icon: MapPin, title: 'Exact Locations', desc: 'See precisely where each property is located in Karachi with interactive map views.' },
  { icon: Sparkles, title: 'AI Assistant', desc: 'Chat with our AI to discover properties, compare options, and get market insights instantly.' },
  { icon: KeyRound, title: 'Direct Contact', desc: 'Connect directly with property owners through WhatsApp for instant communication.' },
  { icon: Globe, title: 'Marketplace Access', desc: 'Browse sale and rent listings across all of Karachi with real-time availability.' },
]

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up in seconds with your email. Your workspace is ready immediately.' },
  { num: '02', title: 'Discover properties', desc: 'Use smart search or ask our AI assistant to find exactly what you need.' },
  { num: '03', title: 'Connect & transact', desc: 'Contact owners directly via WhatsApp, schedule viewings, and move forward with confidence.' },
]

const stats = [
  { value: '500+', label: 'Verified Properties' },
  { value: '2K+', label: 'Active Users' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'AI Support' },
]

export function LandingPage() {
  return <div className="min-h-screen bg-white dark:bg-slate-950">
    <Seo
      title={SITE_DEFAULT_TITLE}
      description={SITE_DEFAULT_DESCRIPTION}
      canonicalPath="/"
      robots="index, follow"
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/discover?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.svg`,
        },
      ]}
    />
    <LandingNav />
    <HeroSection />
    <StatsSection />
    <FeaturesSection />
    <HowItWorksSection />
    <CTASection />
    <Footer />
    <CookieConsent />
  </div>
}

function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, type: 'spring', stiffness: 80, damping: 15 }} className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><motion.span whileHover={{ rotate: -20, scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }} className="grid size-8 place-items-center rounded-xl bg-teal-600 text-white"><Building2 className="size-4"/></motion.span>GharHub</Link>
      <div className="hidden items-center gap-8 md:flex">
        <motion.a href="#features" whileHover={{ y: -2 }} className="text-sm font-medium text-slate-600 transition hover:text-teal-700 dark:text-slate-400">Features</motion.a>
        <motion.a href="#how-it-works" whileHover={{ y: -2 }} className="text-sm font-medium text-slate-600 transition hover:text-teal-700 dark:text-slate-400">How it works</motion.a>
        <Link to="/login" className="text-sm font-medium text-slate-600 transition hover:text-teal-700 dark:text-slate-400">Sign in</Link>
        <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}><Link to="/signup" className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/25">Get started</Link></motion.div>
      </div>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="grid size-10 place-items-center rounded-xl hover:bg-slate-100 md:hidden dark:hover:bg-slate-800">
        <div className="space-y-1.5"><span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 dark:bg-slate-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`}/><span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 dark:bg-slate-300 ${mobileOpen ? 'opacity-0' : ''}`}/><span className={`block h-0.5 w-5 bg-slate-700 transition-all duration-300 dark:bg-slate-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`}/></div>
      </button>
    </div>
    <AnimatePresence>{mobileOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden border-t border-slate-200 dark:border-slate-800 md:hidden"><div className="space-y-1 px-5 py-4"><motion.a href="#features" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 }} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400">Features</motion.a><motion.a href="#how-it-works" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400">How it works</motion.a><motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}><Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400">Sign in</Link></motion.div><motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}><Link to="/signup" onClick={() => setMobileOpen(false)} className="block rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white">Get started</Link></motion.div></div></motion.div>}</AnimatePresence>
  </motion.nav>
}

function HeroSection() {
  return <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-white to-white pt-32 pb-20 dark:from-teal-950/30 dark:via-slate-950 dark:to-slate-950">
    <div className="absolute inset-0 overflow-hidden">
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15], x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-40 -right-40 size-[600px] rounded-full bg-teal-200/25 blur-3xl dark:bg-teal-800/15"/>
      <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.35, 0.2], x: [0, -25, 0], y: [0, 25, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} className="absolute -bottom-40 -left-40 size-[600px] rounded-full bg-teal-100/35 blur-3xl dark:bg-teal-900/15"/>
      <motion.div animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full border border-teal-200/10 dark:border-teal-800/5"/>
    </div>
    <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div initial="hidden" animate="visible">
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, type: 'spring', stiffness: 100 }} className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-xs font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300"><motion.span animate={{ rotate: [0, 25, -25, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}><Sparkles className="size-3.5"/></motion.span>Powered by AI</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.1, type: 'spring', stiffness: 80 }} className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">The modern way to find your <motion.span animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ backgroundSize: '200% auto' }} className="bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-teal-300 dark:to-teal-400">next property</motion.span></motion.h1>
          <motion.p initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-400">GharHub brings verified Karachi properties, AI-powered search, and direct owner contact into one beautifully simple workspace.</motion.p>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.08, y: -4 }} whileTap={{ scale: 0.95 }}><Link to="/discover" className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30">Browse properties <ArrowRight className="size-4"/></Link></motion.div>
            <motion.div whileHover={{ scale: 1.08, y: -4 }} whileTap={{ scale: 0.95 }}><Link to="/signup" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Get started free</Link></motion.div>
            <motion.div whileHover={{ scale: 1.08, y: -4 }} whileTap={{ scale: 0.95 }}><a href="#how-it-works" className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-teal-700 underline-offset-4 hover:underline">See how it works</a></motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            {[{ icon: CheckCircle2, text: 'Free to use' }, { icon: CheckCircle2, text: 'No credit card' }, { icon: CheckCircle2, text: 'Verified listings' }].map((item, i) => (
              <motion.span key={item.text} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} whileHover={{ scale: 1.1, y: -3 }} className="flex items-center gap-1.5"><item.icon className="size-4 text-teal-500"/>{item.text}</motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 80, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, duration: 1, type: 'spring', stiffness: 60, damping: 15 }} className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex gap-1.5"><motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="size-3 rounded-full bg-red-400"/><span className="size-3 rounded-full bg-yellow-400"/><span className="size-3 rounded-full bg-green-400"/></div><div className="ml-4 flex-1 rounded-lg bg-white px-3 py-1 text-xs text-slate-400 dark:bg-slate-800">gharhub.site/dashboard</div></div>
        <div className="aspect-[16/9] bg-gradient-to-br from-teal-50 via-slate-50 to-slate-100 p-8 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-900">
          <motion.div initial="hidden" animate="visible" className="grid h-full grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, x: -40, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.7, duration: 0.6, type: 'spring' }} className="col-span-1 space-y-3"><div className="h-6 w-24 rounded-lg bg-teal-200/60 dark:bg-teal-800/40"/><motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity }} className="h-32 rounded-2xl bg-white shadow-sm dark:bg-slate-800"/><div className="h-20 rounded-2xl bg-white shadow-sm dark:bg-slate-800"/></motion.div>
            <motion.div initial={{ opacity: 0, x: 40, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.8, duration: 0.6, type: 'spring' }} className="col-span-2 space-y-3"><div className="flex gap-2"><div className="h-8 w-32 rounded-lg bg-teal-600"/><div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700"/><div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700"/></div><div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map(i => <motion.div key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.1, type: 'spring' }} whileHover={{ scale: 1.05, y: -4 }} className="h-40 rounded-2xl bg-white shadow-sm dark:bg-slate-800"/>)}</div></motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
}

function StatsSection() {
  return <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-900/50">
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 sm:px-8 md:grid-cols-4">{stats.map((s, i) => <motion.div key={s.label} initial={{ opacity: 0, y: 40, scale: 0.8 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12, type: 'spring', stiffness: 100 }} whileHover={{ scale: 1.1, y: -8 }} className="text-center cursor-default"><motion.p animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }} className="font-display text-3xl font-bold text-teal-600 dark:text-teal-400">{s.value}</motion.p><p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p></motion.div>)}</div>
  </section>
}

function FeaturesSection() {
  return <section id="features" className="py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, type: 'spring' }} className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Features</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Everything you need to find the perfect property</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Built for people who want a simple, trustworthy way to discover and connect with properties in Karachi.</p>
      </motion.div>
      <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">{features.map((f, i) => <motion.div key={f.title} initial={{ opacity: 0, y: 50, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }} whileHover={{ y: -12, scale: 1.03, boxShadow: '0 25px 50px -12px rgba(20,184,166,0.15)' }} className="group cursor-default rounded-3xl border border-slate-200 bg-white p-7 transition-shadow hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"><motion.div whileHover={{ rotate: -15, scale: 1.2 }} transition={{ type: 'spring', stiffness: 300 }} className="mb-5 grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white dark:bg-teal-950"><f.icon className="size-6"/></motion.div><h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{f.desc}</p></motion.div>)}</div>
    </div>
  </section>
}

function HowItWorksSection() {
  return <section id="how-it-works" className="bg-slate-50 py-24 dark:bg-slate-900/50">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, type: 'spring' }} className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">How it works</p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Three steps to your next property</h2>
      </motion.div>
      <div className="mx-auto mt-16 grid max-w-4xl gap-12 md:grid-cols-3">{steps.map((s, i) => <motion.div key={s.num} initial={{ opacity: 0, y: 50, scale: 0.85 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15, type: 'spring', stiffness: 80 }} whileHover={{ y: -8 }} className="relative text-center"><motion.div whileHover={{ scale: 1.15, rotate: -8, boxShadow: '0 20px 40px -10px rgba(20,184,166,0.3)' }} transition={{ type: 'spring', stiffness: 300 }} className="mx-auto mb-6 grid size-14 place-items-center rounded-3xl bg-teal-600 font-display text-xl font-bold text-white shadow-lg shadow-teal-600/25">{s.num}</motion.div>{i < 2 && <div className="absolute left-[60%] top-7 hidden h-px w-[80%] bg-gradient-to-r from-teal-200 to-transparent dark:from-teal-800 md:block"/>}<h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{s.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{s.desc}</p></motion.div>)}</div>
    </div>
  </section>
}

function CTASection() {
  return <section className="py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, type: 'spring', stiffness: 80 }} className="relative overflow-hidden rounded-3xl bg-[#073b3a] p-12 text-center sm:p-16">
        <div className="absolute inset-0 overflow-hidden"><motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-20 -top-20 size-80 rounded-full bg-teal-500/10 blur-3xl"/><motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute -left-20 -bottom-20 size-80 rounded-full bg-teal-400/10 blur-3xl"/></div>
        <div className="relative">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready to find your next property?</h2>
          <p className="mx-auto mt-4 max-w-lg text-teal-100/70">Join thousands of people using GharHub to discover verified properties across Karachi.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.08, y: -4 }} whileTap={{ scale: 0.95 }}><Link to="/signup" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-teal-900 transition-all hover:bg-teal-50 hover:shadow-lg">Create free account <ArrowRight className="size-4"/></Link></motion.div>
            <motion.div whileHover={{ scale: 1.08, y: -4 }} whileTap={{ scale: 0.95 }}><Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-teal-500/30 px-8 py-3.5 text-sm font-bold text-teal-300 transition-all hover:bg-teal-500/10">Sign in</Link></motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
}

function Footer() {
  return <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><span className="grid size-8 place-items-center rounded-xl bg-teal-600 text-white"><Building2 className="size-4"/></span>GharHub</Link><p className="mt-4 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">The modern property marketplace for Karachi. Discover, connect, and transact with confidence.</p></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}><h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Product</h4><ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400"><li><a href="#features" className="transition hover:text-teal-700">Features</a></li><li><a href="#how-it-works" className="transition hover:text-teal-700">How it works</a></li><li><Link to="/signup" className="transition hover:text-teal-700">Get started</Link></li></ul></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}><h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Marketplace</h4><ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400"><li><Link to="/discover" className="transition hover:text-teal-700">Discover properties</Link></li><li><Link to="/buy" className="transition hover:text-teal-700">Properties for sale</Link></li><li><Link to="/rent" className="transition hover:text-teal-700">Properties for rent</Link></li><li><Link to="/privacy" className="transition hover:text-teal-700">Privacy Policy</Link></li><li><Link to="/terms" className="transition hover:text-teal-700">Terms of Service</Link></li></ul></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}><h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Legal</h4><ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400"><li><Link to="/privacy" className="transition hover:text-teal-700">Privacy Policy</Link></li><li><Link to="/terms" className="transition hover:text-teal-700">Terms of Service</Link></li></ul></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}><h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Account</h4><ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400"><li><Link to="/login" className="transition hover:text-teal-700">Sign in</Link></li><li><Link to="/signup" className="transition hover:text-teal-700">Create account</Link></li></ul></motion.div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-400 dark:border-slate-800"><p>© 2026 GharHub, Inc. Built with care.</p><div className="flex gap-4"><Link to="/privacy" className="transition hover:text-teal-600">Privacy</Link><Link to="/terms" className="transition hover:text-teal-600">Terms</Link></div></div>
    </div>
  </footer>
}

function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('haven-cookie-consent'))
  const accept = () => { localStorage.setItem('haven-cookie-consent', 'accepted'); setVisible(false) }
  return <AnimatePresence>{visible && <motion.div initial={{ y: 200, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 200, opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:flex sm:items-center sm:gap-5"><div className="flex-1"><p className="text-sm font-semibold text-slate-900 dark:text-white">We use cookies</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">We use essential cookies to make GharHub work. We'd also like your consent to use analytics cookies to improve your experience. By continuing to use GharHub, you agree to our <Link to="/privacy" className="font-semibold text-teal-600 hover:underline">Privacy Policy</Link>.</p></div><div className="mt-4 flex gap-2 sm:mt-0"><motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={accept} className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-700">Accept</motion.button><motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => { localStorage.setItem('haven-cookie-consent', 'dismissed'); setVisible(false) }} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">Dismiss</motion.button></div></div></motion.div>}</AnimatePresence>
}
