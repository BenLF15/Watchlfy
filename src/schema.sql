-- Watchlfy – idempotentes Schema. Wird bei jedem Start ausgeführt.

CREATE TABLE IF NOT EXISTS app_meta (
  key         text PRIMARY KEY,
  value       text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- Konten
CREATE TABLE IF NOT EXISTS accounts (
  id                   bigserial PRIMARY KEY,
  username             text NOT NULL,
  password_hash        text NOT NULL,
  is_admin             boolean NOT NULL DEFAULT false,
  theme                text NOT NULL DEFAULT 'dark',
  lang                 text,
  festive              boolean NOT NULL DEFAULT true,
  glass                boolean NOT NULL DEFAULT false,
  birthday             date,
  privacy_accepted_at  timestamptz,
  free_shop            boolean NOT NULL DEFAULT false,
  login_count          integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  last_login_at        timestamptz,
  last_seen_at         timestamptz,
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_uq ON accounts (lower(username));

CREATE TABLE IF NOT EXISTS login_events (
  id          bigserial PRIMARY KEY,
  account_id  bigint REFERENCES accounts(id) ON DELETE CASCADE,
  at          timestamptz NOT NULL DEFAULT now(),
  user_agent  text
);
CREATE INDEX IF NOT EXISTS login_events_at_idx ON login_events (at DESC);

CREATE TABLE IF NOT EXISTS account_avatars (
  account_id  bigint PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  mime        text NOT NULL,
  data        text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- Katalog (TMDB)
CREATE TABLE IF NOT EXISTS titles (
  id                 bigserial PRIMARY KEY,
  kind               text NOT NULL CHECK (kind IN ('movie', 'tv')),
  tmdb_id            integer,
  name               text NOT NULL,
  original_name      text,
  year               integer,
  overview           text,
  poster_path        text,
  backdrop_path      text,
  genres             text[] NOT NULL DEFAULT '{}',
  countries          text[] NOT NULL DEFAULT '{}',
  cast_names         text[] NOT NULL DEFAULT '{}',
  original_language  text,
  runtime            integer,               -- Minuten (Film) bzw. typische Folgenlänge (Serie)
  seasons            jsonb,                 -- [{ "season": 1, "episodes": 8, "name": "…" }]
  episode_count      integer,               -- Folgen gesamt ohne Specials
  status             text,
  details_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
-- Kennzahlen für Seltenheiten in der Sammlung: Bekanntheit, Bewertung, Einspielergebnis (TMDB)
ALTER TABLE titles ADD COLUMN IF NOT EXISTS popularity real;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS vote_average real;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS vote_count integer;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS revenue bigint;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS stats_at timestamptz;
-- Wo der Titel im Abo läuft (TMDB, Region TMDB_REGION): alle Anbieter + eindeutiger Dienst für Trakt-Einträge
ALTER TABLE titles ADD COLUMN IF NOT EXISTS providers text[];
ALTER TABLE titles ADD COLUMN IF NOT EXISTS provider text;
-- Anbieter v2: nur noch Netflix, Prime, Disney+, HBO Max (WOW/Sky zählt zu HBO Max) – betroffene Titel neu einordnen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_meta WHERE key = 'providers_v2') THEN
    UPDATE titles SET providers = NULL WHERE providers IS NOT NULL AND (provider IS NULL OR provider IN ('wow', 'apple'));
    INSERT INTO app_meta (key, value) VALUES ('providers_v2', 'done') ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;   -- wann Kennzahlen aus den TMDB-Details übernommen wurden
CREATE UNIQUE INDEX IF NOT EXISTS titles_tmdb_uq ON titles (kind, tmdb_id) WHERE tmdb_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS titles_name_idx ON titles (lower(name));

CREATE TABLE IF NOT EXISTS episodes (
  title_id  bigint NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  season    integer NOT NULL,
  episode   integer NOT NULL,
  name      text,
  runtime   integer,
  air_date  date,
  PRIMARY KEY (title_id, season, episode)
);

-- Roh-Titel (normalisiert) → Titel, pro Konto korrigierbar
CREATE TABLE IF NOT EXISTS title_aliases (
  account_id   bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  raw_key      text NOT NULL,               -- 'tv|breaking bad' oder 'movie|inception'
  raw_name     text NOT NULL,
  kind_hint    text NOT NULL,
  title_id     bigint REFERENCES titles(id) ON DELETE SET NULL,
  confidence   real,
  state        text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'matched', 'uncertain', 'none', 'manual')),
  checked_at   timestamptz,
  PRIMARY KEY (account_id, raw_key)
);
CREATE INDEX IF NOT EXISTS title_aliases_state_idx ON title_aliases (state);

CREATE TABLE IF NOT EXISTS tmdb_cache (
  key         text PRIMARY KEY,
  data        jsonb,
  ok          boolean NOT NULL DEFAULT true,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- Schauverlauf
CREATE TABLE IF NOT EXISTS imports (
  id            bigserial PRIMARY KEY,
  account_id    bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source        text NOT NULL,
  filename      text,
  profile       text,
  rows_total    integer NOT NULL DEFAULT 0,
  rows_added    integer NOT NULL DEFAULT 0,
  rows_skipped  integer NOT NULL DEFAULT 0,
  first_at      timestamptz,
  last_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS imports_account_idx ON imports (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS views (
  id              bigserial PRIMARY KEY,
  account_id      bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source          text NOT NULL,              -- netflix | prime | max | disney | apple | other | trakt
  profile         text,
  raw_title       text NOT NULL,
  raw_key         text NOT NULL,              -- → title_aliases
  kind_hint       text NOT NULL,              -- tv | movie
  season          integer,
  episode         integer,
  episode_name    text,
  watched_at      timestamptz NOT NULL,
  time_known      boolean NOT NULL DEFAULT true,
  duration_sec    integer,                    -- echte Dauer, wenn bekannt
  device          text,
  country         text,
  import_id       bigint REFERENCES imports(id) ON DELETE SET NULL,
  external_id     text,                       -- z. B. Trakt-History-ID
  tmdb_hint       integer,                    -- TMDB-ID, wenn die Quelle sie mitliefert (Trakt)
  dedupe_key      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS views_dedupe_uq ON views (account_id, dedupe_key);
CREATE INDEX IF NOT EXISTS views_account_time_idx ON views (account_id, watched_at);
CREATE INDEX IF NOT EXISTS views_account_raw_idx ON views (account_id, raw_key);

-- ---------------------------------------------------------------- Trakt
CREATE TABLE IF NOT EXISTS trakt_tokens (
  account_id     bigint PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  access_token   text NOT NULL,
  refresh_token  text NOT NULL,
  expires_at     timestamptz NOT NULL,
  username       text,
  last_sync_at   timestamptz,
  last_history_at timestamptz,
  last_error     text,
  sync_ratings   boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Trakt meldet über /sync/last_activities, wann sich der Verlauf zuletzt geändert hat (auch bei nachgetragener Historie)
ALTER TABLE trakt_tokens ADD COLUMN IF NOT EXISTS last_activity text;

CREATE TABLE IF NOT EXISTS ratings (
  account_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  tmdb_id     integer NOT NULL,
  rating      smallint NOT NULL,
  rated_at    timestamptz,
  PRIMARY KEY (account_id, kind, tmdb_id)
);

CREATE TABLE IF NOT EXISTS sync_log (
  id           bigserial PRIMARY KEY,
  account_id   bigint REFERENCES accounts(id) ON DELETE CASCADE,
  job          text NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  ok           boolean,
  message      text
);
CREATE INDEX IF NOT EXISTS sync_log_account_idx ON sync_log (account_id, job, id DESC);

-- ---------------------------------------------------------------- Freunde
CREATE TABLE IF NOT EXISTS friendships (
  requester_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  addressee_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  accepted_at   timestamptz,
  PRIMARY KEY (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id);

-- ---------------------------------------------------------------- Noten & Sammlung
CREATE TABLE IF NOT EXISTS note_ledger (
  id          bigserial PRIMARY KEY,
  account_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  key         text,
  bronze      integer NOT NULL DEFAULT 0,
  silver      integer NOT NULL DEFAULT 0,
  gold        integer NOT NULL DEFAULT 0,
  platinum    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- Währung v2: Filmmeter (m) + Goldtickets (t) statt Bronze/Silber/Gold/Platin. Alte Buchungen werden einmalig umgerechnet.
ALTER TABLE note_ledger ADD COLUMN IF NOT EXISTS meters integer NOT NULL DEFAULT 0;
ALTER TABLE note_ledger ADD COLUMN IF NOT EXISTS tickets integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM app_meta WHERE key = 'currency_v2') THEN
    UPDATE note_ledger SET meters = meters + bronze * 10 + silver * 40, tickets = tickets + gold + platinum * 4,
      bronze = 0, silver = 0, gold = 0, platinum = 0
     WHERE bronze <> 0 OR silver <> 0 OR gold <> 0 OR platinum <> 0;
    INSERT INTO app_meta (key, value) VALUES ('currency_v2', 'done') ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS note_ledger_key_uq ON note_ledger (account_id, key) WHERE key IS NOT NULL;
CREATE INDEX IF NOT EXISTS note_ledger_account_idx ON note_ledger (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS collection (
  account_id   bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  item_id      text NOT NULL,
  format       text NOT NULL CHECK (format IN ('dvd', 'bluray', 'poster')),
  rarity       text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  edition      text NOT NULL,               -- standard | steelbook | collector | signed | holo | …
  title_id     bigint REFERENCES titles(id) ON DELETE SET NULL,
  name         text NOT NULL,
  year         integer,
  poster_path  text,
  hue          integer,
  price        jsonb,
  acquired_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, item_id)
);

CREATE TABLE IF NOT EXISTS screening_sessions (
  account_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day         date NOT NULL,
  rounds      jsonb NOT NULL,
  progress    jsonb NOT NULL DEFAULT '[]',
  score       integer NOT NULL DEFAULT 0,
  rewarded    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, day)
);

-- ---------------------------------------------------------------- Filmmusik (Rückblick)
CREATE TABLE IF NOT EXISTS soundtrack_cache (
  key         text PRIMARY KEY,
  track_id    text,
  data        jsonb,
  fetched_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS soundtrack_cache_track_idx ON soundtrack_cache (track_id);

-- ---------------------------------------------------------------- Videothek: was schon im Regal stand (für Rotation)
CREATE TABLE IF NOT EXISTS shop_days (
  account_id  bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day         date NOT NULL,
  items       jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, day)
);
