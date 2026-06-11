import { z } from "zod";

/**
 * Public env — safe to read in the browser. Only NEXT_PUBLIC_* keys.
 * Validated at module load so a misconfigured deploy fails fast.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const publicParsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!publicParsed.success) {
  // Surface a clear, named error instead of Next's opaque "Failed to collect
  // page data". Each line names the offending var (missing or not a valid URL).
  const details = publicParsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid or missing public environment variables:\n${details}\n` +
      `Set them in your host (Vercel → Settings → Environment Variables, scope: ` +
      `Production) and trigger a fresh build. NEXT_PUBLIC_APP_URL must include https://.`,
  );
}

export const publicEnv = publicParsed.data;

/**
 * Server-only env. NEVER import this from a client component.
 * Lazily validated so the public bundle never trips over missing secrets.
 */
// Treat an empty string the same as unset (the .env.example ships the key blank).
const optionalSecret = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().min(1).optional(),
);

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MODERATION_API_KEY: optionalSecret, // legacy/generic; unused with Sightengine
  SIGHTENGINE_API_USER: optionalSecret,
  SIGHTENGINE_API_SECRET: optionalSecret,
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must never be called in the browser");
  }
  if (!cachedServerEnv) {
    cachedServerEnv = serverSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      MODERATION_API_KEY: process.env.MODERATION_API_KEY,
    });
  }
  return cachedServerEnv;
}
