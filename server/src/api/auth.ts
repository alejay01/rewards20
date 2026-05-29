import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { staffUsers, roles, rolePermissions, permissions } from "../db/schema";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import { logAudit } from "../utils/audit";
import rateLimit from "express-rate-limit";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "boudin-boss-rewards-secret-key-2026!";

// Rate limiter for login endpoint to prevent brute-force attacks
const loginLimiter = rateLimit({
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
    const users = await db.select().from(staffUsers).where(eq(staffUsers.email, email));
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = users[0];

    if (!user.active) {
      return res.status(403).json({ error: "This staff account is deactivated." });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Fetch Role Name and permissions
    const staffRoleList = await db.select().from(roles).where(eq(roles.id, user.roleId));
    const roleName = staffRoleList[0]?.name || "Team Member";

    // Fetch granular permissions
    const mappedPerms = await db.select({
      key: permissions.key
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, user.roleId));

    const permissionsArray = mappedPerms.map(p => p.key);

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleName,
        roleId: user.roleId,
        permissions: permissionsArray
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Set secure HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      sameSite: "lax"
    });

    // Log the successful login to audits
    await logAudit(req, {
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
        permissions: permissionsArray
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. Staff Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Successfully logged out." });
});

// 3. Get Current User Info
router.get("/me", authenticateToken, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// 4. Change Password
router.post("/change-password", authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required." });
    }

    if (!req.user) return res.status(401).json({ error: "Unauthorized." });

    const users = await db.select().from(staffUsers).where(eq(staffUsers.id, req.user.id));
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = users[0];

    // Verify old password
    const isPasswordValid = bcrypt.compareSync(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect old password." });
    }

    // Hash new password
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    await db.update(staffUsers)
      .set({ passwordHash: newPasswordHash })
      .where(eq(staffUsers.id, user.id));

    // Audit action
    await logAudit(req, {
      action: "STAFF_PASSWORD_CHANGED",
      reason: `Staff user ${user.name} updated password.`
    });

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
