import { getDb } from "../db/schema";
import { insertLink, updateLink } from "../db/queries";
import { fetchMetadata } from "../lib/metadata";

const url = process.argv[2];
if (!url) {
  console.log("Usage: bun run add <url> [note]");
  process.exit(1);
}

const note = process.argv.slice(3).join(" ") || null;

// Init DB
getDb();

const link = insertLink({ url, note, source: "cli" });
console.log(`Saved link #${link.id}: ${url}`);

console.log("Fetching metadata...");
const meta = await fetchMetadata(url);
updateLink(link.id, {
  title: meta.title,
  description: meta.description,
  image_url: meta.image_url,
  site_name: meta.site_name,
});

console.log(`  title: ${meta.title}`);
console.log(`  description: ${meta.description?.slice(0, 80)}`);
console.log(`  image: ${meta.image_url}`);
console.log(`  site: ${meta.site_name}`);
console.log("Done.");
