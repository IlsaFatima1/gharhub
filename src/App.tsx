import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ArrowLeft, Building2 } from 'lucide-react'
import { AuthProvider, useAuth } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { ToastProvider, Button } from './components/ui'
import { PropertyProvider } from './features/properties/property-store'
import { NotificationProvider } from './features/notifications/NotificationProvider'
import { useProperties } from './features/properties/property-store'
import { LandingPage } from './features/marketing/LandingPage'
import { PrivacyPage } from './features/marketing/PrivacyPage'
import { TermsPage } from './features/marketing/TermsPage'
import { PublicSearchPage } from './features/seo/PublicSearchPage'
import { PublicPropertyPage } from './features/seo/PublicPropertyPage'
import { PageTransition } from './components/PageTransition'

// Non-public routes are code-split so the landing page ships less JS.
const LoginPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./features/auth/AuthPages').then((m) => ({ default: m.ResetPasswordPage })))
const DashboardHome = lazy(() => import('./features/dashboard/Dashboard').then((m) => ({ default: m.DashboardHome })))
const ProtectedLayout = lazy(() => import('./features/dashboard/Dashboard').then((m) => ({ default: m.ProtectedLayout })))
const ProfilePage = lazy(() => import('./features/dashboard/AccountPages').then((m) => ({ default: m.ProfilePage })))
const SettingsPage = lazy(() => import('./features/dashboard/AccountPages').then((m) => ({ default: m.SettingsPage })))
const DynamicTeamPage = lazy(() => import('./features/team/TeamPage').then((m) => ({ default: m.DynamicTeamPage })))
const EditPropertyPage = lazy(() => import('./features/properties/PropertyPages').then((m) => ({ default: m.EditPropertyPage })))
const NewPropertyPage = lazy(() => import('./features/properties/PropertyPages').then((m) => ({ default: m.NewPropertyPage })))
const PropertiesPage = lazy(() => import('./features/properties/PropertyPages').then((m) => ({ default: m.PropertiesPage })))
const FavoritesPage = lazy(() => import('./features/properties/FavoritesPage').then((m) => ({ default: m.FavoritesPage })))
const PropertySearchPage = lazy(() => import('./features/search/PropertySearchPage').then((m) => ({ default: m.PropertySearchPage })))
const NotificationCenter = lazy(() => import('./features/notifications/NotificationUI').then((m) => ({ default: m.NotificationCenter })))
const NotificationPreferencesPage = lazy(() => import('./features/notifications/NotificationUI').then((m) => ({ default: m.NotificationPreferencesPage })))
const AdminRoute = lazy(() => import('./features/admin/AdminDashboard').then((m) => ({ default: m.AdminRoute })))
const AIAssistant = lazy(() => import('./features/ai/AIAssistant').then((m) => ({ default: m.AIAssistant })))
const AIRecommendationsPage = lazy(() => import('./features/ai/AIRecommendationsPage').then((m) => ({ default: m.AIRecommendationsPage })))
const AIStudioPage = lazy(() => import('./features/ai/AIStudioPage').then((m) => ({ default: m.AIStudioPage })))
const PropertyDetailsPage = lazy(() => import('./features/properties/PropertyDetailsPage').then((m) => ({ default: m.PropertyDetailsPage })))

function RouteFallback() {
  return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading…</div>
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

function PropertyDetailsGate() {
  const { id } = useParams()
  const { loading, error, get, fetchOne } = useProperties()
  const [fetching, setFetching] = useState(false)
  useEffect(() => { if (!loading && id && !get(id)) { setFetching(true); void fetchOne(id).finally(() => setFetching(false)) } }, [id, loading])
  if (loading || fetching) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading property details…</div>
  if (error) return <div className="grid min-h-[60vh] place-items-center text-sm text-rose-600">{error}</div>
  return <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading property details…</div>}><PropertyDetailsPage /></Suspense>
}

function StatusPage({ code, title, message }: { code: string; title: string; message: string }) {
  const navigate = useNavigate()
  const goBack = () => { if (code === '404') navigate('/dashboard'); else navigate(-1) }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-slate-950"><div><div className="mx-auto mb-7 grid size-14 place-items-center rounded-2xl bg-teal-600 text-white"><Building2/></div><p className="font-display text-8xl font-semibold tracking-tighter text-teal-700/20 dark:text-teal-300/20">{code}</p><h1 className="-mt-6 font-display text-3xl font-semibold">{title}</h1><p className="mx-auto mt-3 max-w-md text-slate-500">{message}</p><Button className="mt-7" onClick={goBack}><ArrowLeft className="size-4"/>Go back</Button></div></main>
}

