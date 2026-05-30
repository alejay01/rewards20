"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.requirePasswordAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const JWT_SECRET = process.env.JWT_SECRET || "boudin-boss-rewards-secret-key-2026!";
// 1. Authenticate Token Middleware
const authenticateToken = async (req, res, next) => {
    // Check header OR cookies
    const authHeader = req.headers["authorization"];
    const tokenFromHeader = authHeader && authHeader.split(" ")[1];
    const tokenFromCookie = req.cookies?.token;
    const token = tokenFromHeader || tokenFromCookie;
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Safety check: verify staff member is still active in the database
        const staffList = await db_1.db.select()
            .from(schema_1.staffUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.staffUsers.id, decoded.id));
        if (staffList.length === 0 || !staffList[0].active) {
            return res.status(403).json({ error: "Your account is deactivated or invalid." });
        }
        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            roleId: decoded.roleId,
            permissions: decoded.permissions || [],
            authMethod: decoded.authMethod || "password"
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};
exports.authenticateToken = authenticateToken;
// 1.5 Require Password Authentication Middleware (Block PIN logins from accessing Admin portal)
const requirePasswordAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }
    if (req.user.authMethod === "pin") {
        return res.status(403).json({
            error: "FULL_AUTH_REQUIRED",
            message: "Full email & password login is required to access the Admin Dashboard."
        });
    }
    next();
};
exports.requirePasswordAuth = requirePasswordAuth;
// 2. Require Specific Role Middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required." });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
        }
        next();
    };
};
exports.requireRole = requireRole;
// 3. Require Specific Granular Permission Middleware
const requirePermission = (permissionKey) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required." });
        }
        // Admins and Managers have automatic full access bypass
        if (req.user.permissions.includes("full_access") ||
            req.user.role === "Administrator" ||
            req.user.role === "Manager") {
            return next();
        }
        if (!req.user.permissions.includes(permissionKey)) {
            return res.status(403).json({ error: `Forbidden. Missing permission: ${permissionKey}` });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
