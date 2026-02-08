import { getDb } from "../db/schema";
import { insertLink, updateLink } from "../db/queries";
import { fetchMetadata } from "../lib/metadata";

/**
 * Import links from a Telegram Desktop JSON export.
 *
 * Usage:
 *   bun run import <path-to-result.json>
 *
 * Telegram Desktop export format (result.json):
 * {
 *   "messages": [
 *     {
 *       "id": 123,
 *       "type": "message",
 *       "date": "2024-01-15T10:30:00",
 *       "text": "https://example.com via twitter",
 *       "text_entities": [
 *         { "type": "link", "text": "https://example.com" },
 *         ...
 *       ]
 *     }
 *   ]
 * }
 */

const filePath = process.argv[2];
if (!filePath) {
  console.log("Usage: bun run import <path-to-result.json>");
  console.log("");
  console.log("Export from Telegram Desktop:");
  console.log("  1. Open your channel in Telegram Desktop");
  console.log("  2. Click ... → Export Chat History");
  console.log("  3. Select JSON format");
  console.log("  4. Run this script with the result.json path");
  process.exit(1);
}

const file = Bun.file(filePath);
if (!(await file.exists())) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const data = await file.json();
const messages = data.messages || data;

if (!Array.isArray(messages)) {
  console.error("Expected 'messages' array in JSON file");
  process.exit(1);
}

getDb();

// Extract text content from Telegram's text_entities format
function getTextContent(msg: any): string {
  if (typeof msg.text === "string") return msg.text;
  if (Array.isArray(msg.text)) {
    return msg.text
      .map((part: any) => (typeof part === "string" ? part : part.text || ""))
      .join("");
  }
  return "";
}

// Extract URLs from text_entities
function getUrls(msg: any): string[] {
  const urls: string[] = [];

  // From text_entities array
  if (Array.isArray(msg.text_entities)) {
    for (const entity of msg.text_entities) {
      if (entity.type === "link" && entity.text) {
        urls.push(entity.text);
      }
      if (entity.type === "text_link" && entity.href) {
        urls.push(entity.href);
      }
    }
  }

  // Also from text array (newer format)
  if (Array.isArray(msg.text)) {
    for (const part of msg.text) {
      if (typeof part === "object" && part.type === "link" && part.text) {
        urls.push(part.text);
      }
      if (typeof part === "object" && part.type === "text_link" && part.href) {
        urls.push(part.href);
      }
    }
  }

  // Fallback: regex extract from full text
  if (urls.length === 0) {
    const text = getTextContent(msg);
    const matches = text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/g);
    if (matches) urls.push(...matches);
  }

  return [...new Set(urls)];
}

function extractVia(msg: any): string | null {
  const text = getTextContent(msg);
  const match = text.match(/\bvia\s+(\S+)/i);
  if (!match) return null;

  const viaText = match[1];
  const viaOffset = match.index! + 4;

  // Check if "via X" where X is a text_link in the export
  const entities = msg.text_entities || [];
  for (const entity of entities) {
    if (entity.type === "text_link" && entity.href) {
      // In desktop export, text_entities have text + href
      // Check if this entity's text matches the via token
      if (entity.text === viaText) {
        return entity.href;
      }
    }
  }

  // Also check the text array format
  if (Array.isArray(msg.text)) {
    for (const part of msg.text) {
      if (typeof part === "object" && part.type === "text_link" && part.href) {
        if (part.text === viaText) {
          return part.href;
        }
      }
    }
  }

  return viaText;
}

function extractNote(text: string, urls: string[]): string | null {
  let remaining = text;
  for (const url of urls) {
    remaining = remaining.replace(url, "").trim();
  }
  remaining = remaining.replace(/\bvia\s+\S+/i, "").trim();
  return remaining || null;
}

// Filter to only messages with links
const linkMessages = messages.filter((msg: any) => {
  if (msg.type !== "message") return false;
  return getUrls(msg).length > 0;
});

console.log(
  `Found ${linkMessages.length} messages with links out of ${messages.length} total messages`,
);

let imported = 0;
let skipped = 0;
const METADATA_DELAY = 500; // ms between metadata fetches to be polite

for (const msg of linkMessages) {
  const text = getTextContent(msg);
  const allUrls = getUrls(msg);
  const via = extractVia(msg);
  const note = extractNote(text, allUrls);

  // Filter out the via URL so it doesn't get saved as a separate link
  const urls = via ? allUrls.filter((u) => u !== via) : allUrls;
  if (urls.length === 0) continue;

  // Parse the date from Telegram export format
  const createdAt = msg.date
    ? msg.date.replace("T", " ").slice(0, 19)
    : new Date().toISOString().slice(0, 19).replace("T", " ");

  for (const url of urls) {
    try {
      const link = insertLink({
        url,
        via,
        note,
        source: "telegram-import",
        telegram_message_id: msg.id,
      });

      // Override the created_at to match the original post time
      const db = getDb();
      db.prepare("UPDATE links SET created_at = ?, published_at = ? WHERE id = ?").run(
        createdAt,
        createdAt,
        link.id,
      );

      // Fetch metadata with a small delay to avoid hammering servers
      try {
        const meta = await fetchMetadata(url);
        if (meta.title || meta.description) {
          const { updateLink } = await import("../db/queries");
          updateLink(link.id, {
            title: meta.title,
            description: meta.description,
            image_url: meta.image_url,
            site_name: meta.site_name,
          });
        }
      } catch {
        // metadata fetch is best-effort
      }

      imported++;
      console.log(`  [${imported}] ${createdAt} — ${url}`);
      await Bun.sleep(METADATA_DELAY);
    } catch (err) {
      skipped++;
      console.log(`  SKIP: ${url} — ${err}`);
    }
  }
}

console.log(`\nDone. Imported ${imported} links, skipped ${skipped}.`);
