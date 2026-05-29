"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
// Route imports
const auth_1 = __importDefault(require("./api/auth"));
const customers_1 = __importDefault(require("./api/customers"));
const tablet_1 = __importDefault(require("./api/tablet"));
const admin_1 = __importDefault(require("./api/admin"));
const receipts_1 = __importDefault(require("./api/receipts"));
const qr_1 = __importDefault(require("./api/qr"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
exports.app = app;
// Basic Security Configurations
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: clientUrl,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// 1. Health & Version Routes (Step 28)
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || "development",
        dbConnection: "active"
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
app.use("/api/auth", auth_1.default);
app.use("/api/customers", customers_1.default);
app.use("/api/tablet", tablet_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/receipt-claims", receipts_1.default);
app.use("/api/qr", qr_1.default);
// 3. Static Client serving (Production monolith architecture)
const publicPath = path_1.default.join(__dirname, "public");
app.use(express_1.default.static(publicPath));
// Wildcard fallback serves index.html for React Router compatibility
app.get("*", (req, res, next) => {
    // If it's an API route that wasn't matched, skip to 404
    if (req.url.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
    }
    const indexPath = path_1.default.join(publicPath, "index.html");
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
app.use(errorHandler_1.errorHandler);
exports.default = app;
