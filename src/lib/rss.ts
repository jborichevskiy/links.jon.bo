import type { Link } from "../db/queries";
import { config } from "../config";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateRss(links: Link[]): string {
  const items = links
    .map(
      (link) => `    <item>
      <title>${escapeXml(link.title || link.url)}</title>
      <link>${escapeXml(link.url)}</link>
      <guid isPermaLink="false">${config.baseUrl}/link/${link.id}</guid>
      <pubDate>${new Date(link.published_at + "Z").toUTCString()}</pubDate>${
        link.description
          ? `\n      <description>${escapeXml(link.description)}</description>`
          : ""
      }${link.note ? `\n      <content:encoded><![CDATA[<p>${escapeXml(link.note)}</p>]]></content:encoded>` : ""}
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>jonbo's links</title>
    <link>${config.baseUrl}</link>
    <description>Links shared by jonbo</description>
    <language>en</language>
    <atom:link href="${config.baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}