function RecoveryRouteGuard() {
  const { isRecovery } = useAuth()
  const location = useLocation()
  if (location.pathname === '/reset-password') return null
  if (isRecovery) return <Navigate to="/reset-password" replace />
  const hash = window.location.hash
  if (hash.includes('error_code=') || hash.includes('access_denied') || hash.includes('error=')) {
    return <Navigate to={{ pathname: '/reset-password', hash }} replace />
  }
  return null
}

function AppRoutes() {
  const location = useLocation()
  return <><RecoveryRouteGuard/><AnimatePresence mode="wait"><Suspense fallback={<RouteFallback/>}><Routes location={location} key={location.pathname}>
    <Route path="/" element={<PageTransition><LandingPage/></PageTransition>}/>
    <Route path="/discover" element={<PageTransition><PublicSearchPage/></PageTransition>}/>
    <Route path="/buy" element={<PageTransition><PublicSearchPage/></PageTransition>}/>
    <Route path="/rent" element={<PageTransition><PublicSearchPage/></PageTransition>}/>
    <Route path="/properties/:slug" element={<PageTransition><PublicPropertyPage/></PageTransition>}/>
    <Route path="/privacy" element={<PageTransition><PrivacyPage/></PageTransition>}/>
    <Route path="/terms" element={<PageTransition><TermsPage/></PageTransition>}/>
    <Route path="/login" element={<PageTransition><LoginPage/></PageTransition>}/>
    <Route path="/signup" element={<PageTransition><SignupPage/></PageTransition>}/>
    <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage/></PageTransition>}/>
    <Route path="/reset-password" element={<PageTransition><ResetPasswordPage/></PageTransition>}/>
    <Route path="/dashboard" element={<ProtectedLayout/>}>
      <Route index element={<PageTransition><DashboardHome/></PageTransition>}/>
      <Route path="search" element={<PageTransition><PropertySearchPage/></PageTransition>}/>
      <Route path="property/:id" element={<PageTransition><PropertyDetailsGate/></PageTransition>}/>
      <Route path="notifications" element={<PageTransition><NotificationCenter/></PageTransition>}/>
      <Route path="notifications/preferences" element={<PageTransition><NotificationPreferencesPage/></PageTransition>}/>
      <Route path="admin" element={<PageTransition><AdminRoute/></PageTransition>}/>
      <Route path="ai-recommendations" element={<PageTransition><AIRecommendationsPage/></PageTransition>}/>
      <Route path="ai-studio" element={<PageTransition><AIStudioPage/></PageTransition>}/>
      <Route path="properties" element={<PageTransition><PropertiesPage/></PageTransition>}/>
      <Route path="favorites" element={<PageTransition><FavoritesPage/></PageTransition>}/>
      <Route path="properties/new" element={<PageTransition><NewPropertyPage/></PageTransition>}/>
      <Route path="properties/:id/edit" element={<PageTransition><EditPropertyPage/></PageTransition>}/>
      <Route path="profile" element={<PageTransition><ProfilePage/></PageTransition>}/>
      <Route path="team" element={<PageTransition><DynamicTeamPage/></PageTransition>}/>
      <Route path="settings" element={<PageTransition><SettingsPage/></PageTransition>}/>
    </Route>
    <Route path="/error" element={<StatusPage code="500" title="Something went sideways" message="We couldn't complete that request. Your data is safe — please try again."/>}/>
    <Route path="*" element={<StatusPage code="404" title="This page moved on" message="The page you're looking for doesn't exist or may have a new address."/>}/>
  </Routes></Suspense></AnimatePresence></>
}

function App() {
  return <QueryClientProvider client={queryClient}><ThemeProvider><ToastProvider><AuthProvider><PropertyProvider><NotificationProvider><BrowserRouter><Suspense fallback={null}><AIAssistant/></Suspense><AppRoutes/></BrowserRouter></NotificationProvider></PropertyProvider></AuthProvider></ToastProvider></ThemeProvider></QueryClientProvider>
}

export default App
