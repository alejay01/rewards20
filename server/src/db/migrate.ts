import { migrate } from "drizzle-orm/mysql2/migrator";
import { db, pool } from "./index";
import path from "path";

async function main() {
  console.log("Running migrations...");
  
  // Resolve migrations path dynamically whether we are running in tsx (src/db/migrate.ts) or compiled node (dist/db/migrate.js)
  const isCompiled = __filename.endsWith(".js") || !__filename.includes("src");
  const migrationsFolder = isCompiled
    ? path.resolve(__dirname, "../migrations") // dist/db/migrate.js -> dist/migrations (which copy-public copies)
    : path.resolve(__dirname, "../../migrations"); // src/db/migrate.ts -> migrations

  console.log(`Looking for migrations in: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully!");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

main();
