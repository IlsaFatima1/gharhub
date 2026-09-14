import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, CheckCheck, ChevronLeft, ImagePlus, Info, LoaderCircle, MessageCircle, MoreHorizontal, RefreshCw, Search, Send, ShieldCheck, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useMessaging } from './MessagingProvider'
import { useToast } from '../../components/ui'
import type { ChatMessage, Conversation } from './types'

export function InboxPage() {
  const { conversations, messages, typing, online, loading, error, send, markRead, setTyping, refresh } = useMessaging()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const selectedId = params.get('conversation')
  const selected = conversations.find(c => c.id === selectedId) ?? null

  const filtered = useMemo(
    () =>
      conversations
        .filter(c => `${c.participants[0]?.name} ${c.propertyTitle}`.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt)),
    [conversations, query],
  )

  const [retried, setRetried] = useState(false)
  useEffect(() => {
    if (selectedId && !selected && !loading && !error && !retried) {
      setRetried(true)
      void refresh()
    }
  }, [selectedId, selected, loading, error, retried, refresh])

  useEffect(() => {
    if (selected) void markRead(selected.id)
  }, [selected?.id, markRead])

  return (
    <div className="mx-auto h-[calc(100vh-160px)] min-h-[580px] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid h-full md:grid-cols-[320px_1fr]">
        <aside className={`${selected ? 'hidden md:flex' : 'flex'} min-w-0 flex-col border-r border-slate-200 dark:border-slate-800`}>
          <div className="border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Communication</p>
                <h1 className="mt-1 font-display text-2xl font-semibold">Inbox</h1>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950">
                <MessageCircle className="size-5" />
              </span>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="h-9 w-full rounded-xl bg-slate-100 pl-9 pr-3 text-sm outline-none dark:bg-slate-800"
                placeholder="Search conversations…"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <ConversationSkeleton />
            ) : error ? (
              <div className="m-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="mx-auto mb-2 size-6" />
                <p>{error}</p>
                <button
                  onClick={() => void refresh()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  <RefreshCw className="size-3.5" /> Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <MessageCircle className="size-6" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">No conversations yet</p>
                <p className="mt-1 max-w-[15rem] text-xs text-slate-400">
                  When you message a seller about a property, your conversation will appear here.
                </p>
              </div>
            ) : (
              filtered.map(c => (
                <ConversationRow key={c.id} conversation={c} active={c.id === selectedId} open={() => setParams({ conversation: c.id })} />
              ))
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 p-4 text-[11px] text-slate-400 dark:border-slate-800">
            <ShieldCheck className="size-4 text-teal-600" />
            Messages are private and access-controlled.
          </div>
        </aside>
        <section className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-col`}>
          {selected ? (
            <ConversationView
              conversation={selected}
              messages={messages[selected.id] ?? []}
              typing={Boolean(typing[selected.id])}
              online={online}
              back={() => setParams({})}
              send={send}
              setTyping={setTyping}
            />
          ) : selectedId && (loading || !retried) ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <LoaderCircle className="mx-auto size-8 animate-spin text-teal-600" />
                <p className="mt-3 text-sm text-slate-500">Loading conversation…</p>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-teal-50 text-teal-700 dark:bg-teal-950">
                  <MessageCircle className="size-7" />
                </span>
                <h2 className="mt-5 font-display text-xl font-semibold">Your conversations</h2>
                <p className="mt-2 text-sm text-slate-500">Select a conversation to continue.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex w-full gap-3 rounded-2xl p-3">
          <div className="size-11 shrink-0 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-2.5 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ConversationRow({ conversation: c, active, open }: { conversation: Conversation; active: boolean; open: () => void }) {
  const person = c.participants[0]
  return (
    <button
      onClick={open}
      className={`flex w-full gap-3 rounded-2xl p-3 text-left transition ${active ? 'bg-teal-50 dark:bg-teal-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <p className="truncate text-sm font-semibold">{person?.name}</p>
          <time className="shrink-0 text-[10px] text-slate-400">{relative(c.lastMessageAt)}</time>
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium text-teal-700 dark:text-teal-400">{c.propertyTitle}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className={`min-w-0 flex-1 truncate text-xs ${c.unreadCount ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-400'}`}>{c.lastMessage}</p>
          {c.unreadCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-teal-600 text-[10px] font-bold text-white">{c.unreadCount}</span>
          )}
        </div>
      </div>
    </button>
  )
}

