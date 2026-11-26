begin;

create table public.slf_retired_photos (
  owner_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid not null,
  filename text not null,
  primary key (owner_id, draft_id, filename)
);

alter table public.slf_retired_photos enable row level security;
revoke all on public.slf_retired_photos from public, anon, authenticated;

create function public.slf_photo_refs(payload jsonb)
returns setof text language sql immutable set search_path = ''
as $$
  select distinct entry #>> '{}'
  from (
    select value as entry from jsonb_path_query(payload, '$.media[*]') as item(value)
    union all
    select value from jsonb_path_query(payload, '$.files.*') as item(value)
    union all
    select value from jsonb_path_query(payload, '$.project.**.image.file') as item(value)
  ) as refs
  where jsonb_typeof(entry) = 'string'
    and (entry #>> '{}') ~ '^[a-f0-9]{64}[.](jpg|png|webp|gif|avif|bmp|tif)$';
$$;
revoke execute on function public.slf_photo_refs(jsonb) from public, anon, authenticated;

create function public.slf_retire_draft_photos()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.slf_photo_refs(new.payload) as ref(filename)
    join public.slf_retired_photos as retired using (filename)
    where retired.owner_id = new.owner_id and retired.draft_id = new.id
  ) then
    raise exception 'Foto sudah dihapus dari draf. Muat ulang aplikasi sebelum menyimpan kembali.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    insert into public.slf_retired_photos (owner_id, draft_id, filename)
    select new.owner_id, new.id, removed.filename
    from (
      select filename from public.slf_photo_refs(old.payload) as ref(filename)
      except
      select filename from public.slf_photo_refs(new.payload) as ref(filename)
    ) as removed
    on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.slf_retire_draft_photos() from public, anon, authenticated;

create trigger slf_retire_draft_photos
before insert or update of payload on public.slf_drafts
for each row execute function public.slf_retire_draft_photos();

create function public.slf_retired_photo_paths()
returns setof text language sql stable security definer set search_path = ''
as $$
  select objects.name
  from public.slf_retired_photos as retired
  join storage.objects as objects
    on objects.bucket_id = 'slf-photos'
    and objects.name = retired.owner_id::text || '/' || retired.draft_id::text || '/' || retired.filename
  where retired.owner_id = (select auth.uid())
  order by retired.draft_id, retired.filename
  limit 100;
$$;
revoke execute on function public.slf_retired_photo_paths() from public, anon, authenticated;
grant execute on function public.slf_retired_photo_paths() to authenticated;

create function public.slf_can_delete_retired_photo(object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.slf_retired_photos as retired
    where retired.owner_id = (select auth.uid())
      and retired.draft_id::text = split_part(object_name, '/', 2)
      and retired.filename = split_part(object_name, '/', 3)
      and object_name = retired.owner_id::text || '/' || retired.draft_id::text || '/' || retired.filename
  );
$$;
revoke execute on function public.slf_can_delete_retired_photo(text) from public, anon, authenticated;
grant execute on function public.slf_can_delete_retired_photo(text) to authenticated;

create policy slf_photos_delete_retired on storage.objects for delete to authenticated
  using (bucket_id = 'slf-photos' and public.slf_can_delete_retired_photo(name));

commit;
