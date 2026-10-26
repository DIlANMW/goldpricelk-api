import "dotenv/config";
import path from "node:path";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number.");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
  host: process.env.HOST ?? "127.0.0.1",
  databasePath: path.resolve(process.env.DATABASE_PATH ?? "./data/goldpricelk.db"),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  isProduction: process.env.NODE_ENV === "production",
} as const;
