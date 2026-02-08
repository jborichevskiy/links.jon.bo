import { Hono } from "hono";
import { getLinks } from "../db/queries";
import { generateRss } from "../lib/rss";

const feed = new Hono();

feed.get("/feed.xml", (c) => {
  const links = getLinks(100);
  const rss = generateRss(links);
  return c.body(rss, 200, {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  });
});

feed.get("/feed.json", (c) => {
  const links = getLinks(100);
  const jsonFeed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "jonbo's links",
    home_page_url: c.req.url.replace("/feed.json", ""),
    feed_url: c.req.url,
    items: links.map((link) => ({
      id: String(link.id),
      url: link.url,
      title: link.title || link.url,
      content_text: link.note || link.description || undefined,
      image: link.image_url || undefined,
      date_published: link.published_at.replace(" ", "T") + "Z",
    })),
  };
  return c.json(jsonFeed);
});

export default feed;
