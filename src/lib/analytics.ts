/**
 * Privacy-respecting analytics for GharHub.
 *
 * Disabled unless VITE_GA_MEASUREMENT_ID is set at build time AND the visitor
 * has accepted cookies (localStorage 'haven-cookie-consent' === 'accepted').
 * Never sends passwords, tokens, messages, or personal seller data.
 * Event names follow GA4 recommended snake_case.
 */
const CONSENT_KEY = 'haven-cookie-consent'
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

function consentGiven(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function analyticsEnabled(): boolean {
  return Boolean(GA_ID && consentGiven())
}

/** Load gtag.js once, only with an ID and consent. Safe to call repeatedly. */
export function initAnalytics(): void {
  if (initialized || !GA_ID || !consentGiven() || typeof window === 'undefined') return
  initialized = true
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { anonymize_ip: true })
}

export type AnalyticsEvent =
  | 'property_view'
  | 'search'
  | 'filter_used'
  | 'favorite_toggle'
  | 'whatsapp_click'
  | 'signup'
  | 'login'
  | 'listing_created'

/** No-ops silently when analytics is disabled — callers need no guards. */
export function trackEvent(event: AnalyticsEvent, params: Record<string, string | number | boolean> = {}): void {
  if (!analyticsEnabled()) {
    // Consent may have just been granted (banner still mounted) — try to init once more.
    initAnalytics()
    if (!analyticsEnabled()) return
  }
  window.gtag?.('event', event, params)
}
