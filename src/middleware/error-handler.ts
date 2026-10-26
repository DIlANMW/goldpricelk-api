import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode =
    typeof err.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  if (!env.isProduction) {
    console.error(err);
  } else if (statusCode >= 500) {
    console.error("Internal server error:", err.message);
  }

  res.status(statusCode).json({
    error: {
      code: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
      message: statusCode === 500 ? "An unexpected error occurred." : err.message,
    },
  });
};
