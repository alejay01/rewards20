"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
const app_1 = require("./app");
const db_1 = require("./db");
const migrator_1 = require("drizzle-orm/mysql2/migrator");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const PORT = process.env.PORT || 3001;
async function ensureManagerPermissions() {
    try {
        console.log("Self-healing check: Verifying Manager and Administrator role permissions...");
        // Fetch all roles
        const dbRoles = await db_1.db.select().from(schema_1.roles);
        const managerRole = dbRoles.find(r => r.name === "Manager");
        const adminRole = dbRoles.find(r => r.name === "Administrator");
        if (!managerRole) {
            console.warn("Manager role not found in database. Skipping permission healing.");
            return;
        }
        // Fetch all permissions
        const dbPerms = await db_1.db.select().from(schema_1.permissions);
        if (dbPerms.length === 0) {
            console.warn("No permissions found in database. Skipping permission healing.");
            return;
        }
        // Ensure all permissions are mapped to Manager role
        let managerInsertedCount = 0;
        for (const perm of dbPerms) {
            const existing = await db_1.db.select()
                .from(schema_1.rolePermissions)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, managerRole.id), (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, perm.id)));
            if (existing.length === 0) {
                await db_1.db.insert(schema_1.rolePermissions).values({
                    roleId: managerRole.id,
                    permissionId: perm.id
                });
                managerInsertedCount++;
            }
        }
        if (managerInsertedCount > 0) {
            console.log(`Successfully mapped ${managerInsertedCount} missing permissions to Manager role (total permissions: ${dbPerms.length}).`);
        }
        else {
            console.log("Manager role permissions are already fully up to date!");
        }
        // Ensure all permissions are mapped to Administrator role as well
        if (adminRole) {
            let adminInsertedCount = 0;
            for (const perm of dbPerms) {
                const existing = await db_1.db.select()
                    .from(schema_1.rolePermissions)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, adminRole.id), (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, perm.id)));
                if (existing.length === 0) {
                    await db_1.db.insert(schema_1.rolePermissions).values({
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
    }
    catch (error) {
        console.error("Error during self-healing permission check:", error.message || error);
    }
}
async function startServer() {
    console.log("===============================================");
    console.log("Starting server & verifying database status...");
    // Resilient migrations folder resolution
    let migrationsFolder = path_1.default.resolve(process.cwd(), "migrations");
    // Fallback checks
    if (!fs_1.default.existsSync(migrationsFolder)) {
        const parentMigrations = path_1.default.resolve(__dirname, "../migrations");
        if (fs_1.default.existsSync(parentMigrations)) {
            migrationsFolder = parentMigrations;
        }
        else {
            const inlineMigrations = path_1.default.resolve(__dirname, "migrations");
            if (fs_1.default.existsSync(inlineMigrations)) {
                migrationsFolder = inlineMigrations;
            }
        }
    }
    console.log(`Resolved migrations folder: ${migrationsFolder}`);
    try {
        if (fs_1.default.existsSync(migrationsFolder)) {
            console.log("Running pending database migrations...");
            await (0, migrator_1.migrate)(db_1.db, { migrationsFolder });
            console.log("Database migrations applied/verified successfully!");
        }
        else {
            console.warn("WARNING: Migrations folder not found! Auto-migration skipped.");
        }
        // Run self-healing check to fix any missing role permissions
        await ensureManagerPermissions();
    }
    catch (error) {
        console.error("===============================================");
        console.error("Auto-migration during startup encountered an error:");
        console.error(error.message || error);
        console.error("Continuing server startup so /health diagnostics are available.");
        console.log("===============================================");
    }
    const server = app_1.app.listen(PORT, () => {
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
            await db_1.pool.end();
            console.log("Server closed.");
            process.exit(0);
        });
    };
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
}
startServer();
