import { getDb } from "./schema";

export interface Link {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  via: string | null;
  note: string | null;
  source: string;
  telegram_message_id: number | null;
  telegram_channel_message_id: number | null;
  created_at: string;
  published_at: string;
}

export interface NewLink {
  url: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  site_name?: string | null;
  via?: string | null;
  note?: string | null;
  source?: string;
  telegram_message_id?: number | null;
}

export function insertLink(link: NewLink): Link {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO links (url, title, description, image_url, site_name, via, note, source, telegram_message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `);
  return stmt.get(
    link.url,
    link.title ?? null,
    link.description ?? null,
    link.image_url ?? null,
    link.site_name ?? null,
    link.via ?? null,
    link.note ?? null,
    link.source ?? "telegram",
    link.telegram_message_id ?? null,
  ) as Link;
}

export function updateLink(
  id: number,
  updates: Partial<Omit<Link, "id" | "created_at">>,
): void {
  const db = getDb();
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(updates);
  db.prepare(`UPDATE links SET ${fields} WHERE id = ?`).run(...values, id);
}

export function getLinks(limit = 50, offset = 0): Link[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM links ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as Link[];
}

export function getLinkById(id: number): Link | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM links WHERE id = ?").get(id) as Link) ?? null;
}

export function getLinksSince(since: string): Link[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM links WHERE created_at >= ? ORDER BY created_at DESC",
    )
    .all(since) as Link[];
}

export function getAllLinks(): Link[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM links ORDER BY created_at ASC")
    .all() as Link[];
}

export function insertLinkWithTimestamps(link: NewLink & { created_at?: string; published_at?: string }): Link {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO links (url, title, description, image_url, site_name, via, note, source, telegram_message_id, created_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, datetime('now')))
    RETURNING *
  `);
  return stmt.get(
    link.url,
    link.title ?? null,
    link.description ?? null,
    link.image_url ?? null,
    link.site_name ?? null,
    link.via ?? null,
    link.note ?? null,
    link.source ?? "import",
    link.telegram_message_id ?? null,
    link.created_at ?? null,
    link.published_at ?? null,
  ) as Link;
}

export function deleteLink(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM links WHERE id = ?").run(id);
}

export function getTotalLinks(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM links").get() as {
    count: number;
  };
  return row.count;
}
