import { Hono } from "hono";
import { config } from "../config";
import { fetchMetadata } from "../lib/metadata";
import { insertLink, updateLink, getLinkById, getAllLinks, insertLinkWithTimestamps } from "../db/queries";
const api = new Hono();

api.post("/api/preview", async (c) => {
  const body = await c.req.json();
  const url = body?.url;

  if (!url || typeof url !== "string") {
    return c.json({ error: "url is required" }, 400);
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return c.json({ error: "Invalid URL protocol" }, 400);
    }
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  try {
    const meta = await fetchMetadata(url);
    return c.json({
      title: meta.title,
      description: meta.description,
      image_url: meta.image_url,
      site_name: meta.site_name,
    });
  } catch {
    return c.json({ error: "Failed to fetch metadata" }, 500);
  }
});

api.post("/api/links", async (c) => {
  const body = await c.req.json();
  const url = body?.url;

  if (!url || typeof url !== "string") {
    return c.json({ error: "url is required" }, 400);
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return c.json({ error: "Invalid URL protocol" }, 400);
    }
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const isAuthenticated = token && config.apiKey && token === config.apiKey;

  if (isAuthenticated) {
    try {
      const link = insertLink({
        url,
        title: body.title || null,
        description: body.description || null,
        via: body.via || null,
        note: body.note || null,
        source: "web",
      });

      fetchMetadata(url).then((meta) => {
        updateLink(link.id, {
          title: body.title || meta.title,
          description: body.description || meta.description,
          image_url: meta.image_url,
          site_name: meta.site_name,
        });
      });

      return c.json({ message: "Link added!", id: link.id }, 201);
    } catch (err) {
      console.error("Failed to insert link:", err);
      return c.json({ error: String(err) }, 500);
    }
  } else {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

api.get("/api/links/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const link = getLinkById(id);
  if (!link) return c.json({ error: "Not found" }, 404);

  return c.json(link);
});

api.put("/api/links/:id", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || !config.apiKey || token !== config.apiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = Number(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const link = getLinkById(id);
  if (!link) return c.json({ error: "Not found" }, 404);

  const body = await c.req.json();

  updateLink(id, {
    url: body.url || link.url,
    title: body.title ?? link.title,
    description: body.description ?? link.description,
    via: body.via ?? link.via,
    note: body.note ?? link.note,
  });

  // Re-fetch metadata if URL changed
  if (body.url && body.url !== link.url) {
    fetchMetadata(body.url).then((meta) => {
      updateLink(id, {
        image_url: meta.image_url,
        site_name: meta.site_name,
        title: body.title || meta.title,
        description: body.description || meta.description,
      });
    });
  }

  return c.json({ message: "Link updated!", id });
});

api.get("/api/export", (c) => {
  const apikey = c.req.query("apikey");
  if (!apikey || !config.apiKey || apikey !== config.apiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const links = getAllLinks();
  return c.json({
    exported_at: new Date().toISOString(),
    count: links.length,
    links: links.map((link) => ({
      url: link.url,
      title: link.title,
      description: link.description,
      image_url: link.image_url,
      site_name: link.site_name,
      via: link.via,
      note: link.note,
      source: link.source,
      created_at: link.created_at,
      published_at: link.published_at,
    })),
  });
});

api.post("/api/import", async (c) => {
  const apikey = c.req.query("apikey");
  if (!apikey || !config.apiKey || apikey !== config.apiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const links = body?.links;

  if (!Array.isArray(links)) {
    return c.json({ error: "Expected { links: [...] }" }, 400);
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of links) {
    if (!item.url || typeof item.url !== "string") {
      skipped++;
      errors.push(`Skipped entry with missing/invalid url`);
      continue;
    }

    try {
      insertLinkWithTimestamps({
        url: item.url,
        title: item.title || null,
        description: item.description || null,
        image_url: item.image_url || null,
        site_name: item.site_name || null,
        via: item.via || null,
        note: item.note || null,
        source: item.source || "import",
        created_at: item.created_at || undefined,
        published_at: item.published_at || undefined,
      });
      imported++;
    } catch (err) {
      skipped++;
      errors.push(`Failed to import ${item.url}: ${err}`);
    }
  }

  return c.json({
    message: `Imported ${imported} links` + (skipped ? `, skipped ${skipped}` : ""),
    imported,
    skipped,
    errors: errors.length ? errors : undefined,
  });
});

export default api;
