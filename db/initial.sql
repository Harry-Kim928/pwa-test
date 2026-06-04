-- ================================================================
-- QANDA 튜터 PWA — 신규 Supabase 프로젝트 초기 스키마
-- 새 프로젝트의 SQL Editor에 통째로 붙여넣고 Run 한 번이면 완료.
-- 모든 문장은 멱등(idempotent)이라 다시 실행해도 안전합니다.
-- ================================================================

-- ----------------------------------------------------------------
-- 0. 공용 트리거 함수
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------
-- 1. tutors — 튜터 마스터 (phone 키로 auth와 연결)
-- ----------------------------------------------------------------
create table if not exists public.tutors (
  user_id bigint primary key,
  phone text unique,
  name text not null,
  university text,
  major text,
  track text,
  academic_status text,
  available_subjects text,
  confident_subjects text,
  tutor_status text not null,
  tutor_status_changed_at timestamptz,
  tutor_status_change_reason text,
  tutor_rank text,
  match_ready boolean default false,
  profile_match_status text,
  total_students integer default 0,
  tutor_created_at timestamptz,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_e164_format check (
    phone is null or phone ~ '^82[1-9][0-9]{8,9}$'
  ),
  constraint tutor_status_values check (
    tutor_status in ('ACTIVE','INACTIVE','BANNED','DROP','PENDING','UNDER_BAR')
  )
);

create index if not exists idx_tutors_status on public.tutors(tutor_status);
create index if not exists idx_tutors_phone on public.tutors(phone) where phone is not null;
create index if not exists idx_tutors_imported_at on public.tutors(imported_at);

drop trigger if exists tutors_set_updated_at on public.tutors;
create trigger tutors_set_updated_at before update on public.tutors
  for each row execute function public.set_updated_at();

alter table public.tutors enable row level security;

drop policy if exists tutors_select_own on public.tutors;
create policy tutors_select_own on public.tutors
  for select to authenticated
  using (phone = (auth.jwt() ->> 'phone'));

-- ----------------------------------------------------------------
-- 2. admins — 어드민 대시보드 접근 권한
-- ----------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists admins_self_select on public.admins;
create policy admins_self_select on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 3. devices — 디바이스 트래킹 + 푸시 구독 저장
-- ----------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text,
  device_id text not null,
  platform text,
  user_agent text,
  is_pwa boolean default false,
  push_subscription jsonb,
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index if not exists idx_devices_user on public.devices(user_id);
create index if not exists idx_devices_phone on public.devices(phone);
create index if not exists idx_devices_last_seen on public.devices(last_seen_at desc);

alter table public.devices enable row level security;

drop policy if exists devices_owner_all on public.devices;
create policy devices_owner_all on public.devices
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists devices_admin_select on public.devices;
create policy devices_admin_select on public.devices
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ----------------------------------------------------------------
-- 4. textbooks — 인기 교재 카탈로그
-- ----------------------------------------------------------------
create table if not exists public.textbooks (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('중등', '고등')),
  subject text not null check (subject in ('국어', '수학', '영어', '사회', '과학')),
  category text not null check (category in ('자습서', '평가문제집', '단어장', '유형서', '기출문제집', '모의고사')),
  title text not null,
  publisher text not null,
  isbn text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (isbn)
);

create index if not exists idx_textbooks_lookup on public.textbooks(level, subject, category);

alter table public.textbooks enable row level security;

drop policy if exists textbooks_read_all on public.textbooks;
create policy textbooks_read_all on public.textbooks
  for select to authenticated using (true);

drop policy if exists textbooks_admin_write on public.textbooks;
create policy textbooks_admin_write on public.textbooks
  for insert to authenticated
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists textbooks_admin_update on public.textbooks;
create policy textbooks_admin_update on public.textbooks
  for update to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists textbooks_admin_delete on public.textbooks;
create policy textbooks_admin_delete on public.textbooks
  for delete to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()));

drop trigger if exists textbooks_set_updated_at on public.textbooks;
create trigger textbooks_set_updated_at before update on public.textbooks
  for each row execute function public.set_updated_at();

-- ================================================================
-- 5. 어드민 등록 — 본인 phone OTP 로그인 후 실행
-- ================================================================
-- 새 환경에서 본인 번호로 한 번 로그인 → auth.users에 row 생성
-- → 아래 SQL 실행 (phone 값은 본인 것으로 수정)
-- ================================================================
-- insert into public.admins (user_id)
-- select id from auth.users where phone = '821040973119'
-- on conflict (user_id) do nothing;
