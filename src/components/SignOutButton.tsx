"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={signOut}
      className="text-sm font-medium text-foreground/50 underline-offset-2 hover:underline"
    >
      Sign out
    </button>
  );
}
