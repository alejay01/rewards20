import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Route imports
import authRouter from "./api/auth";
import customersRouter from "./api/customers";
import tabletRouter from "./api/tablet";
import adminRouter from "./api/admin";
import receiptsRouter from "./api/receipts";
import qrRouter from "./api/qr";

import { errorHandler } from "./middleware/errorHandler";
import { validateSecurityAccess } from "./middleware/auth";

const app = express();

// Basic Security Configurations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "images.unsplash.com", "*"], // Allow images for food cards
      connectSrc: ["'self'", "*"]
    }
  }
}));

// CORS setup (safe credentials configuration)
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
  origin: clientUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(validateSecurityAccess);

// 1. Health & Version Routes (Step 28)
app.get("/health", async (req, res) => {
  let dbStatus = "active";
  try {
    // Perform a real connection check query
    await db.execute(sql`SELECT 1`);
  } catch (error: any) {
    dbStatus = `error: ${error.message}`;
  }

  res.json({
    status: dbStatus.startsWith("error") ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "production",
    dbConnection: dbStatus
  });
});

app.get("/version", (req, res) => {
  res.json({
    version: "1.0.0",
    projectName: "The Boudin Company Rewards",
    codename: "Boudin Boss Rewards MVP",
    releasedAt: "2026-05-27"
  });
});

// 2. API Routes Mapping
app.use("/api/auth", authRouter);
app.use("/api/customers", customersRouter);
app.use("/api/tablet", tabletRouter);
app.use("/api/admin", adminRouter);
app.use("/api/receipt-claims", receiptsRouter);
app.use("/api/qr", qrRouter);

// 3. Static Client serving (Production monolith architecture)
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Wildcard fallback serves index.html for React Router compatibility
app.get("*", (req, res, next) => {
  // If it's an API route that wasn't matched, skip to 404
  if (req.url.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  const indexPath = path.join(publicPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In development or if React is not built yet, return a helpful notice
      res.status(200).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #1E2022; color: white;">
            <h1 style="color: #E02A30;">Boudin Boss Rewards MVP</h1>
            <p>API Server is running successfully. Frontend React bundle is not built yet.</p>
            <p>Run <code>npm run build</code> at root to compile frontend, or start dev server.</p>
          </body>
        </html>
      `);
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export { app };
export default app;