function ConversationView({
  conversation,
  messages,
  typing,
  online,
  back,
  send,
  setTyping,
}: {
  conversation: Conversation
  messages: ChatMessage[]
  typing: boolean
  online: boolean
  back: () => void
  send: (id: string, body: string, file?: File) => Promise<void>
  setTyping: (id: string, value: boolean) => void
}) {
  const person = conversation.participants[0]
  const { user } = useAuth()
  const { toast } = useToast()
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<number | null>(null)

  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages.length, typing])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current) }, [])

  const change = (value: string) => {
    setBody(value)
    setTyping(conversation.id, true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => setTyping(conversation.id, false), 1200)
  }
  const choose = (next: File | undefined) => {
    if (!next) return
    if (!next.type.startsWith('image/') || next.size > 10 * 1024 * 1024) {
      toast('Choose an image under 10 MB.', 'error')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }
  const submit = async () => {
    if ((!body.trim() && !file) || sending) return
    setSending(true)
    try {
      await send(conversation.id, body, file ?? undefined)
      setBody('')
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setTyping(conversation.id, false)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Message could not be sent.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <header className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800 sm:px-5">
        <button onClick={back} className="grid size-9 place-items-center rounded-xl hover:bg-slate-100 md:hidden">
          <ChevronLeft />
        </button>
        <Avatar person={person} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{person?.name}</p>
          <p className="text-xs text-slate-400">
            {online && person?.online ? <span className="text-emerald-600">Online now</span> : `Last seen ${relative(person?.lastSeen ?? '')}`}
          </p>
        </div>
        <div className="ml-auto flex gap-1">
          <button className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Conversation details">
            <Info className="size-5" />
          </button>
          <button className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="More options">
            <MoreHorizontal />
          </button>
        </div>
      </header>
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40">
        <img src={conversation.propertyImage} alt="" className="size-11 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Discussing</p>
          <p className="truncate text-sm font-semibold">{conversation.propertyTitle}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#fafcfb] p-4 dark:bg-slate-950/40 sm:p-6">
        <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Conversation started securely</p>
        <div className="space-y-3">
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              own={m.senderId === user?.id}
              showTime={i === messages.length - 1 || messages[i + 1]?.senderId !== m.senderId}
            />
          ))}
        </div>
        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex w-fit gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-slate-800"
            >
              <Dot />
              <Dot delay=".15s" />
              <Dot delay=".3s" />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottom} />
      </div>
      <footer className="border-t border-slate-100 p-3 dark:border-slate-800 sm:p-4">
        {preview && (
          <div className="relative mb-3 w-fit">
            <img src={preview} alt="Ready to send" className="h-20 w-28 rounded-xl object-cover" />
            <button
              onClick={() => {
                URL.revokeObjectURL(preview)
                setPreview(null)
                setFile(null)
              }}
              className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-slate-900 text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              choose(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <button onClick={() => input.current?.click()} className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Share image">
            <ImagePlus className="size-5" />
          </button>
          <textarea
            value={body}
            onChange={e => change(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              }
            }}
            rows={1}
            maxLength={2000}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 dark:bg-slate-800"
            placeholder="Write a message…"
          />
          <button
            onClick={() => void submit()}
            disabled={sending || (!body.trim() && !file)}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-600 text-white disabled:opacity-40"
            aria-label="Send message"
          >
            {sending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}
          </button>
        </div>
      </footer>
    </>
  )
}

function MessageBubble({ message: m, own, showTime }: { message: ChatMessage; own: boolean; showTime: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] sm:max-w-[70%] ${own ? 'text-right' : ''}`}>
        {m.imageUrl && (
          <a href={m.imageUrl} target="_blank" rel="noreferrer">
            <img src={m.imageUrl} alt="Shared attachment" className={`mb-1 max-h-64 w-full rounded-2xl object-cover ${own ? 'rounded-br-md' : 'rounded-bl-md'}`} />
          </a>
        )}
        {m.body && (
          <div
            className={`inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-6 ${
              own ? 'rounded-br-md bg-teal-600 text-white' : 'rounded-bl-md bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100'
            } ${m.state === 'failed' ? 'ring-2 ring-rose-400' : ''}`}
          >
            {m.body}
          </div>
        )}
        {showTime && (
          <p className={`mt-1 flex items-center gap-1 text-[10px] text-slate-400 ${own ? 'justify-end' : ''}`}>
            {formatTime(m.createdAt)}
            {own &&
              (m.state === 'read' ? (
                <CheckCheck className="size-3 text-teal-500" />
              ) : m.state === 'sending' ? (
                <span>Sending…</span>
              ) : (
                <Check className="size-3" />
              ))}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function Avatar({ person }: { person: Conversation['participants'][number] | undefined }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-[#073b3a] text-xs font-bold text-white">
      {person?.avatar}
      {person?.online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />}
    </span>
  )
}

function Dot({ delay = '0s' }: { delay?: string }) {
  return <span className="size-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: delay }} />
}

function relative(value: string) {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 60000))
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
