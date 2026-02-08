import { config } from "../config";

const API_BASE = `https://api.telegram.org/bot${config.telegram.botToken}`;

export async function sendMessage(
  chatId: string | number,
  text: string,
  options: { parse_mode?: string; disable_web_page_preview?: boolean } = {},
): Promise<any> {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...options,
    }),
  });
  return res.json();
}

export async function publishToChannel(
  url: string,
  note?: string | null,
  via?: string | null,
): Promise<number | null> {
  if (!config.telegram.channelId) return null;

  let text = url;
  if (via) text += ` via ${via}`;
  if (note) text += `\n\n${note}`;

  const result = await sendMessage(config.telegram.channelId, text);
  return result?.result?.message_id ?? null;
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;

export interface TelegramEntity {
  type: string;
  offset: number;
  length: number;
  url?: string; // present for text_link entities
}

export interface ParsedMessage {
  url: string;
  via: string | null;
  note: string | null;
}

/**
 * Parse a Telegram message into a primary link, optional via source, and optional note.
 *
 * Handles both bare URLs and Telegram's text_link entities (hyperlinked text).
 * When someone sends "https://example.com via twitter" where "twitter" is
 * hyperlinked to a URL, Telegram sends the URL in entities, not in the text.
 */
export function parseMessage(
  text: string,
  entities: TelegramEntity[] = [],
): ParsedMessage | null {
  // Collect all URLs: bare URLs from text + text_link hrefs from entities
  const bareUrls = [...(text.match(URL_REGEX) || [])];
  const entityUrls: { url: string; offset: number; length: number; display: string }[] = [];

  for (const entity of entities) {
    if (entity.type === "text_link" && entity.url) {
      const display = text.slice(entity.offset, entity.offset + entity.length);
      entityUrls.push({ url: entity.url, offset: entity.offset, length: entity.length, display });
    }
    if (entity.type === "url") {
      const url = text.slice(entity.offset, entity.offset + entity.length);
      entityUrls.push({ url, offset: entity.offset, length: entity.length, display: url });
    }
  }

  // Primary URL: first bare URL, or first entity URL
  const allUrls = entities.length > 0
    ? entityUrls.map((e) => e.url)
    : bareUrls;

  if (allUrls.length === 0) return null;
  const url = allUrls[0];

  // Find "via" pattern in text
  const viaMatch = text.match(/\bvia\s+(\S+)/i);
  let via: string | null = null;

  if (viaMatch) {
    const viaText = viaMatch[1];
    const viaOffset = viaMatch.index! + 4; // "via " = 4 chars

    // Check if the via text is a text_link entity (hyperlinked text)
    const viaEntity = entityUrls.find(
      (e) => e.offset === viaOffset || (e.offset <= viaOffset && viaOffset < e.offset + e.length),
    );

    if (viaEntity) {
      via = viaEntity.url;
    } else if (viaText.match(/^https?:\/\//)) {
      via = viaText;
    } else {
      via = viaText;
    }
  }

  // Build note: strip the primary URL, via clause, and any entity display text
  let remaining = text;
  // Remove bare primary URL
  remaining = remaining.replace(url, "").trim();
  // Remove entity display text for primary URL if it was an entity
  if (entityUrls.length > 0) {
    const primaryEntity = entityUrls[0];
    remaining = remaining.replace(primaryEntity.display, "").trim();
  }
  // Remove via clause
  if (viaMatch) {
    remaining = remaining.replace(viaMatch[0], "").trim();
  }
  const note = remaining || null;

  return { url, via, note };
}
