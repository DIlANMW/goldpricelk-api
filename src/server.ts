import app from "./app.js";
import { env } from "./config/env.js";
import db from "./config/database.js";

const server = app.listen(env.port, env.host, () => {
  console.info(`GoldPriceLK API listening on http://${env.host}:${env.port}`);
  console.info(`Environment: ${env.nodeEnv}`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`${signal} received. Shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out.");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close((error) => {
    try {
      db.close();
    } catch (dbError) {
      console.error("Database close failed:", dbError);
      process.exitCode = 1;
    }

    if (error) {
      console.error("HTTP server close failed:", error);
      process.exitCode = 1;
    }

    clearTimeout(forceExit);
    process.exit();
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
