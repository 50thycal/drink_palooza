/**
 * The whole database, no migrations framework (same approach as MovieTime).
 * Every statement is idempotent, so it runs safely on every cold start.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS members (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name       text        NOT NULL CHECK (length(name) BETWEEN 1 AND 30),
     emoji      text        NOT NULL DEFAULT '🍸',
     color      text        NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS members_name_key ON members (lower(name))`,

  `CREATE TABLE IF NOT EXISTS settings (
     key        text PRIMARY KEY,
     value      jsonb       NOT NULL,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,

  // One palooza. lobby → live → lastcall → wrapped → complete.
  `CREATE TABLE IF NOT EXISTS events (
     id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name             text        NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
     host_id          uuid        NOT NULL REFERENCES members(id),
     status           text        NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','live','lastcall','wrapped','complete')),
     current_drink_id uuid,
     order_set        boolean     NOT NULL DEFAULT false,
     order_version    integer     NOT NULL DEFAULT 0,
     wrap_slide       integer     NOT NULL DEFAULT 0 CHECK (wrap_slide >= 0),
     options          jsonb       NOT NULL DEFAULT '{}'::jsonb,
     created_at       timestamptz NOT NULL DEFAULT now(),
     started_at       timestamptz,
     wrapped_at       timestamptz,
     completed_at     timestamptz
   )`,
  // Only one palooza can be open at a time: it's what makes "tonight" unambiguous
  // and stops two phones creating rival events.
  `CREATE UNIQUE INDEX IF NOT EXISTS events_one_open ON events ((true)) WHERE status <> 'complete'`,
  `CREATE INDEX IF NOT EXISTS events_completed_idx ON events (completed_at DESC)`,

  `CREATE TABLE IF NOT EXISTS event_participants (
     event_id  uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
     member_id uuid        NOT NULL REFERENCES members(id),
     position  integer,
     joined_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (event_id, member_id)
   )`,

  // One drink per person per palooza. Created on join; the recipe fills in later.
  `CREATE TABLE IF NOT EXISTS drinks (
     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     event_id      uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
     member_id     uuid        NOT NULL REFERENCES members(id),
     name          text        NOT NULL DEFAULT '' CHECK (length(name) <= 60),
     story         text        NOT NULL DEFAULT '' CHECK (length(story) <= 600),
     glass         text        NOT NULL DEFAULT '' CHECK (length(glass) <= 40),
     garnish       text        NOT NULL DEFAULT '' CHECK (length(garnish) <= 80),
     ingredients   jsonb       NOT NULL DEFAULT '[]'::jsonb,
     method        text        NOT NULL DEFAULT '' CHECK (length(method) <= 1500),
     status        text        NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','presenting','done')),
     hero_photo_id uuid,
     started_at    timestamptz,
     ended_at      timestamptz,
     created_at    timestamptz NOT NULL DEFAULT now(),
     updated_at    timestamptz NOT NULL DEFAULT now(),
     UNIQUE (event_id, member_id)
   )`,
  // At most one drink on stage per palooza.
  `CREATE UNIQUE INDEX IF NOT EXISTS drinks_one_presenting ON drinks (event_id) WHERE status = 'presenting'`,

  `CREATE TABLE IF NOT EXISTS photos (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     drink_id    uuid        NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
     uploader_id uuid        NOT NULL REFERENCES members(id),
     url         text        NOT NULL,
     width       integer,
     height      integer,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS photos_drink_idx ON photos (drink_id)`,
  // Where the original lives in Vercel Blob. Private blobs are streamed through
  // /api/photos/:id, so `url` is what the app shows and these are what it reads.
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS blob_url text`,
  `ALTER TABLE photos ADD COLUMN IF NOT EXISTS blob_access text CHECK (blob_access IS NULL OR blob_access IN ('public','private'))`,
  // Used only when no Vercel Blob store is attached (local dev, or a deploy
  // before Blob is set up). Photos are resized on the phone first, so rows are small.
  `CREATE TABLE IF NOT EXISTS photo_data (
     photo_id uuid  PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
     mime     text  NOT NULL,
     data     bytea NOT NULL
   )`,

  // Whole numbers 1–10, one per person per drink per category. The CHECK and
  // the key are what make that true regardless of what a phone sends.
  `CREATE TABLE IF NOT EXISTS scores (
     drink_id   uuid        NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
     member_id  uuid        NOT NULL REFERENCES members(id),
     category   text        NOT NULL CHECK (category IN ('taste','appearance','creativity','presentation')),
     score      integer     NOT NULL CHECK (score BETWEEN 1 AND 10),
     updated_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (drink_id, member_id, category)
   )`,

  // Private tasting notes: only ever returned to their author.
  `CREATE TABLE IF NOT EXISTS notes (
     drink_id   uuid        NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
     member_id  uuid        NOT NULL REFERENCES members(id),
     text       text        NOT NULL CHECK (length(text) <= 1000),
     updated_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (drink_id, member_id)
   )`,

  `CREATE TABLE IF NOT EXISTS comments (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     drink_id   uuid        NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
     member_id  uuid        NOT NULL REFERENCES members(id),
     text       text        NOT NULL CHECK (length(text) BETWEEN 1 AND 200),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS comments_drink_idx ON comments (drink_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS reactions (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     drink_id   uuid        NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
     member_id  uuid        NOT NULL REFERENCES members(id),
     emoji      text        NOT NULL CHECK (length(emoji) BETWEEN 1 AND 16),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS reactions_drink_idx ON reactions (drink_id, created_at)`,

  // ---- Seating & passed napkins ----------------------------------------------
  // Where everyone sits around the real table, so a napkin flicked "that way"
  // lands on whoever is sitting that way.
  `ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS seat integer`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS table_shape text NOT NULL DEFAULT 'round' CHECK (table_shape IN ('round','long'))`,
  `ALTER TABLE events ADD COLUMN IF NOT EXISTS seating_set boolean NOT NULL DEFAULT false`,

  // A napkin passed from one person to another: private between the two.
  `CREATE TABLE IF NOT EXISTS napkin_passes (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     event_id   uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
     from_id    uuid        NOT NULL REFERENCES members(id),
     to_id      uuid        NOT NULL REFERENCES members(id),
     text       text        NOT NULL CHECK (length(text) BETWEEN 1 AND 200),
     created_at timestamptz NOT NULL DEFAULT now(),
     read_at    timestamptz,
     CHECK (from_id <> to_id)
   )`,
  `CREATE INDEX IF NOT EXISTS napkin_passes_to_idx ON napkin_passes (to_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS napkin_passes_event_idx ON napkin_passes (event_id)`,

  // ---- The chalkboard ---------------------------------------------------------
  // Anyone can write on it, any time; it outlives every palooza.
  `CREATE TABLE IF NOT EXISTS chalk_notes (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     member_id  uuid        NOT NULL REFERENCES members(id),
     text       text        NOT NULL CHECK (length(text) BETWEEN 1 AND 140),
     color      text        NOT NULL DEFAULT 'white' CHECK (color IN ('white','pink','yellow','teal')),
     event_id   uuid        REFERENCES events(id) ON DELETE SET NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS chalk_notes_created_idx ON chalk_notes (created_at DESC)`,
];
