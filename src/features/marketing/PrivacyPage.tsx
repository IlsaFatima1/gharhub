import { Link } from 'react-router-dom'
import { Building2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Seo } from '../../lib/seo'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Seo
        title="Privacy Policy"
        description="Learn how GharHub collects, uses, and protects your personal information when you use our property marketplace."
        canonicalPath="/privacy"
      />
      <nav className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid size-8 place-items-center rounded-xl bg-teal-600 text-white">
              <Building2 className="size-4"/>
            </span>
            GharHub
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700 dark:text-slate-400">
            <ArrowLeft className="size-4"/>
            Back to home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Last updated: January 2026</p>
          
          <div className="mt-10 space-y-8 text-slate-600 dark:text-slate-400 leading-7">
            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
              <p>GharHub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our property management platform and services.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
              <p>We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Account information (name, email address)</li>
                <li>Property listings and related content</li>
                <li>Messages and communications with other users</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Improve user experience and platform functionality</li>
                <li>Communicate with you about updates and support</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">4. Data Security</h2>
              <p>We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest using Supabase's security infrastructure.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">5. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@gharhub.site" className="text-teal-600 hover:underline">support@gharhub.site</a>.</p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
