import { Hono } from "hono";
import { getLinks } from "../db/queries";
import { renderHome, renderLinks } from "../views/home";
import { layout } from "../views/layout";
import { renderSubmitPage, renderSecretPage } from "../views/submit";
import { md } from "../lib/markdown";
import { resolve } from "path";

const web = new Hono();

const PAGE_SIZE = 10;

web.get("/", (c) => {
  const page = Math.max(1, Number(c.req.query("page")) || 1);
  const partial = c.req.query("partial") === "1";
  const offset = (page - 1) * PAGE_SIZE;
  const links = getLinks(PAGE_SIZE + 1, offset);
  const hasMore = links.length > PAGE_SIZE;
  const pageLinks = links.slice(0, PAGE_SIZE);

  if (partial) {
    let html = renderLinks(pageLinks);
    if (hasMore) {
      html += `<div class="load-more"><a href="/?page=${page + 1}" data-page="${page + 1}">load more</a></div>`;
    }
    return c.html(html);
  }

  return c.html(renderHome(pageLinks, page, hasMore));
});

web.get("/about", async (c) => {
  const file = Bun.file(resolve(import.meta.dir, "../../content/about.md"));
  const text = await file.text();
  return c.html(layout("about — links.jon.bo", `<main class="prose">${md(text)}</main>`, "/about"));
});

web.get("/submit", (c) => {
  return c.html(renderSubmitPage());
});

web.get("/secret", (c) => {
  return c.html(renderSecretPage());
});

export default web;
