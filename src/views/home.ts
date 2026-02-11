import type { Link } from "../db/queries";
import { layout } from "./layout";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

const SITE_NAME_OVERRIDES: Record<string, string> = {
  "x.com": "Twitter",
  "twitter.com": "Twitter",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function siteName(link: { site_name: string | null; url: string }): string {
  const host = hostname(link.url);
  if (SITE_NAME_OVERRIDES[host]) return SITE_NAME_OVERRIDES[host];
  return link.site_name || host;
}

function isUrl(s: string): boolean {
  return /^https?:\/\//.test(s);
}

function renderLink(link: Link): string {
  const title = link.title ? escapeHtml(link.title) : hostname(link.url);
  const desc = link.description ? escapeHtml(link.description) : "";
  const site = escapeHtml(siteName(link));
  const date = formatDate(link.created_at);

  const thumb = link.image_url
    ? `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener"><img class="link-thumb" src="${escapeHtml(link.image_url)}" alt="" loading="lazy"></a>`
    : `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="link-thumb-placeholder"><code>?</code></a>`;

  // Via: if it's a URL make it clickable, otherwise just text
  let viaHtml = "";
  if (link.via) {
    if (isUrl(link.via)) {
      viaHtml = ` &middot; via <a class="via-link" href="${escapeHtml(link.via)}" target="_blank" rel="noopener">${hostname(link.via)}</a>`;
    } else {
      viaHtml = ` &middot; via ${escapeHtml(link.via)}`;
    }
  }

  return `<div class="link-card">
  ${thumb}
  <div class="link-body">
    <a class="link-main" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
      <div class="link-title">${title}</div>
      ${desc ? `<div class="link-description">${desc}</div>` : ""}
    </a>
    <div class="link-meta">
      <a class="site" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${site}</a>
      <span class="via">${viaHtml}</span>
      <span class="date"> &middot; ${date}</span>
      <a class="edit-link" href="/submit?id=${link.id}" style="display:none;"> &middot; edit</a>
      <a class="delete-link" href="#" data-id="${link.id}" style="display:none;"> &middot; del</a>
    </div>
  </div>
</div>`;
}

export function renderLinks(links: Link[]): string {
  let html = "";
  for (const link of links) {
    html += renderLink(link);
  }
  return html;
}

export function renderHome(links: Link[], page: number, hasMore: boolean): string {
  let body = "<main>";
  body += renderLinks(links);

  if (links.length === 0) {
    body += `<p style="color: #73747b; text-align: center; padding: 48px 0;">No links yet.</p>`;
  }

  if (hasMore) {
    body += `<div class="load-more"><a href="/?page=${page + 1}" data-page="${page + 1}">load more</a></div>`;
  }

  body += "</main>";

  body += `<script>
document.addEventListener('click', async (e) => {
  const a = e.target.closest('.load-more a');
  if (!a) return;
  e.preventDefault();
  const page = a.dataset.page;
  a.textContent = 'loading...';
  try {
    const res = await fetch('/?page=' + page + '&partial=1');
    const html = await res.text();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const main = document.querySelector('main');
    const loadMore = main.querySelector('.load-more');
    loadMore.remove();
    main.insertAdjacentHTML('beforeend', html);
  } catch {
    a.textContent = 'load more';
  }
});
</script>`;

  return layout("jonbo's links", body);
}
