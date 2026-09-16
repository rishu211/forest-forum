create table public.profiles (
  id uuid primary key,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  capacity int not null default 8,
  image_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.seats (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  seat_number int not null,
  occupant_id uuid references public.profiles(id) on delete set null,
  speaking boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (room_id, seat_number)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  unique (user_id, friend_id)
);

create index messages_room_idx on public.messages (room_id, created_at);
create index seats_room_idx on public.seats (room_id, seat_number);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.seats to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant all on public.profiles, public.rooms, public.seats, public.messages, public.friendships to service_role;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.seats enable row level security;
alter table public.messages enable row level security;
alter table public.friendships enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "rooms readable" on public.rooms for select to authenticated using (true);
create policy "users create rooms" on public.rooms for insert to authenticated with check (created_by = auth.uid() or created_by is null);
create policy "creators update rooms" on public.rooms for update to authenticated using (created_by = auth.uid());

create policy "seats readable" on public.seats for select to authenticated using (true);
create policy "users claim or free seats" on public.seats for update to authenticated using (occupant_id is null or occupant_id = auth.uid()) with check (occupant_id is null or occupant_id = auth.uid());
create policy "users create seats" on public.seats for insert to authenticated with check (occupant_id = auth.uid() or occupant_id is null);

create policy "messages readable" on public.messages for select to authenticated using (true);
create policy "users post messages" on public.messages for insert to authenticated with check (user_id = auth.uid());

create policy "own friendships readable" on public.friendships for select to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
create policy "users send friend requests" on public.friendships for insert to authenticated with check (user_id = auth.uid());
create policy "participants update friendships" on public.friendships for update to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
create policy "users delete own friendships" on public.friendships for delete to authenticated using (user_id = auth.uid() or friend_id = auth.uid());

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.seats;

insert into public.profiles (id, username, display_name, bio, avatar_url) values
  ('11111111-1111-1111-1111-111111111111', 'mara', 'Mara Vance', 'Keeps a small fire for the people who can''t sleep. Bring a story or just your quiet.', '/avatars/a1.jpg'),
  ('22222222-2222-2222-2222-222222222222', 'theo', 'Theo Callahan', 'Here for long pauses and better questions.', '/avatars/a2.jpg'),
  ('33333333-3333-3333-3333-333333333333', 'juniper', 'Juniper Okafor', 'Chasing the smell of pine smoke into every conversation.', '/avatars/a3.jpg'),
  ('44444444-4444-4444-4444-444444444444', 'aspen', 'Aspen Reed', 'Night shift survivor. The fire keeps me honest.', '/avatars/a4.jpg'),
  ('55555555-5555-5555-5555-555555555555', 'fennel', 'Fennel Hart', 'Story collector. Will trade a ghost story for a cocoa.', '/avatars/a5.jpg'),
  ('66666666-6666-6666-6666-666666666666', 'ember', 'Ember Halloran', 'Keeper of the longest-burning fire in the clearing.', '/avatars/a6.jpg');

insert into public.rooms (id, name, description, capacity, image_url, created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'The Long Talk', 'Deep talk that outlasts the firewood.', 8, '/images/campfire-room.jpg', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Quiet Hours', 'Low voices, long silences, good company.', 6, '/images/clearing-2.jpg', '66666666-6666-6666-6666-666666666666'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'First Light Stories', 'Ember-side storytelling until dawn.', 8, '/images/clearing-3.jpg', '55555555-5555-5555-5555-555555555555');

insert into public.seats (room_id, seat_number, occupant_id, speaking) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 0, '11111111-1111-1111-1111-111111111111', true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 1, '22222222-2222-2222-2222-222222222222', false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 2, '33333333-3333-3333-3333-333333333333', false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 3, '44444444-4444-4444-4444-444444444444', false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 4, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 5, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 6, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 7, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 0, '66666666-6666-6666-6666-666666666666', false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 1, '11111111-1111-1111-1111-111111111111', false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 2, '55555555-5555-5555-5555-555555555555', true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 3, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 4, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 5, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 0, '55555555-5555-5555-5555-555555555555', false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 1, '22222222-2222-2222-2222-222222222222', true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 2, '33333333-3333-3333-3333-333333333333', false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 3, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 4, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 5, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 6, null, false),
  ('aaaaaaaa-0000-0000-0000-000000000003', 7, null, false);

insert into public.messages (room_id, user_id, content, created_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Anyone else hear the owls tonight? Two of them, calling back and forth.', now() - interval '42 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Always. They nest in the tall pines behind the north ridge.', now() - interval '39 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Passing the cocoa around — hands up if you want some.', now() - interval '31 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Just clocked out. This fire is the only thing standing between me and sleep.', now() - interval '18 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Then sit close, Aspen. The embers do the talking for a while.', now() - interval '12 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 'Tonight''s story starts on a night train somewhere in the mountains…', now() - interval '55 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'I have nowhere to be. Take your time.', now() - interval '48 minutes'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Dawn shift is mine tonight. First light stories are the best kind.', now() - interval '3 hours');

insert into public.friendships (user_id, friend_id, status) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'accepted'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'accepted'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'accepted'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'accepted'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'accepted'),
  ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'accepted'),
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'accepted');