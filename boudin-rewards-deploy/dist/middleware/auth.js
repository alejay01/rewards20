"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSecurityAccess = exports.requirePermission = exports.requireRole = exports.requirePasswordAuth = exports.authenticateToken = void 0;
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
// 4. Global Security Firewall Middleware (IP / MAC Fingerprint / Geofence Whitelist)
const validateSecurityAccess = async (req, res, next) => {
    // Bypassed/disabled for now as requested by user
    next();
    return;
    const path = req.path;
    const isStaffRoute = path.startsWith("/api/admin") || path.startsWith("/api/tablet") || path.startsWith("/api/auth");
    if (!isStaffRoute) {
        return next();
    }
    // Bypass health/version/logout
    if (path === "/api/auth/logout" || path === "/api/auth/me" || path === "/health" || path === "/version") {
        return next();
    }
    const fingerprint = req.headers["x-device-fingerprint"];
    const lat = req.headers["x-latitude"];
    const lng = req.headers["x-longitude"];
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();
    const ua = req.headers["user-agent"] || "";
    if (!fingerprint) {
        return res.status(403).json({
            error: "MISSING_FINGERPRINT",
            message: "Security Access Control: Device fingerprint is missing. Please register this device."
        });
    }
    // User-Agent parser for OS, Browser, Device Type
    let operatingSystem = "Unknown OS";
    if (ua.includes("Windows"))
        operatingSystem = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS"))
        operatingSystem = "macOS";
    else if (ua.includes("iPad"))
        operatingSystem = "iOS (iPad)";
    else if (ua.includes("iPhone"))
        operatingSystem = "iOS (iPhone)";
    else if (ua.includes("Android"))
        operatingSystem = "Android";
    else if (ua.includes("Linux"))
        operatingSystem = "Linux";
    let browserName = "Unknown Browser";
    if (ua.includes("Firefox"))
        browserName = "Firefox";
    else if (ua.includes("Chrome") && !ua.includes("Chromium"))
        browserName = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
        browserName = "Safari";
    else if (ua.includes("Edge"))
        browserName = "Edge";
    let deviceType = "Desktop";
    if (ua.includes("iPad") || (ua.includes("Macintosh") && "ontouchend" in global))
        deviceType = "Tablet";
    else if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone"))
        deviceType = "Phone";
    try {
        // Bootstrap: if zero approved devices, auto-approve this first one
        const countApproved = await db_1.db.select().from(schema_1.authorizedDevices).where((0, drizzle_orm_1.eq)(schema_1.authorizedDevices.status, 'approved'));
        if (countApproved.length === 0) {
            await db_1.db.insert(schema_1.authorizedDevices).values({
                deviceName: "Bootstrap Primary Device",
                deviceFingerprint: fingerprint,
                status: "approved",
                deviceType,
                operatingSystem,
                browserName,
                latitude: lat ? decimalToMaybeString(lat) : null,
                longitude: lng ? decimalToMaybeString(lng) : null,
                lastIp: ip,
                userAgent: ua,
                allowRemote: true
            });
            console.log(`Auto-approved bootstrap device fingerprint: ${fingerprint}`);
        }
        // Lookup device
        const devices = await db_1.db.select().from(schema_1.authorizedDevices).where((0, drizzle_orm_1.eq)(schema_1.authorizedDevices.deviceFingerprint, fingerprint));
        if (devices.length === 0) {
            // Auto-register unregistered device as pending
            await db_1.db.insert(schema_1.authorizedDevices).values({
                deviceName: `${operatingSystem} ${deviceType} (${browserName})`,
                deviceFingerprint: fingerprint,
                status: "pending",
                deviceType,
                operatingSystem,
                browserName,
                latitude: lat ? decimalToMaybeString(lat) : null,
                longitude: lng ? decimalToMaybeString(lng) : null,
                lastIp: ip,
                userAgent: ua,
                allowRemote: false
            });
            return res.status(403).json({
                error: "DEVICE_PENDING_APPROVAL",
                message: "This device is registered and pending administrator approval. Please ask an admin to authorize it in the Security Access panel."
            });
        }
        const device = devices[0];
        // Update last IP and user agent in background
        await db_1.db.update(schema_1.authorizedDevices)
            .set({ lastIp: ip, userAgent: ua })
            .where((0, drizzle_orm_1.eq)(schema_1.authorizedDevices.id, device.id));
        if (device.status === "rejected") {
            return res.status(403).json({
                error: "DEVICE_REJECTED",
                message: "This device has been explicitly rejected/blocked from accessing administrative portals."
            });
        }
        if (device.status === "pending") {
            return res.status(403).json({
                error: "DEVICE_PENDING_APPROVAL",
                message: "This device is pending administrator approval."
            });
        }
        // Check role-based geofence
        const authHeader = req.headers["authorization"];
        const tokenFromHeader = typeof authHeader === "string" ? authHeader.split(" ")[1] : undefined;
        const tokenFromCookie = req.cookies?.token;
        const token = tokenFromHeader || tokenFromCookie;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                const isManagerOrTeam = decoded.role === "Manager" || decoded.role === "Team Member";
                if (isManagerOrTeam) {
                    // If remote access is not bypassed for this device, enforce IP or Geofence
                    if (!device.allowRemote) {
                        // Check settings
                        const dbSettings = await db_1.db.select().from(schema_1.settings);
                        const ipWhitelist = dbSettings.find(s => s.key === "security_ip_whitelist")?.value || "";
                        const isGeofenceEnabled = dbSettings.find(s => s.key === "security_geofence_enabled")?.value === "true";
                        const whitelistedIps = ipWhitelist.split(",").map(i => i.trim());
                        const isIpAllowed = whitelistedIps.includes(ip);
                        if (!isIpAllowed) {
                            if (isGeofenceEnabled) {
                                if (!lat || !lng) {
                                    return res.status(403).json({
                                        error: "LOCATION_REQUIRED",
                                        message: "Geofencing is enabled. Please grant location access in your browser to authorize your session."
                                    });
                                }
                                const storeLat = parseFloat(dbSettings.find(s => s.key === "security_geofence_lat")?.value || "29.5580");
                                const storeLng = parseFloat(dbSettings.find(s => s.key === "security_geofence_lng")?.value || "-95.8083");
                                const radiusLimit = parseFloat(dbSettings.find(s => s.key === "security_geofence_radius")?.value || "1000");
                                const clientLat = parseFloat(lat.toString());
                                const clientLng = parseFloat(lng.toString());
                                // Haversine distance in feet
                                const R = 20902231; // feet
                                const dLat = (storeLat - clientLat) * Math.PI / 180;
                                const dLon = (storeLng - clientLng) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                    Math.cos(clientLat * Math.PI / 180) * Math.cos(storeLat * Math.PI / 180) *
                                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const distance = R * c;
                                if (distance > radiusLimit) {
                                    return res.status(403).json({
                                        error: "REMOTE_ACCESS_DENIED",
                                        message: `Remote Access Denied: You are ${Math.round(distance)} ft away from the store, which exceeds the geofence limit of ${radiusLimit} ft. Remote access has not been granted to this device.`
                                    });
                                }
                            }
                            else {
                                return res.status(403).json({
                                    error: "REMOTE_ACCESS_DENIED",
                                    message: "Remote Access Denied: Your IP address is not whitelisted, and remote access has not been granted to this device."
                                });
                            }
                        }
                    }
                }
            }
            catch (jwtErr) {
                // invalid token, let standard auth handle it
            }
        }
        next();
    }
    catch (err) {
        console.error("Firewall middleware error:", err);
        return res.status(500).json({ error: "Internal security check failure." });
    }
};
exports.validateSecurityAccess = validateSecurityAccess;
// Helper to safely format decimal values for Drizzle schema insertion
function decimalToMaybeString(val) {
    if (val === null || val === undefined)
        return null;
    return val.toString();
}
