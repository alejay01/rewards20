import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
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
