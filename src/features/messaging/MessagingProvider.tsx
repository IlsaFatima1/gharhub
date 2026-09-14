import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { createConversation, loadSnapshot, saveSnapshot, toMessage, uploadMessageImage } from './messaging-service'
import type { ChatMessage, Conversation, MessagingSnapshot } from './types'

type ContextValue = {
  conversations: Conversation[]
  messages: Record<string, ChatMessage[]>
  typing: Record<string, boolean>
  online: boolean
  loading: boolean
  error: string | null
  openForProperty: (id: string, title: string, image: string, sellerId?: string) => Promise<string>
  send: (conversationId: string, body: string, file?: File) => Promise<void>
  markRead: (conversationId: string) => Promise<void>
  setTyping: (conversationId: string, value: boolean) => void
  refresh: () => Promise<Conversation[] | null>
}
const Context = createContext<ContextValue | null>(null)

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<MessagingSnapshot>(() => (supabase ? { conversations: [], messages: {} } : loadSnapshot()))
  const [typing, setTypingState] = useState<Record<string, boolean>>({})
  const [online, setOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback((fn: (current: MessagingSnapshot) => MessagingSnapshot) => {
    setSnapshot(current => {
      const next = fn(current)
      if (!supabase) saveSnapshot(next)
      return next
    })
  }, [])

  const refresh = useCallback(async (): Promise<Conversation[] | null> => {
    if (!supabase || !user) return null
    setLoading(true)
    setError(null)
    try {
      // 1. Conversations the current user belongs to.
      const { data: myMembers, error: myErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id)
      if (myErr) throw myErr
      if (!myMembers?.length) {
        setSnapshot({ conversations: [], messages: {} })
        return []
      }
      const ids = myMembers.map(m => String(m.conversation_id))

      // 2. All members of those conversations (so we can find the other participant).
      const { data: allMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id,user_id')
        .in('conversation_id', ids)

      const memberMap = new Map<string, string[]>()
      for (const m of allMembers ?? []) {
        const cid = String(m.conversation_id)
        const list = memberMap.get(cid)
        if (list) list.push(String(m.user_id))
        else memberMap.set(cid, [String(m.user_id)])
      }

      // 3. Conversation details.
      const { data: convRows, error: convErr } = await supabase
        .from('conversations')
        .select('id,property_id,updated_at')
        .in('id', ids)
      if (convErr) throw convErr

      const propertyIds = (convRows ?? []).map(c => String(c.property_id)).filter(Boolean)
      const otherUserIds = [...new Set((allMembers ?? []).filter(m => m.user_id !== user.id).map(m => String(m.user_id)))]

      // 4. Messages, properties and profiles (profiles failure must NOT blank the inbox).
      const [{ data: messageRows }, { data: rows }, { data: profiles }] = await Promise.all([
        supabase.from('messages').select('*').in('conversation_id', ids).order('created_at', { ascending: true }).limit(1000),
        supabase.from('properties').select('id,title,images,owner_id').in('id', propertyIds),
        otherUserIds.length
          ? supabase.from('profiles').select('user_id,full_name,avatar_url').in('user_id', otherUserIds)
          : Promise.resolve({ data: [] as { user_id: string; full_name: string; avatar_url: string | null }[] }),
      ])

      const profileMap = new Map((profiles ?? []).map(p => [String(p.user_id), p]))
      const propertyMap = new Map((rows ?? []).map(row => [String(row.id), row]))

      const nextMessages: Record<string, ChatMessage[]> = {}
      for (const row of messageRows ?? []) {
        const message = toMessage(row)
        ;(nextMessages[message.conversationId] ??= []).push(message)
      }

      const conversations: Conversation[] = (convRows ?? []).map(row => {
        const conversation = row as { id: string; property_id: string; updated_at: string }
        const property = propertyMap.get(conversation.property_id)
        const list = nextMessages[conversation.id] ?? []
        const last = list.at(-1)
        const otherIds = (memberMap.get(conversation.id) ?? []).filter(id => id !== user.id)
        const otherProfile = otherIds.length ? profileMap.get(otherIds[0]) : undefined
        const otherName = otherProfile?.full_name?.trim() || 'User'
        return {
          id: conversation.id,
          propertyId: conversation.property_id,
          propertyTitle: String(property?.title ?? 'Property conversation'),
          propertyImage: String((property?.images as string[] | undefined)?.[0] ?? '/properties/modern-villa.jpg'),
          participants: [{ id: otherIds[0] ?? 'unknown', name: otherName, avatar: initials(otherName), role: 'seller' as const, online: false, lastSeen: conversation.updated_at }],
          lastMessage: last?.body || (last?.imageUrl ? 'Sent an image' : 'Start a conversation'),
          lastMessageAt: last?.createdAt ?? conversation.updated_at,
          unreadCount: list.filter(message => message.senderId !== user.id && !message.readAt).length,
        }
      })
      setSnapshot({ conversations, messages: nextMessages })
      return conversations
    } catch (e) {
      console.error('messaging refresh error:', e)
      const detail = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : ''
      setError(detail || 'Could not load your messages. Check the browser console for details.')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (supabase) {
      void refresh()
      return
    }
    const sync = () => setSnapshot(loadSnapshot())
    addEventListener('haven:messages', sync)
    addEventListener('storage', sync)
    return () => {
      removeEventListener('haven:messages', sync)
      removeEventListener('storage', sync)
    }
  }, [refresh])

  useEffect(() => {
    const connected = () => setOnline(navigator.onLine)
    addEventListener('online', connected)
    addEventListener('offline', connected)
    return () => {
      removeEventListener('online', connected)
      removeEventListener('offline', connected)
    }
  }, [])

  const applyRealtimeMessage = useCallback((message: ChatMessage) => {
    update(current => {
      const existing = current.messages[message.conversationId] ?? []
      const without = existing.filter(m => m.id !== message.id)
      const nextList = [...without, message].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      const conversations = current.conversations.map(c => {
        if (c.id !== message.conversationId) return c
        const mine = message.senderId === user?.id
        return {
          ...c,
          lastMessage: message.body || (message.imageUrl ? 'Sent an image' : c.lastMessage),
          lastMessageAt: message.createdAt,
          unreadCount: mine ? c.unreadCount : c.unreadCount + 1,
        }
      })
      return { ...current, conversations, messages: { ...current.messages, [message.conversationId]: nextList } }
    })
  }, [update, user])

  useEffect(() => {
    if (!supabase || !user) return
    let channel: RealtimeChannel
    channel = supabase
      .channel(`messages:${user.id}`, { config: { presence: { key: user.id } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const message = toMessage(payload.new)
        if (message.senderId === user.id) {
          // Replace our optimistic message with the confirmed one.
          update(current => ({
            ...current,
            messages: {
              ...current.messages,
              [message.conversationId]: (current.messages[message.conversationId] ?? [])
                .filter(m => m.id !== message.id)
                .concat(message)
                .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
            },
          }))
        } else {
          applyRealtimeMessage(message)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const message = toMessage(payload.new)
        applyRealtimeMessage(message)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const data = payload as { conversationId: string; userId: string; value: boolean }
        if (data.userId !== user.id) {
          setTypingState(current => ({ ...current, [data.conversationId]: data.value }))
          if (data.value) setTimeout(() => setTypingState(current => ({ ...current, [data.conversationId]: false })), 3000)
        }
      })
      .on('presence', { event: 'sync' }, () => setOnline(true))
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
      })
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [applyRealtimeMessage, update, user])

  const openForProperty = useCallback(async (id: string, title: string, image: string, sellerId?: string) => {
    const existing = snapshot.conversations.find(conversation => conversation.propertyId === id)
    if (existing) return existing.id
    if (supabase && user) {
      if (!sellerId) throw new Error('This property does not have a valid seller.')
      if (sellerId === user.id) throw new Error('You cannot start a buyer conversation with your own listing.')
      const { data, error } = await supabase.rpc('get_or_create_property_conversation', { target_property: id, target_seller: sellerId })
      if (error) throw new Error(error.message)
      const conversationId = String(data)
      let loaded = await refresh()
      if (!loaded?.some(conversation => conversation.id === conversationId)) {
        await new Promise(resolve => setTimeout(resolve, 600))
        loaded = await refresh()
      }
      if (!loaded?.some(conversation => conversation.id === conversationId)) {
        throw new Error('Conversation was created but could not be loaded. Please try again.')
      }
      return conversationId
    }
    const result = createConversation(snapshot, id, title, image)
    setSnapshot(result.snapshot)
    saveSnapshot(result.snapshot)
    return result.conversation.id
  }, [snapshot, user, refresh])

  const send = useCallback(async (conversationId: string, body: string, file?: File) => {
    if (!user) throw new Error('Sign in to send messages.')
    const clean = body.trim()
    if (!clean && !file) return
    if (clean.length > 2000) throw new Error('Messages can contain up to 2,000 characters.')
    const id = crypto.randomUUID()
    let imageUrl: string | null = null
    const optimistic: ChatMessage = {
      id,
      conversationId,
      senderId: user.id,
      body: clean,
      imageUrl: null,
      kind: file ? 'image' : 'text',
      createdAt: new Date().toISOString(),
      readAt: null,
      state: 'sending',
    }
    update(current => ({
      ...current,
      messages: { ...current.messages, [conversationId]: [...(current.messages[conversationId] ?? []), optimistic] },
    }))
    try {
      if (file) imageUrl = await uploadMessageImage(file, user.id)
      if (supabase) {
        const { error } = await supabase.from('messages').insert({
          id,
          conversation_id: conversationId,
          sender_id: user.id,
          body: clean,
          kind: file ? 'image' : 'text',
          image_url: imageUrl,
        })
        if (error) throw error
      }
      const sent = { ...optimistic, imageUrl, state: 'sent' as const }
      update(current => ({
        ...current,
        conversations: current.conversations.map(c =>
          c.id === conversationId ? { ...c, lastMessage: file ? 'Sent an image' : clean, lastMessageAt: sent.createdAt } : c,
        ),
        messages: {
          ...current.messages,
          [conversationId]: (current.messages[conversationId] ?? []).map(m => (m.id === id ? sent : m)),
        },
      }))
    } catch (error) {
      update(current => ({
        ...current,
        messages: {
          ...current.messages,
          [conversationId]: (current.messages[conversationId] ?? []).map(m => (m.id === id ? { ...m, state: 'failed' } : m)),
        },
      }))
      throw error
    }
  }, [user, update])

  const markRead = useCallback(async (conversationId: string) => {
    const at = new Date().toISOString()
    update(current => ({
      ...current,
      conversations: current.conversations.map(c => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      messages: {
        ...current.messages,
        [conversationId]: (current.messages[conversationId] ?? []).map(m => (m.senderId !== user?.id ? { ...m, readAt: at, state: 'read' } : m)),
      },
    }))
    if (supabase && user) {
      try {
        await supabase.rpc('mark_conversation_read', { target_conversation: conversationId })
      } catch {
        // Mark-read is best-effort; do not break UI on failure.
      }
    }
  }, [user, update])

  const setTyping = useCallback((conversationId: string, value: boolean) => {
    if (supabase && user) {
      void supabase.channel(`messages:${user.id}`).send({ type: 'broadcast', event: 'typing', payload: { conversationId, userId: user.id, value } })
    } else {
      setTypingState(current => ({ ...current, [conversationId]: value }))
      if (value) setTimeout(() => setTypingState(current => ({ ...current, [conversationId]: false })), 1800)
    }
  }, [user])

  const value = useMemo(
    () => ({ conversations: snapshot.conversations, messages: snapshot.messages, typing, online, loading, error, openForProperty, send, markRead, setTyping, refresh }),
    [snapshot, typing, online, loading, error, openForProperty, send, markRead, setTyping, refresh],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useMessaging() {
  const value = useContext(Context)
  if (!value) throw new Error('useMessaging requires MessagingProvider')
  return value
}
