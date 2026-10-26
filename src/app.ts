import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { env } from "./config/env.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
app.disable("x-powered-by");

app.use(cors({
  origin: env.frontendOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "100kb" }));

app.use((req, _res, next) => {
  if (!env.isProduction) {
    console.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
