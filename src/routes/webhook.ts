import { Hono } from "hono";
import { config } from "../config";
import { insertLink, updateLink } from "../db/queries";
import { fetchMetadata } from "../lib/metadata";
import { sendMessage, parseMessage } from "../lib/telegram";

const webhook = new Hono();

webhook.post("/webhook/telegram", async (c) => {
  // Verify webhook secret
  const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== config.telegram.webhookSecret) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const update = await c.req.json();
  const message = update.message;

  if (!message?.text) {
    return c.json({ ok: true });
  }

  const userId = String(message.from?.id);
  const chatId = String(message.chat.id);
  console.log(`[telegram] from user_id=${userId} chat_id=${chatId} username=${message.from?.username || "?"} text="${message.text.slice(0, 80)}"`);

  if (!config.telegram.allowedUsers.includes(userId)) {
    await sendMessage(message.chat.id, "Sorry, you're not authorized to submit links.");
    return c.json({ ok: true });
  }

  const parsed = parseMessage(message.text, message.entities || []);
  if (!parsed) {
    await sendMessage(message.chat.id, "No URLs found in your message. Send me a link!");
    return c.json({ ok: true });
  }

  const { url, via, note } = parsed;

  // Save to database
  const link = insertLink({
    url,
    via,
    note,
    source: "telegram",
    telegram_message_id: message.message_id,
  });

  // Fetch metadata in background and update
  fetchMetadata(url).then((meta) => {
    updateLink(link.id, {
      title: meta.title,
      description: meta.description,
      image_url: meta.image_url,
      site_name: meta.site_name,
    });
  });

  await sendMessage(message.chat.id, `Saved: ${url}`);

  return c.json({ ok: true });
});

export default webhook;
