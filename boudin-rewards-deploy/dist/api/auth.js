"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../utils/audit");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "boudin-boss-rewards-secret-key-2026!";
// Rate limiter for login endpoint to prevent brute-force attacks
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: { error: "Too many login attempts, please try again after 15 minutes." }
});
// 1. Staff Login
router.post("/login", loginLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }
        // Lookup staff user
        const users = await db_1.db.select().from(schema_1.staffUsers).where((0, drizzle_orm_1.eq)(schema_1.staffUsers.email, email));
        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }
        const user = users[0];
        if (!user.active) {
            return res.status(403).json({ error: "This staff account is deactivated." });
        }
        // Verify password
        const isPasswordValid = bcryptjs_1.default.compareSync(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password." });
        }
        // Fetch Role Name and permissions
        const staffRoleList = await db_1.db.select().from(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, user.roleId));
        const roleName = staffRoleList[0]?.name || "Team Member";
        // Fetch granular permissions
        const mappedPerms = await db_1.db.select({
            key: schema_1.permissions.key
        })
            .from(schema_1.rolePermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, user.roleId));
        const permissionsArray = mappedPerms.map(p => p.key);
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleName,
            roleId: user.roleId,
            permissions: permissionsArray,
            authMethod: "password"
        }, JWT_SECRET, { expiresIn: "8h" });
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            sameSite: "lax"
        });
        // Log the successful login to audits
        await (0, audit_1.logAudit)(req, {
            action: "STAFF_LOGIN",
            reason: `Staff user logged in: ${user.name} (${roleName})`
        });
        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
                permissions: permissionsArray,
                authMethod: "password"
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Rate limiter for PIN login to prevent brute-force attacks
const pinLoginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 attempts
    message: { error: "Too many PIN attempts. Please try again after 5 minutes." }
});
// 1.5 Staff PIN Login (For quick-access counter tablet bootstrapper)
router.post("/pin-login", pinLoginLimiter, async (req, res, next) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ error: "PIN code is required." });
        }
        // Since PINs are 4 digits and hashed, scan active staff users in the database
        const staff = await db_1.db.select().from(schema_1.staffUsers).where((0, drizzle_orm_1.eq)(schema_1.staffUsers.active, true));
        let matchingUser = null;
        for (const member of staff) {
            if (member.pinHash) {
                const match = bcryptjs_1.default.compareSync(pin, member.pinHash);
                if (match) {
                    matchingUser = member;
                    break;
                }
            }
        }
        if (!matchingUser) {
            return res.status(401).json({ error: "Invalid PIN code." });
        }
        const user = matchingUser;
        // Fetch Role Name and permissions
        const staffRoleList = await db_1.db.select().from(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, user.roleId));
        const roleName = staffRoleList[0]?.name || "Team Member";
        // Fetch granular permissions
        const mappedPerms = await db_1.db.select({
            key: schema_1.permissions.key
        })
            .from(schema_1.rolePermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, user.roleId));
        const permissionsArray = mappedPerms.map(p => p.key);
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleName,
            roleId: user.roleId,
            permissions: permissionsArray,
            authMethod: "pin"
        }, JWT_SECRET, { expiresIn: "8h" });
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
            sameSite: "lax"
        });
        // Log the successful quick login to audits
        await (0, audit_1.logAudit)(req, {
            action: "STAFF_PIN_LOGIN",
            reason: `Staff user logged in via quick-access PIN: ${user.name} (${roleName})`
        });
        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
                permissions: permissionsArray,
                authMethod: "pin"
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 2. Staff Logout
router.post("/logout", (req, res) => {
    res.clearCookie("token");
    return res.json({ message: "Successfully logged out." });
});
// 3. Get Current User Info
router.get("/me", auth_1.authenticateToken, (req, res) => {
    return res.json({ user: req.user });
});
// 4. Change Password
router.post("/change-password", auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "Old password and new password are required." });
        }
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized." });
        const users = await db_1.db.select().from(schema_1.staffUsers).where((0, drizzle_orm_1.eq)(schema_1.staffUsers.id, req.user.id));
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        const user = users[0];
        // Verify old password
        const isPasswordValid = bcryptjs_1.default.compareSync(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Incorrect old password." });
        }
        // Hash new password
        const newPasswordHash = bcryptjs_1.default.hashSync(newPassword, 10);
        await db_1.db.update(schema_1.staffUsers)
            .set({ passwordHash: newPasswordHash })
            .where((0, drizzle_orm_1.eq)(schema_1.staffUsers.id, user.id));
        // Audit action
        await (0, audit_1.logAudit)(req, {
            action: "STAFF_PASSWORD_CHANGED",
            reason: `Staff user ${user.name} updated password.`
        });
        return res.json({ message: "Password updated successfully." });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
