-- ============================================================
-- FIX: Seller stats, property stats, favorite notifications
-- Run this migration to fix views/inquiries on Properties page
-- and notify sellers when buyers favorite their properties
-- ============================================================

-- 1. Fix get_seller_stats — ensure named return columns
CREATE OR REPLACE FUNCTION public.get_seller_stats()
RETURNS TABLE (
  total_listings bigint,
  published_count bigint,
  draft_count bigint,
  sold_count bigint,
  rented_count bigint,
  total_views bigint,
  total_favorites bigint,
  total_inquiries bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  RETURN QUERY SELECT
    (SELECT count(*)::bigint FROM public.properties WHERE owner_id = uid),
    (SELECT count(*)::bigint FROM public.properties WHERE owner_id = uid AND status = 'published'),
    (SELECT count(*)::bigint FROM public.properties WHERE owner_id = uid AND status = 'draft'),
    (SELECT count(*)::bigint FROM public.properties WHERE owner_id = uid AND status = 'sold'),
    (SELECT count(*)::bigint FROM public.properties WHERE owner_id = uid AND status = 'rented'),
    (SELECT count(*)::bigint FROM public.property_views pv
       JOIN public.properties p ON p.id = pv.property_id
       WHERE p.owner_id = uid),
    (SELECT count(*)::bigint FROM public.favorites f
       JOIN public.properties p ON p.id = f.property_id
       WHERE p.owner_id = uid),
    (SELECT count(*)::bigint FROM public.conversations c
       JOIN public.properties p ON p.id::text = c.property_id
       WHERE p.owner_id = uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_stats() TO authenticated;

-- 2. Fix get_property_stats — ensure named return columns
CREATE OR REPLACE FUNCTION public.get_property_stats(target_property uuid)
RETURNS TABLE (view_count bigint, favorite_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT
    (SELECT count(*)::bigint FROM public.property_views WHERE property_id = target_property),
    (SELECT count(*)::bigint FROM public.favorites WHERE property_id = target_property);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_property_stats(uuid) TO authenticated;

-- 3. NEW: Per-property stats for all seller's properties at once
CREATE OR REPLACE FUNCTION public.get_seller_property_stats()
RETURNS TABLE (
  property_id uuid,
  views bigint,
  favorites bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE((SELECT count(*)::bigint FROM public.property_views pv WHERE pv.property_id = p.id), 0),
    COALESCE((SELECT count(*)::bigint FROM public.favorites f WHERE f.property_id = p.id), 0)
  FROM public.properties p
  WHERE p.owner_id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_property_stats() TO authenticated;

-- 4. Add 'favorite' to notifications type constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
    AND pg_get_constraintdef(oid) LIKE '%favorite%'
    AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
      type = ANY (ARRAY[
        'new_message', 'property_approved', 'property_rejected', 'property_sold',
        'favorite_updated', 'favorite', 'support', 'role_request'
      ])
    );
  END IF;
END $$;

-- 5. Add 'favorite' column to notification_preferences if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences'
    AND column_name = 'favorite'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN favorite boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- 6. Notify seller when buyer favorites their property
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  property_owner uuid;
  property_title text;
  fav_user_name text;
BEGIN
  SELECT owner_id, title INTO property_owner, property_title
  FROM public.properties WHERE id = NEW.property_id;

  IF property_owner IS NULL OR property_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'A user') INTO fav_user_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, body, type, action_url)
  VALUES (
    property_owner,
    'Property favorited',
    fav_user_name || ' saved your property "' || property_title || '" to their favorites.',
    'favorite',
    '/dashboard/property/' || NEW.property_id::text
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_favorite_notify ON public.favorites;
CREATE TRIGGER on_favorite_notify
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_favorite();
