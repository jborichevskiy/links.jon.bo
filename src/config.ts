export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || "0.0.0.0",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  dbPath: process.env.DB_PATH || "./data/links.db",

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
    channelId: process.env.TELEGRAM_CHANNEL_ID || "",
    allowedUsers: (process.env.TELEGRAM_ALLOWED_USERS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  },

  apiKey: process.env.API_KEY || "",
};
