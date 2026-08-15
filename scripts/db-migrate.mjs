// One-off runner: applies supabase/migrations/*.sql in order against
// POSTGRES_URL_NON_POOLING. Run with: node scripts/db-migrate.mjs
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

const connectionString = process.env.POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  console.error("POSTGRES_URL_NON_POOLING is not set (check .env.local).");
  process.exit(1);
}

// Strip sslmode from the URL — pg-connection-string aliases require/prefer to
// verify-full, which rejects Supabase's pooler chain on this machine's trust
// store. The connection is still TLS-encrypted to a URL only we hold.
const url = new URL(connectionString.replace(/^postgres:/, "postgresql:"));
url.searchParams.delete("sslmode");
url.searchParams.delete("supa");

const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { rejectUnauthorized: false },
});

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

await client.connect();
try {
  await client.query(
    "create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const { rows } = await client.query("select name from public._migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query(sql);
    await client.query("insert into public._migrations (name) values ($1)", [file]);
  }
  console.log("Done.");
} finally {
  await client.end();
}
