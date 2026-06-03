import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";
import { BADGES } from "@/lib/gamification/badges";
import { SignOutButton } from "@/components/SignOutButton";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = createClient();
  const profile = (await getProfile(supabase, user.id))!;

  const { data: badgeRows } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);
  const earned = new Set((badgeRows ?? []).map((b) => b.badge_id));

  return (
    <main className="px-5 pb-8 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-coral">{profile.display_name}</h1>
        <SignOutButton />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Points" value={profile.points} />
        <StatCard label="Streak" value={`${profile.current_streak}🔥`} />
        <StatCard label="Best" value={profile.longest_streak} />
      </div>

      <h2 className="mb-3 font-display text-lg font-bold">Badges</h2>
      <ul className="grid grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const has = earned.has(badge.id);
          return (
            <li
              key={badge.id}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${
                has ? "bg-sun-soft" : "bg-white/60 opacity-50"
              }`}
              title={badge.description}
            >
              <span className="text-3xl grayscale-0" aria-hidden style={{ filter: has ? "none" : "grayscale(1)" }}>
                {badge.icon ?? "🏅"}
              </span>
              <span className="text-[11px] font-medium leading-tight">{badge.name}</span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
      <div className="font-display text-2xl font-extrabold text-coral">{value}</div>
      <div className="text-xs text-foreground/55">{label}</div>
    </div>
  );
}
