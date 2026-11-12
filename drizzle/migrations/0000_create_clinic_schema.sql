-- ================= CliniPlus: cloud schema =================

-- ---------- Config tables ----------

create table public.doctor_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty_id text not null,
  crm text not null default '',
  created_at timestamptz not null default now()
);

create table public.system_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password text not null default '',
  role text not null default 'receptionist',
  active boolean not null default true,
  doctor_id uuid,
  created_at timestamptz not null default now()
);

create table public.queue_rules (
  id integer primary key default 1,
  normal_before_priority integer not null default 2,
  priority_count integer not null default 1,
  constraint queue_rules_singleton check (id = 1)
);

create table public.ticket_counters (
  id integer primary key default 1,
  normal integer not null default 0,
  priority integer not null default 0,
  agendado integer not null default 0,
  normal_called_since_last_priority integer not null default 0,
  constraint ticket_counters_singleton check (id = 1)
);

-- ---------- Operational tables ----------

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  priority text not null default 'normal',
  specialty_id text not null,
  status text not null default 'aguardando_recepcao',
  patient_name text,
  patient_cpf text,
  patient_phone text,
  room text,
  office_id uuid,
  office_name text,
  doctor_id uuid,
  appointment_id uuid,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  hora_chegada timestamptz not null default now(),
  hora_chamada_recepcao timestamptz,
  hora_fim_recepcao timestamptz,
  hora_chamada_medico timestamptz,
  hora_fim_atendimento timestamptz
);

create index tickets_status_idx on public.tickets (status, created_at);
create index tickets_doctor_idx on public.tickets (doctor_id, status);

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  complaint text not null default '',
  observations text not null default '',
  diagnosis text not null default '',
  created_at timestamptz not null default now()
);

create index medical_records_ticket_idx on public.medical_records (ticket_id);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  patient_name text not null default '',
  doctor_name text not null default '',
  issued_at timestamptz not null default now(),
  medications jsonb not null default '[]'::jsonb,
  observations text not null default ''
);

create index prescriptions_ticket_idx on public.prescriptions (ticket_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  specialty_id text not null,
  patient_name text not null,
  patient_cpf text,
  patient_phone text,
  appointment_date text not null,
  appointment_time text not null,
  status text not null default 'agendado',
  created_at timestamptz not null default now()
);

create index appointments_day_idx on public.appointments (appointment_date, status);

-- ---------- Grants (Data API access) ----------

grant select, insert, update, delete on public.doctor_types to anon, authenticated;
grant select, insert, update, delete on public.offices to anon, authenticated;
grant select, insert, update, delete on public.doctors to anon, authenticated;
grant select, insert, update, delete on public.system_users to anon, authenticated;
grant select, insert, update, delete on public.queue_rules to anon, authenticated;
grant select, insert, update, delete on public.ticket_counters to anon, authenticated;
grant select, insert, update, delete on public.tickets to anon, authenticated;
grant select, insert, update, delete on public.medical_records to anon, authenticated;
grant select, insert, update, delete on public.prescriptions to anon, authenticated;
grant select, insert, update, delete on public.appointments to anon, authenticated;

grant all on public.doctor_types to service_role;
grant all on public.offices to service_role;
grant all on public.doctors to service_role;
grant all on public.system_users to service_role;
grant all on public.queue_rules to service_role;
grant all on public.ticket_counters to service_role;
grant all on public.tickets to service_role;
grant all on public.medical_records to service_role;
grant all on public.prescriptions to service_role;
grant all on public.appointments to service_role;

-- ---------- Row Level Security ----------

alter table public.doctor_types enable row level security;
alter table public.offices enable row level security;
alter table public.doctors enable row level security;
alter table public.system_users enable row level security;
alter table public.queue_rules enable row level security;
alter table public.ticket_counters enable row level security;
alter table public.tickets enable row level security;
alter table public.medical_records enable row level security;
alter table public.prescriptions enable row level security;
alter table public.appointments enable row level security;

create policy "clinic_doctor_types_all" on public.doctor_types for all to anon, authenticated using (true) with check (true);
create policy "clinic_offices_all" on public.offices for all to anon, authenticated using (true) with check (true);
create policy "clinic_doctors_all" on public.doctors for all to anon, authenticated using (true) with check (true);
create policy "clinic_system_users_all" on public.system_users for all to anon, authenticated using (true) with check (true);
create policy "clinic_queue_rules_all" on public.queue_rules for all to anon, authenticated using (true) with check (true);
create policy "clinic_ticket_counters_all" on public.ticket_counters for all to anon, authenticated using (true) with check (true);
create policy "clinic_tickets_all" on public.tickets for all to anon, authenticated using (true) with check (true);
create policy "clinic_medical_records_all" on public.medical_records for all to anon, authenticated using (true) with check (true);
create policy "clinic_prescriptions_all" on public.prescriptions for all to anon, authenticated using (true) with check (true);
create policy "clinic_appointments_all" on public.appointments for all to anon, authenticated using (true) with check (true);

