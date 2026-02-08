export interface LinkMetadata {
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
}

export async function fetchMetadata(url: string): Promise<LinkMetadata> {
  const result: LinkMetadata = {
    title: null,
    description: null,
    image_url: null,
    site_name: null,
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LinksBot/1.0; +https://links.jon.bo)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return result;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return result;

    const html = await response.text();

    result.title = extractMeta(html, "og:title") ?? extractTitle(html);
    result.description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "description", "name");
    result.image_url = extractMeta(html, "og:image");
    result.site_name = extractMeta(html, "og:site_name");
  } catch {
    // Metadata fetch is best-effort
  }

  return result;
}

function extractMeta(
  html: string,
  property: string,
  attr: string = "property",
): string | null {
  // Match both property="og:title" and name="description" patterns
  const regex = new RegExp(
    `<meta[^>]*${attr}=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']` +
      `|<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${escapeRegex(property)}["']`,
    "i",
  );
  const match = html.match(regex);
  if (!match) return null;
  const value = match[1] || match[2];
  return value ? decodeHtmlEntities(value.trim()) : null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
