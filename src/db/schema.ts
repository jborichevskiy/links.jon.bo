import { Database } from "bun:sqlite";
import { config } from "../config";
import { mkdirSync } from "fs";
import { dirname } from "path";

let db: Database;

export function getDb(): Database {
  if (!db) {
    mkdirSync(dirname(config.dbPath), { recursive: true });
    db = new Database(config.dbPath, { create: true });
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    migrate(db);
  }
  return db;
}

function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      image_url TEXT,
      site_name TEXT,
      via TEXT,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'telegram',
      telegram_message_id INTEGER,
      telegram_channel_message_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      published_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_links_url ON links(url);
  `);
}
