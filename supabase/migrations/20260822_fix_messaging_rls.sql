-- Fix messaging RLS on conversation_members.
--
-- The original policy "members read membership" (20260324_messaging.sql) queries
-- conversation_members inside its own USING clause, which triggers infinite
-- recursion (SQLSTATE 42P17) on every SELECT against the table.
-- Earlier fixes (20260814, 20260821) only dropped/recreated a DIFFERENTLY-NAMED
-- policy ("conversation_members_select"), so the broken one survived.
-- This migration drops the broken policy by its EXACT name and recreates the
-- safe policy backed by is_conversation_member() (SECURITY DEFINER, bypasses
-- RLS and breaks the recursion).

-- Drop the old recursive policy
DROP POLICY IF EXISTS "members read membership" ON public.conversation_members;

-- Drop and recreate the safe policy
DROP POLICY IF EXISTS "conversation_members_select" ON public.conversation_members;
CREATE POLICY "conversation_members_select" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_member(conversation_id));

-- Add update policy for last_read_at
CREATE POLICY "member updates own receipt" ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
