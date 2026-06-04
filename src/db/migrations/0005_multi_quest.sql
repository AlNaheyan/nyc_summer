-- Multiple quests per day + per-slot completion tracking (gameplay update).
-- A user can now spin up to 3 quests a day; each is its own slot row.

alter table public.daily_quests add column if not exists slot int not null default 1;
alter table public.daily_quests add column if not exists completed boolean not null default false;

-- Replace the one-row-per-day unique constraint with one-per-slot.
alter table public.daily_quests drop constraint if exists daily_quests_user_id_quest_date_key;
alter table public.daily_quests
  add constraint daily_quests_user_date_slot_key unique (user_id, quest_date, slot);

-- Backfill: mark a slot completed if a completion already exists for it.
update public.daily_quests dq
set completed = true
where exists (
  select 1 from public.completions c
  where c.user_id = dq.user_id
    and c.quest_template_id = dq.quest_template_id
);
