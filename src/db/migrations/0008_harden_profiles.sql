-- Security hardening for the `profiles` table.
--
-- C1: RLS only scopes WHICH row a user may update (id = auth.uid()), not WHICH
-- columns. With the public anon key, an authenticated user could PATCH their own
-- row and set is_admin/is_banned/points directly (admin takeover + unlimited
-- points). Column-level privileges are enforced *in addition* to RLS, so
-- revoking write access to the privileged columns from the user-facing roles
-- closes the hole. Legitimate writes all go through the service-role client
-- (createAdminClient), which is unaffected by these grants.

revoke insert (is_admin, is_banned, points, current_streak, longest_streak, last_completion_date)
  on public.profiles from authenticated;
revoke update (is_admin, is_banned, points, current_streak, longest_streak, last_completion_date)
  on public.profiles from authenticated;

revoke insert (is_admin, is_banned, points, current_streak, longest_streak, last_completion_date)
  on public.profiles from anon;
revoke update (is_admin, is_banned, points, current_streak, longest_streak, last_completion_date)
  on public.profiles from anon;

-- H1: atomic, balance-checked point spend. A single statement is the authority
-- on the balance, so concurrent rerolls can't read the same balance and all
-- pass an app-side check (double-spend). Returns the new balance, or NULL when
-- the user can't afford the amount. Called only via the service-role client.
create or replace function public.spend_points(p_user uuid, p_amount int)
returns int
language sql
as $$
  update public.profiles
     set points = points - p_amount
   where id = p_user
     and points >= p_amount
  returning points;
$$;
