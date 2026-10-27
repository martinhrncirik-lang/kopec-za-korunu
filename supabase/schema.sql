-- Kopec za korunu – databázové schéma.
-- Spusťte jednou v Supabase: SQL Editor → New query → vložit → Run.

create table if not exists athletes (
  id            bigint generated always as identity primary key,  -- interní ID, jde do VS
  strava_id     bigint unique not null,
  firstname     text,
  access_token  text not null,
  refresh_token text not null,
  expires_at    bigint not null,
  created_at    timestamptz not null default now()
);

create table if not exists activities (
  strava_id     bigint primary key,
  athlete_id    bigint not null references athletes(id) on delete cascade,
  sport_type    text not null,
  start_local   timestamp not null,      -- místní čas začátku aktivity
  month         text not null,           -- 'YYYY-MM' podle místního času
  distance_m    numeric not null,
  elevation_m   numeric not null default 0,
  moving_time_s integer not null default 0,
  praise        text,                    -- pochvala za mimořádný švih, pokud byla
  created_at    timestamptz not null default now()
);
create index if not exists activities_athlete_start on activities (athlete_id, start_local);
create index if not exists activities_athlete_month on activities (athlete_id, month);

create table if not exists push_subscriptions (
  endpoint      text primary key,
  athlete_id    bigint not null references athletes(id) on delete cascade,
  subscription  jsonb not null,
  created_at    timestamptz not null default now()
);

-- Row Level Security zapnuté bez jakýchkoli pravidel = z prohlížeče nikdo nic nepřečte.
-- Aplikace přistupuje jen ze serveru se secret klíčem.
alter table athletes enable row level security;
alter table activities enable row level security;
alter table push_subscriptions enable row level security;

-- v0.2: deník zpráv od Stravy (pro ladění webhooku)
create table if not exists webhook_events (
  id          bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  payload     jsonb not null,
  result      text
);
alter table webhook_events enable row level security;

-- v0.3: profilový obrázek
alter table athletes add column if not exists strava_avatar_url text;
alter table athletes add column if not exists strava_avatar_checked boolean not null default false;
alter table athletes add column if not exists avatar_url text;
alter table athletes add column if not exists avatar_source text not null default 'strava';

-- v0.3: primární příjemce daru
alter table athletes add column if not exists default_recipient text not null default 'nrv';
