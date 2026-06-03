"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/spin", label: "Spin", icon: "🎡" },
  { href: "/feed", label: "Feed", icon: "📸" },
  { href: "/journal", label: "Journal", icon: "📔" },
  { href: "/profile", label: "Profile", icon: "🏅" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-foreground/10 bg-white/90 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                  active ? "text-coral" : "text-foreground/50"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
