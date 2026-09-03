-- ============================================================
-- Meeting Room Reservation System — Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: salas (Rooms)
-- ============================================================
create table if not exists salas (
  id                       uuid primary key default gen_random_uuid(),
  nome                     varchar(100)  not null,
  capacidade               integer       not null check (capacidade >= 1),
  disponivel_madrugada     boolean       not null default false,
  disponivel_fim_de_semana boolean       not null default false,
  created_at               timestamptz   not null default now(),
  updated_at               timestamptz   not null default now()
);

-- Migration for existing databases:
-- ALTER TABLE salas ADD COLUMN IF NOT EXISTS disponivel_madrugada boolean not null default false;
-- ALTER TABLE salas ADD COLUMN IF NOT EXISTS disponivel_fim_de_semana boolean not null default false;

-- Prevent duplicate room names
create unique index if not exists salas_nome_unique on salas (lower(trim(nome)));

-- ============================================================
-- TABLE: reservas (Reservations)
-- ============================================================
create table if not exists reservas (
  id                       uuid primary key default gen_random_uuid(),
  sala_id                  uuid          not null references salas(id) on delete cascade,
  titulo                   varchar(150)  not null,
  participante_responsavel varchar(100)  not null,
  quantidade_participantes integer       not null check (quantidade_participantes >= 1),
  data                     date          not null,
  horario_inicio           time          not null,
  horario_fim              time          not null,
  created_at               timestamptz   not null default now(),
  updated_at               timestamptz   not null default now(),

  nome_empresa             varchar(150),
  nivel_evento             varchar(5),
  -- End time must be after start time
  constraint horario_valido check (horario_fim > horario_inicio)
);

-- Migration for existing databases:
-- ALTER TABLE reservas ADD COLUMN IF NOT EXISTS nome_empresa varchar(150);
-- ALTER TABLE reservas ADD COLUMN IF NOT EXISTS nivel_evento varchar(5);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast lookup of reservations by room
create index if not exists reservas_sala_id_idx on reservas (sala_id);

-- Fast lookup by date for conflict detection and dashboard queries
create index if not exists reservas_data_idx on reservas (data);

-- Composite index for conflict queries (sala_id + date)
create index if not exists reservas_sala_data_idx on reservas (sala_id, data);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger salas_updated_at
  before update on salas
  for each row execute procedure update_updated_at();

create or replace trigger reservas_updated_at
  before update on reservas
  for each row execute procedure update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — open for now; add auth later
-- ============================================================
alter table salas   enable row level security;
alter table reservas enable row level security;

-- Allow all operations (no authentication required for this challenge)
create policy "Allow all on salas"   on salas   for all using (true) with check (true);
create policy "Allow all on reservas" on reservas for all using (true) with check (true);

-- ============================================================
-- SEED DATA (optional — comment out if not needed)
-- ============================================================
-- insert into salas (nome, capacidade) values
--   ('Sala Azul',    10),
--   ('Sala Verde',   20),
--   ('Auditório',   100);
