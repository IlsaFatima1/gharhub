-- Enterprise property-search indexes for PostgreSQL / Supabase.
-- Run after the properties table is created. CONCURRENTLY avoids blocking production writes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_published_newest_idx
  ON properties (created_at DESC, id DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_published_price_idx
  ON properties (price, id) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_location_idx
  ON properties (city, area, purpose, property_type) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_rooms_idx
  ON properties (bedrooms, bathrooms) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_title_trgm_idx
  ON properties USING gin (title gin_trgm_ops) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS properties_area_trgm_idx
  ON properties USING gin (area gin_trgm_ops) WHERE status = 'published';

-- Production API queries should select card fields only, use keyset pagination
-- (created_at, id) < (:cursor_created_at, :cursor_id), and cap page size at 50.
