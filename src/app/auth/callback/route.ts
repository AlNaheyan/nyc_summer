import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profiles/service";

/**
 * OAuth callback: exchange the code for a session, then route the user to
 * onboarding (no profile yet) or the spin home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam || !code) {
    // User cancelled or provider errored — back to login, non-blocking.
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const profile = await getProfile(supabase, data.user.id);
  return NextResponse.redirect(`${origin}${profile ? "/spin" : "/onboarding"}`);
}
