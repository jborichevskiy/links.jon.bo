import { Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "./config";
import { getDb } from "./db/schema";
import web from "./routes/web";
import feed from "./routes/feed";
import webhook from "./routes/webhook";

// Initialize database on startup
getDb();

const app = new Hono();

app.use("*", logger());

// Mount routes
app.route("/", web);
app.route("/", feed);
app.route("/", webhook);

// Health check
app.get("/health", (c) => c.json({ ok: true }));

console.log(`Starting server on ${config.host}:${config.port}`);

export default {
  port: config.port,
  hostname: config.host,
  fetch: app.fetch,
};
