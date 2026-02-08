import { config } from "../config";

const webhookUrl = `${config.baseUrl}/webhook/telegram`;

async function setWebhook() {
  const url = `https://api.telegram.org/bot${config.telegram.botToken}/setWebhook`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: config.telegram.webhookSecret,
      allowed_updates: ["message"],
    }),
  });

  const data = await res.json();
  console.log("Set webhook to:", webhookUrl);
  console.log("Response:", JSON.stringify(data, null, 2));
}

setWebhook();
