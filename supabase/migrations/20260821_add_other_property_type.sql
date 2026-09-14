-- ============================================================
-- Migration: Add 'shop', 'office', 'other' to property_type
--            + custom_property_type column for flexible types
-- ============================================================

-- 1. Drop the old CHECK constraint on property_type
alter table public.properties
  drop constraint if exists properties_property_type_check;

-- 2. Add new CHECK constraint with all valid types
alter table public.properties
  add constraint properties_property_type_check
  check (property_type in ('house','apartment','villa','townhouse','land','commercial','shop','office','other'));

-- 3. Add custom_property_type column (nullable, only used when property_type='other')
alter table public.properties
  add column if not exists custom_property_type text;

-- 4. Validate existing data: if property_type='other' exists, custom_property_type should be set
--    (this is a no-op for existing rows since they won't have 'other' type yet)
--    But we add a partial CHECK for safety:
--    If property_type='other', custom_property_type must not be null or empty
alter table public.properties
  add constraint properties_other_needs_custom_type
  check (
    property_type != 'other'
    or (custom_property_type is not null and length(trim(custom_property_type)) >= 2)
  );

-- 5. Update the index that references property_type (if it exists with old types)
--    The existing index on area,purpose,property_type still works since it's a general index
--    No index changes needed since the index is not type-restricted

-- Done. Existing rows with property_type='house','apartment', etc. are unaffected.
