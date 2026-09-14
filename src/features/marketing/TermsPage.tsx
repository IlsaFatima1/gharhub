import { Link } from 'react-router-dom'
import { Building2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Seo } from '../../lib/seo'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Seo
        title="Terms of Service"
        description="Read the terms and conditions that govern your use of GharHub, our property marketplace and related services."
        canonicalPath="/terms"
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
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Last updated: January 2026</p>
          
          <div className="mt-10 space-y-8 text-slate-600 dark:text-slate-400 leading-7">
            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing or using GharHub, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">2. User Responsibilities</h2>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Maintaining accurate property listings</li>
                <li>Responding to inquiries professionally</li>
                <li>Complying with all applicable laws and regulations</li>
                <li>Protecting your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">3. Prohibited Activities</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Post false or misleading property listings</li>
                <li>Spam other users with unsolicited messages</li>
                <li>Attempt to circumvent security measures</li>
                <li>Use the service for any illegal purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">4. Limitation of Liability</h2>
              <p>GharHub is not liable for any indirect, incidental, or consequential damages arising from your use of the service. We provide the service "as is" without warranties of any kind.</p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-4">5. Contact Us</h2>
              <p>If you have questions about these Terms, please contact us at <a href="mailto:support@gharhub.site" className="text-teal-600 hover:underline">support@gharhub.site</a>.</p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
