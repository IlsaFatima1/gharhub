import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ArrowLeft, Building2 } from 'lucide-react'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { ToastProvider, Button } from './components/ui'
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from './features/auth/AuthPages'
import { DashboardHome, ProtectedLayout } from './features/dashboard/Dashboard'
import { ProfilePage, SettingsPage } from './features/dashboard/AccountPages'
import { DynamicTeamPage } from './features/team/TeamPage'
import { EditPropertyPage, NewPropertyPage, PropertiesPage } from './features/properties/PropertyPages'
import { FavoritesPage } from './features/properties/FavoritesPage'
import { PropertyProvider } from './features/properties/property-store'
import { PropertySearchPage } from './features/search/PropertySearchPage'
import { PropertyDetailsPage } from './features/properties/PropertyDetailsPage'
import { NotificationProvider } from './features/notifications/NotificationProvider'
import { NotificationCenter, NotificationPreferencesPage } from './features/notifications/NotificationUI'
import { AdminRoute } from './features/admin/AdminDashboard'
import { useProperties } from './features/properties/property-store'
import { AIAssistant } from './features/ai/AIAssistant'
import { AIRecommendationsPage } from './features/ai/AIRecommendationsPage'
import { AIStudioPage } from './features/ai/AIStudioPage'
import { LandingPage } from './features/marketing/LandingPage'
import { PrivacyPage } from './features/marketing/PrivacyPage'
import { TermsPage } from './features/marketing/TermsPage'
import { PublicSearchPage } from './features/seo/PublicSearchPage'
import { PublicPropertyPage } from './features/seo/PublicPropertyPage'
import { PageTransition } from './components/PageTransition'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

function PropertyDetailsGate() {
  const { id } = useParams()
  const { loading, error, get, fetchOne } = useProperties()
  const [fetching, setFetching] = useState(false)
  useEffect(() => { if (!loading && id && !get(id)) { setFetching(true); void fetchOne(id).finally(() => setFetching(false)) } }, [id, loading])
  if (loading || fetching) return <div className="grid min-h-[60vh] place-items-center text-sm text-slate-500">Loading property details…</div>
  if (error) return <div className="grid min-h-[60vh] place-items-center text-sm text-rose-600">{error}</div>
  return <PropertyDetailsPage />
}

function StatusPage({ code, title, message }: { code: string; title: string; message: string }) {
  const navigate = useNavigate()
  const goBack = () => { if (code === '404') navigate('/dashboard'); else navigate(-1) }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-slate-950"><div><div className="mx-auto mb-7 grid size-14 place-items-center rounded-2xl bg-teal-600 text-white"><Building2/></div><p className="font-display text-8xl font-semibold tracking-tighter text-teal-700/20 dark:text-teal-300/20">{code}</p><h1 className="-mt-6 font-display text-3xl font-semibold">{title}</h1><p className="mx-auto mt-3 max-w-md text-slate-500">{message}</p><Button className="mt-7" onClick={goBack}><ArrowLeft className="size-4"/>Go back</Button></div></main>
}

function AppRoutes() {
  const location = useLocation()
  return <AnimatePresence mode="wait"><Routes location={location} key={location.pathname}>
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
  </Routes></AnimatePresence>
}

function App() {
  return <QueryClientProvider client={queryClient}><ThemeProvider><ToastProvider><AuthProvider><PropertyProvider><NotificationProvider><BrowserRouter><AIAssistant/><AppRoutes/></BrowserRouter></NotificationProvider></PropertyProvider></AuthProvider></ToastProvider></ThemeProvider></QueryClientProvider>
}

export default App
