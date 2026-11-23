begin;

create table if not exists public.slf_drafts (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null,
  name text not null check (char_length(name) between 1 and 120),
  revision uuid not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 8388608),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.slf_drafts enable row level security;
revoke all on public.slf_drafts from public, anon, authenticated;
grant select on public.slf_drafts to authenticated;
grant insert (id, name, revision, payload), update (name, revision, payload)
  on public.slf_drafts to authenticated;

drop policy if exists slf_drafts_owner on public.slf_drafts;
create policy slf_drafts_owner on public.slf_drafts for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create or replace function public.slf_update_draft_timestamp()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.slf_update_draft_timestamp() from public, anon, authenticated;

drop trigger if exists slf_update_draft_timestamp on public.slf_drafts;
create trigger slf_update_draft_timestamp before update on public.slf_drafts
  for each row execute function public.slf_update_draft_timestamp();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slf-photos', 'slf-photos', false, 50000000,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp', 'image/tiff'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists slf_photos_insert on storage.objects;
create policy slf_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'slf-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists slf_photos_select on storage.objects;
create policy slf_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'slf-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;

