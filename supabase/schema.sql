-- ============================================================
-- Zentyzone — Esquema de base de datos (Supabase / PostgreSQL)
-- ------------------------------------------------------------
-- Ejecuta este archivo UNA SOLA VEZ en el SQL Editor de Supabase.
-- Si lo ejecutas dos veces dara error de "ya existe" (es normal).
-- ============================================================

-- ---- Tabla: profiles (extiende auth.users de Supabase) -----
create table profiles (
  id uuid references auth.users primary key,
  email text,
  plan text default 'free' check (plan in ('free', 'pro')),
  notes_generated_count int default 0,
  created_at timestamptz default now()
);

-- ---- Tabla: notes (historial de notas generadas) -----------
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  client_initials text,
  session_date date,
  duration_minutes int,
  note_type text check (note_type in ('rbt_daily', 'soap', 'bcba_progress')),
  input_text text,
  output_text text
);

-- ---- Row Level Security: cada usuario solo ve lo suyo ------
alter table profiles enable row level security;
alter table notes enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can read own notes"
  on notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes"
  on notes for insert with check (auth.uid() = user_id);

-- ---- Crear el perfil automaticamente al registrarse --------
-- Sin esto, un usuario nuevo no tendria fila en 'profiles' y la
-- logica del limite de notas (Paso 9) no funcionaria.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Seguridad: cerrar el acceso publico a la funcion ------
-- Solo el trigger debe ejecutar handle_new_user, no internet.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
