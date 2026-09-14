-- Add seller contact information to properties so buyers can reach sellers
-- directly on WhatsApp from Discover and the property details page.
alter table public.properties add column if not exists seller_name text;
alter table public.properties add column if not exists seller_whatsapp text;
