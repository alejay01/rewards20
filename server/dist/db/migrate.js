"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const migrator_1 = require("drizzle-orm/mysql2/migrator");
const index_1 = require("./index");
const path_1 = __importDefault(require("path"));
async function main() {
    console.log("Running migrations...");
    // Resolve migrations path dynamically whether we are running in tsx (src/db/migrate.ts) or compiled node (dist/db/migrate.js)
    const isCompiled = __filename.endsWith(".js") || !__filename.includes("src");
    const migrationsFolder = isCompiled
        ? path_1.default.resolve(__dirname, "../migrations") // dist/db/migrate.js -> dist/migrations (which copy-public copies)
        : path_1.default.resolve(__dirname, "../../migrations"); // src/db/migrate.ts -> migrations
    console.log(`Looking for migrations in: ${migrationsFolder}`);
    try {
        await (0, migrator_1.migrate)(index_1.db, { migrationsFolder });
        console.log("Migrations applied successfully!");
        await index_1.pool.end();
        process.exit(0);
    }
    catch (error) {
        console.error("Migration failed:", error);
        await index_1.pool.end();
        process.exit(1);
    }
}
main();
