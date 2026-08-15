import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Service-role client — server-only, never import from client components.
// Used only to create pre-confirmed accounts on signup (see actions.ts),
// so real users aren't blocked by Supabase's shared dev-mailer rate limit
// for a closed, invite-only team app where email verification adds no
// meaningful security value.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
