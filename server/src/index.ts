import dotenv from "dotenv";
dotenv.config({ override: true });

import { app } from "./app";
import { db, pool } from "./db";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import fs from "fs";

const PORT = process.env.PORT || 3001;

async function startServer() {
  console.log("===============================================");
  console.log("Starting server & verifying database status...");
  
  // Resilient migrations folder resolution
  let migrationsFolder = path.resolve(process.cwd(), "migrations");
  
  // Fallback checks
  if (!fs.existsSync(migrationsFolder)) {
    const parentMigrations = path.resolve(__dirname, "../migrations");
    if (fs.existsSync(parentMigrations)) {
      migrationsFolder = parentMigrations;
    } else {
      const inlineMigrations = path.resolve(__dirname, "migrations");
      if (fs.existsSync(inlineMigrations)) {
        migrationsFolder = inlineMigrations;
      }
    }
  }

  console.log(`Resolved migrations folder: ${migrationsFolder}`);

  try {
    if (fs.existsSync(migrationsFolder)) {
      console.log("Running pending database migrations...");
      await migrate(db, { migrationsFolder });
      console.log("Database migrations applied/verified successfully!");
    } else {
      console.warn("WARNING: Migrations folder not found! Auto-migration skipped.");
    }
  } catch (error: any) {
    console.error("===============================================");
    console.error("Auto-migration during startup encountered an error:");
    console.error(error.message || error);
    console.error("Continuing server startup so /health diagnostics are available.");
    console.log("===============================================");
  }

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`   Boudin Boss Rewards MVP Server is running!`);
    console.log(`   Port: http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "production"}`);
    console.log(`===============================================`);
  });

  // Handle graceful termination
  const gracefulShutdown = () => {
    console.log("Shutting down server gracefully...");
    server.close(async () => {
      console.log("Closing database connection pool...");
      await pool.end();
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

startServer();
