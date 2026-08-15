// One-off: create pre-confirmed test accounts via the Supabase Admin API,
// bypassing email confirmation (the shared dev mailer has a low rate limit).
// Run with: node scripts/seed-users.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (check .env.local).");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const users = [
  { email: "amatya650+aarjan@gmail.com", password: "TestPass1234", displayName: "Aarjan" },
  { email: "amatya650+trija@gmail.com", password: "TestPass1234", displayName: "Trija" },
];

for (const u of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { display_name: u.displayName },
  });
  if (error) {
    console.error(`Failed to create ${u.email}:`, error.message);
  } else {
    console.log(`Created ${u.email} (${data.user.id})`);
  }
}