-- ---------- Atomic helpers ----------

create or replace function public.next_ticket_code(p_priority text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_num integer;
  v_prefix text;
begin
  if p_priority = 'priority' then
    v_prefix := 'P';
    update public.ticket_counters set priority = priority + 1 where id = 1
      returning priority into v_num;
  elsif p_priority = 'agendado' then
    v_prefix := 'A';
    update public.ticket_counters set agendado = agendado + 1 where id = 1
      returning agendado into v_num;
  else
    v_prefix := 'N';
    update public.ticket_counters set normal = normal + 1 where id = 1
      returning normal into v_num;
  end if;
  return v_prefix || lpad(v_num::text, 3, '0');
end;
$$;

create or replace function public.call_next_reception()
returns setof public.tickets
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_normal_before integer;
  v_called_since integer;
  v_next public.tickets;
  v_found boolean := false;
  v_now timestamptz := now();
  v_call_priority boolean;
begin
  select normal_before_priority into v_normal_before from public.queue_rules where id = 1;
  if v_normal_before is null then v_normal_before := 2; end if;

  select normal_called_since_last_priority into v_called_since from public.ticket_counters where id = 1;
  if v_called_since is null then v_called_since := 0; end if;

  v_call_priority := exists (
      select 1 from public.tickets
      where status = 'aguardando_recepcao' and priority = 'priority'
    ) and (
      v_called_since >= v_normal_before
      or not exists (
        select 1 from public.tickets
        where status = 'aguardando_recepcao' and priority in ('normal', 'agendado')
      )
    );

  if v_call_priority then
    select * into v_next from public.tickets
      where status = 'aguardando_recepcao' and priority = 'priority'
      order by created_at asc
      limit 1
      for update skip locked;
    v_found := found;
    if v_found then
      update public.ticket_counters set normal_called_since_last_priority = 0 where id = 1;
    end if;
  else
    select * into v_next from public.tickets
      where status = 'aguardando_recepcao' and priority in ('agendado', 'normal')
      order by case priority when 'agendado' then 0 else 1 end, created_at asc
      limit 1
      for update skip locked;
    v_found := found;
    if v_found then
      update public.ticket_counters set normal_called_since_last_priority = v_called_since + 1 where id = 1;
    else
      select * into v_next from public.tickets
        where status = 'aguardando_recepcao' and priority = 'priority'
        order by created_at asc
        limit 1
        for update skip locked;
      v_found := found;
      if v_found then
        update public.ticket_counters set normal_called_since_last_priority = 0 where id = 1;
      end if;
    end if;
  end if;

  if not v_found then
    return;
  end if;

  update public.tickets
     set status = 'em_atendimento_recepcao',
         called_at = v_now,
         hora_chamada_recepcao = v_now
   where id = v_next.id;

  return query select * from public.tickets where id = v_next.id;
end;
$$;

create or replace function public.call_next_doctor(p_doctor_id uuid, p_office_id uuid, p_office_name text)
returns setof public.tickets
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_next public.tickets;
  v_found boolean := false;
  v_now timestamptz := now();
begin
  if p_doctor_id is null or p_office_id is null then
    return;
  end if;

  select * into v_next from public.tickets
    where status = 'aguardando_medico' and doctor_id = p_doctor_id
    order by case priority when 'priority' then 0 when 'agendado' then 1 else 2 end, created_at asc
    limit 1
    for update skip locked;
  v_found := found;

  if not v_found then
    return;
  end if;

  update public.tickets
     set status = 'em_atendimento_medico',
         called_at = v_now,
         hora_chamada_medico = v_now,
         office_id = p_office_id,
         office_name = p_office_name
   where id = v_next.id;

  return query select * from public.tickets where id = v_next.id;
end;
$$;

grant execute on function public.next_ticket_code(text) to anon, authenticated;
grant execute on function public.call_next_reception() to anon, authenticated;
grant execute on function public.call_next_doctor(uuid, uuid, text) to anon, authenticated;

-- ---------- Seed defaults ----------

insert into public.queue_rules (id, normal_before_priority, priority_count) values (1, 2, 1)
  on conflict (id) do nothing;
insert into public.ticket_counters (id) values (1) on conflict (id) do nothing;

insert into public.offices (name) values ('Consultório 1'), ('Consultório 2'), ('Consultório 3');

insert into public.system_users (name, email, password, role) values
  ('Admin Geral', 'admin@cliniplus.com', 'admin123', 'admin'),
  ('Maria Recepção', 'recepcao@cliniplus.com', '123456', 'receptionist'),
  ('Ana Assistente', 'assistente@cliniplus.com', '123456', 'assistant');

-- ---------- Realtime ----------

alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.doctors;
alter publication supabase_realtime add table public.offices;
alter publication supabase_realtime add table public.doctor_types;
alter publication supabase_realtime add table public.system_users;
alter publication supabase_realtime add table public.queue_rules;
alter publication supabase_realtime add table public.medical_records;
alter publication supabase_realtime add table public.prescriptions;