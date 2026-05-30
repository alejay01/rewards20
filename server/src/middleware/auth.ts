import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { staffUsers, roles, rolePermissions, permissions } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "boudin-boss-rewards-secret-key-2026!";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    roleId: number;
    permissions: string[];
  };
}

// 1. Authenticate Token Middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check header OR cookies
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader && authHeader.split(" ")[1];
  const tokenFromCookie = req.cookies?.token;
  
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Safety check: verify staff member is still active in the database
    const staffList = await db.select()
      .from(staffUsers)
      .where(eq(staffUsers.id, decoded.id));
      
    if (staffList.length === 0 || !staffList[0].active) {
      return res.status(403).json({ error: "Your account is deactivated or invalid." });
    }

    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      roleId: decoded.roleId,
      permissions: decoded.permissions || []
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

// 2. Require Specific Role Middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden. Insufficient permissions." });
    }

    next();
  };
};

// 3. Require Specific Granular Permission Middleware
export const requirePermission = (permissionKey: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    // Admins and Managers have automatic full access bypass
    if (
      req.user.permissions.includes("full_access") || 
      req.user.role === "Administrator" || 
      req.user.role === "Manager"
    ) {
      return next();
    }

    if (!req.user.permissions.includes(permissionKey)) {
      return res.status(403).json({ error: `Forbidden. Missing permission: ${permissionKey}` });
    }

    next();
  };
};
