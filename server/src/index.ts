import dotenv from "dotenv";
dotenv.config({ override: true });

import { app } from "./app";
import { db, pool } from "./db";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import fs from "fs";
import { roles, permissions, rolePermissions } from "./db/schema";
import { eq, and } from "drizzle-orm";

const PORT = process.env.PORT || 3001;

async function ensureManagerPermissions() {
  try {
    console.log("Self-healing check: Verifying Manager and Administrator role permissions...");
    
    // Fetch all roles
    const dbRoles = await db.select().from(roles);
    const managerRole = dbRoles.find(r => r.name === "Manager");
    const adminRole = dbRoles.find(r => r.name === "Administrator");
    
    if (!managerRole) {
      console.warn("Manager role not found in database. Skipping permission healing.");
      return;
    }
    
    // Fetch all permissions
    const dbPerms = await db.select().from(permissions);
    if (dbPerms.length === 0) {
      console.warn("No permissions found in database. Skipping permission healing.");
      return;
    }
    
    // Ensure all permissions are mapped to Manager role
    let managerInsertedCount = 0;
    for (const perm of dbPerms) {
      const existing = await db.select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, managerRole.id),
            eq(rolePermissions.permissionId, perm.id)
          )
        );
        
      if (existing.length === 0) {
        await db.insert(rolePermissions).values({
          roleId: managerRole.id,
          permissionId: perm.id
        });
        managerInsertedCount++;
      }
    }
    
    if (managerInsertedCount > 0) {
      console.log(`Successfully mapped ${managerInsertedCount} missing permissions to Manager role (total permissions: ${dbPerms.length}).`);
    } else {
      console.log("Manager role permissions are already fully up to date!");
    }

    // Ensure all permissions are mapped to Administrator role as well
    if (adminRole) {
      let adminInsertedCount = 0;
      for (const perm of dbPerms) {
        const existing = await db.select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, adminRole.id),
              eq(rolePermissions.permissionId, perm.id)
            )
          );
          
        if (existing.length === 0) {
          await db.insert(rolePermissions).values({
            roleId: adminRole.id,
            permissionId: perm.id
          });
          adminInsertedCount++;
        }
      }
      if (adminInsertedCount > 0) {
        console.log(`Successfully mapped ${adminInsertedCount} missing permissions to Administrator role.`);
      }
    }
  } catch (error: any) {
    console.error("Error during self-healing permission check:", error.message || error);
  }
}

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
    
    // Run self-healing check to fix any missing role permissions
    await ensureManagerPermissions();
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
