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
async function ensureAuthorizedDevicesTable() {
    try {
        console.log("Self-healing check: Verifying authorized_devices table...");
        await db_1.db.execute((0, drizzle_orm_1.sql) `
      CREATE TABLE IF NOT EXISTS authorized_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_name VARCHAR(100) NOT NULL,
        device_fingerprint VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        device_type VARCHAR(50),
        operating_system VARCHAR(50),
        browser_name VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        last_ip VARCHAR(45),
        user_agent VARCHAR(255),
        allow_remote BOOLEAN DEFAULT false NOT NULL,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log("authorized_devices table verified/created successfully.");
    }
    catch (error) {
        console.error("Error verifying authorized_devices table:", error.message || error);
    }
}
async function ensureSecuritySettings() {
    try {
        console.log("Self-healing check: Verifying and seeding default settings...");
        const keys = [
            { key: "security_ip_whitelist", value: "127.0.0.1", description: "Comma-separated list of allowed IP addresses for remote staff bypass" },
            { key: "security_geofence_enabled", value: "true", description: "Enables geofencing restriction for cashier tablet clock-ins" },
            { key: "security_geofence_lat", value: "29.5580", description: "Target store latitude coordinate (Rosenberg location)" },
            { key: "security_geofence_lng", value: "-95.8083", description: "Target store longitude coordinate (Rosenberg location)" },
            { key: "security_geofence_radius", value: "1000", description: "Allowed clock-in geofence radius in feet around the store coordinates" },
            { key: "pwa_marketing_radius", value: "1.5", description: "Marketing radius in miles to trigger geofenced specials alerts to PWA customers" },
            { key: "pwa_marketing_alert_message", value: "Fresh Boudin hot off the smoker today! Double points on any Boudin Links basket!", description: "Cajun Special Message for geofenced push alerts" },
            { key: "pwa_marketing_enabled", value: "true", description: "Enables client PWA geofence notifications" }
        ];
        for (const item of keys) {
            const existing = await db_1.db.select().from(schema_1.settings).where((0, drizzle_orm_1.eq)(schema_1.settings.key, item.key));
            if (existing.length === 0) {
                await db_1.db.insert(schema_1.settings).values({
                    key: item.key,
                    value: item.value,
                    description: item.description
                });
                console.log(`Seeded setting: ${item.key}`);
            }
        }
    }
    catch (error) {
        console.error("Error during settings seeding:", error.message || error);
    }
}
async function startServer() {
    console.log("===============================================");
    console.log("Starting server & verifying database status...");
    try {
        // Perform self-healing database table checks before anything else
        await ensureAuthorizedDevicesTable();
        await ensureSecuritySettings();
    }
    catch (e) {
        console.error("Database self-healing checks skipped or failed:", e.message || e);
    }
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
