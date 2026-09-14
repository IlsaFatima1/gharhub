import { createContext, useContext, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { CheckCircle2, X, AlertCircle } from 'lucide-react'

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = { primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-900/10', secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200', ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800', danger: 'bg-rose-600 text-white hover:bg-rose-700' }
  return <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${styles[variant]} ${className}`} {...props} />
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white ${className}`} {...props} />
}

export function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} /> }

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 rounded-2xl bg-teal-50 p-4 text-teal-700 dark:bg-teal-950 dark:text-teal-400">{icon}</div><h3 className="font-display text-lg font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p></div>
}

type Toast = { id: number; message: string; tone: 'success' | 'error' }
type ToastContextValue = { toast: (message: string, tone?: Toast['tone']) => void }
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const toast = (message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now()
    setItems((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3500)
  }
  return <ToastContext.Provider value={{ toast }}>{children}<div className="fixed bottom-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2" aria-live="polite">{items.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">{item.tone === 'success' ? <CheckCircle2 className="size-5 text-teal-600" /> : <AlertCircle className="size-5 text-rose-500" />}<span className="flex-1">{item.message}</span><button onClick={() => setItems((current) => current.filter((x) => x.id !== item.id))} aria-label="Dismiss"><X className="size-4 text-slate-400" /></button></div>)}</div></ToastContext.Provider>
}

export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error('useToast must be used inside ToastProvider'); return context }
