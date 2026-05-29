"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    // 1. Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: "Validation failed.",
            details: err.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message
            }))
        });
    }
    // 2. Default System Errors
    console.error("Unhandle Exception:", err);
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "An unexpected error occurred on the server.";
    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
