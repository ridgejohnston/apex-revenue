-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Add universal (admin) referral codes
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- 1. Add new columns to referral_codes
alter table referral_codes add column if not exists is_universal boolean default false not null;
alter table referral_codes add column if not exists label text;

-- 2. Drop the unique constraint on user_id so admins can create multiple universal codes
-- First find and drop the constraint (safe if already dropped)
do $$
begin
  -- Drop unique index on user_id if it exists
  if exists (
    select 1 from pg_constraint
    where conrelid = 'referral_codes'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 1
    and conkey[1] = (
      select attnum from pg_attribute
      where attrelid = 'referral_codes'::regclass and attname = 'user_id'
    )
  ) then
    execute 'alter table referral_codes drop constraint ' || (
      select conname from pg_constraint
      where conrelid = 'referral_codes'::regclass
      and contype = 'u'
      and array_length(conkey, 1) = 1
      and conkey[1] = (
        select attnum from pg_attribute
        where attrelid = 'referral_codes'::regclass and attname = 'user_id'
      )
    );
  end if;
end $$;

-- 3. Add a partial unique index so regular users still get only one personal code
-- but admins can have unlimited universal codes
create unique index if not exists idx_referral_codes_user_personal
  on referral_codes (user_id)
  where is_universal = false;
