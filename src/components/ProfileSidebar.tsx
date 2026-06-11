import type { Profile } from "@/lib/types";
import { BADGES } from "@/lib/gamification/badges";
import { Avatar, handleFor } from "./Avatar";
import { SignOutButton } from "./SignOutButton";

interface Props {
  profile: Profile;
  earnedBadges: string[];
}

export function ProfileSidebar({ profile, earnedBadges }: Props) {
  const earned = new Set(earnedBadges);

  return (
    <div className="p-4 lg:p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-full bg-gradient-to-br from-sun-soft to-coral-soft p-1 shadow-clay">
          <Avatar name={profile.display_name} url={profile.avatar_url} size={56} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold leading-tight">{profile.display_name}</p>
          <p className="truncate text-sm text-foreground/45">{handleFor(profile.display_name)}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat label="Points" value={profile.points} tint="coral" />
        <Stat label="Streak" value={`${profile.current_streak}🔥`} tint="sun" />
        <Stat label="Best" value={profile.longest_streak} tint="sky" />
      </div>

      <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold">
        <span aria-hidden>🏅</span> Badges
      </h2>
      <ul className="grid grid-cols-3 gap-2">
        {BADGES.map((badge, i) => {
          const has = earned.has(badge.id);
          return (
            <li
              key={badge.id}
              title={badge.description}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-center transition-transform duration-200 ${
                has
                  ? "border-white bg-gradient-to-br from-sun-soft to-sun/40 shadow-clay hover:-translate-y-0.5 hover:rotate-2"
                  : "border-dashed border-foreground/15 bg-white/50"
              }`}
              style={has ? { transform: `rotate(${(i % 3) - 1}deg)` } : undefined}
            >
              <span
                className="text-2xl"
                aria-hidden
                style={{ filter: has ? "none" : "grayscale(1)", opacity: has ? 1 : 0.4 }}
              >
                {badge.icon ?? "🏅"}
              </span>
              <span className="text-[10px] font-bold leading-tight">{badge.name}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-2">
        {profile.is_admin && (
          <a
            href="/admin"
            className="rounded-full bg-foreground/5 py-2.5 text-center text-sm font-bold text-foreground/70 transition hover:bg-foreground/10"
          >
            🛡️ Moderation queue
          </a>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}

const STAT_TINT = {
  coral: "text-coral",
  sun: "text-sun",
  sky: "text-sky",
} as const;

function Stat({
  label,
  value,
  tint,
}: {
  label: string;
  value: string | number;
  tint: keyof typeof STAT_TINT;
}) {
  return (
    <div className="rounded-2xl border-2 border-white bg-white p-3 text-center shadow-clay">
      <div className={`font-display text-xl font-bold ${STAT_TINT[tint]}`}>{value}</div>
      <div className="text-[11px] font-semibold text-foreground/55">{label}</div>
    </div>
  );
}
