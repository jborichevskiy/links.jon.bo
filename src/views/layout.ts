import { config } from "../config";

export function layout(title: string, body: string, path: string = "/"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="good links from around the internet, collected here for you by @jondotbo.">
  <link rel="icon" href="https://jon.bo/favicon.ico">
  <link rel="alternate" type="application/rss+xml" title="RSS" href="${config.baseUrl}/feed.xml">
  <link rel="alternate" type="application/feed+json" title="JSON Feed" href="${config.baseUrl}/feed.json">
  <link rel="preconnect" href="https://rsms.me/">
  <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { overflow-y: scroll; }

    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", Helvetica, Arial, sans-serif;
      font-feature-settings: "liga", "tnum", "case", "calt", "zero", "ss01", "locl";
      font-weight: 400;
      font-size: 1.4rem;
      line-height: 1.54;
      background: #1a1a1c;
      color: #a9a9b3;
      max-width: 864px;
      margin: 0 auto;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      -webkit-text-size-adjust: 100%;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      color: #e0e0e0;
    }

    header {
      padding: 0 0 16px;
      border-bottom: 2px solid #2a2a2e;
      margin-bottom: 16px;
    }

    .feed-links {
      font-size: 1.05rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .feed-links a {
      color: #555;
      margin-right: 20px;
    }

    .feed-links a:hover {
      color: #e0e0e0;
    }

    .feed-links .site-name {
      color: #BB4263;
      margin-right: 20px;
      font-weight: 700;
    }

    .link-card {
      display: flex;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid #222;
    }

    .link-card:hover {
      background: #222;
      margin: 0 -20px;
      padding: 14px 20px;
      border-radius: 0;
      border-color: transparent;
    }

    .link-thumb {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: 2px;
      object-fit: cover;
    }

    .link-body {
      flex: 1;
      min-width: 0;
    }

    .link-main {
      display: block;
    }

    .link-main:hover .link-title {
      color: #fff;
    }

    .link-title {
      font-size: 1.33rem;
      font-weight: 600;
      color: #d0d0d0;
      margin-bottom: 2px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.1s;
    }

    .link-description {
      font-size: 1.12rem;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .link-meta {
      font-size: 0.98rem;
      color: #555;
      margin-top: 4px;
    }

    .link-meta .site {
      color: #BB4263;
    }

    .link-meta .site:hover {
      text-decoration: underline;
    }

    .link-meta .via { color: #555; }

    .link-meta .via-link {
      color: #888;
    }

    .link-meta .note { font-style: italic; }

    .link-meta .date { color: #3a3a3e; }

    .link-meta .edit-link,
    .link-meta .delete-link {
      color: #3a3a3e;
      font-family: Consolas, Monaco, "Andale Mono", monospace;
    }
    .link-meta .edit-link:hover { color: #BB4263; }
    .link-meta .delete-link:hover { color: #e55; }

    .link-thumb-placeholder {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: 2px;
      background: #222;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }

    .link-thumb-placeholder code {
      font-size: 1.4rem;
      color: #3a3a3e;
      font-family: Consolas, Monaco, "Andale Mono", monospace;
    }

    .load-more {
      text-align: center;
      padding: 24px 0;
    }

    .load-more a {
      color: #555;
      font-size: 1.05rem;
    }

    .load-more a:hover {
      color: #e0e0e0;
    }

    .prose a { color: #BB4263; text-decoration: underline; text-decoration-color: #3a2030; }
    .prose a:hover { text-decoration-color: #BB4263; color: #e0e0e0; }

    .prose h1 { font-size: 1.8rem; font-weight: 700; color: #d0d0d0; margin: 24px 0 12px; }
    .prose h2 { font-size: 1.4rem; font-weight: 600; color: #d0d0d0; margin: 20px 0 10px; }
    .prose h3 { font-size: 1.2rem; font-weight: 600; color: #d0d0d0; margin: 16px 0 8px; }
    .prose p { margin: 12px 0; }
    .prose ul { margin: 12px 0 12px 24px; }
    .prose li { margin: 4px 0; }
    .prose code { background: #222; padding: 2px 6px; border-radius: 2px; font-size: 0.9em; }
    .prose hr { border: none; border-top: 2px solid #2a2a2e; margin: 24px 0; }
    .prose img { max-width: 100%; border-radius: 2px; margin: 12px 0; }

    .submit-link {
      float: right;
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      color: #BB4263 !important;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: none;
    }

    .submit-link:hover {
      color: #e0e0e0 !important;
    }

    .submit-form label {
      display: block;
      font-size: 0.85rem;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      margin-top: 16px;
    }

    .submit-form input,
    .submit-form textarea {
      width: 100%;
      padding: 10px 12px;
      background: #222;
      border: 1px solid #333;
      border-radius: 2px;
      color: #d0d0d0;
      font-family: inherit;
      font-size: 1rem;
      outline: none;
    }

    .submit-form input:focus,
    .submit-form textarea:focus {
      border-color: #BB4263;
    }

    .submit-form textarea {
      resize: vertical;
      min-height: 60px;
    }

    .submit-btn {
      margin-top: 20px;
      padding: 10px 24px;
      background: #BB4263;
      color: #fff;
      border: none;
      border-radius: 2px;
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
    }

    .submit-btn:hover { background: #d4456f; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .submit-status {
      margin-top: 12px;
      font-size: 0.95rem;
      min-height: 1.4em;
    }

    .submit-status.error { color: #e55; }
    .submit-status.success { color: #5a5; }

    .preview-section {
      margin-top: 24px;
      border-top: 1px solid #2a2a2e;
      padding-top: 20px;
    }

    .preview-section h3 {
      font-size: 0.85rem;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }

    .preview-frames {
      display: flex;
      gap: 20px;
    }

    .preview-frame {
      flex: 1;
      min-width: 0;
    }

    .preview-frame-label {
      font-size: 0.75rem;
      color: #3a3a3e;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .preview-frame iframe {
      width: 100%;
      border: 1px solid #2a2a2e;
      border-radius: 2px;
      background: #1a1a1c;
    }

    .secret-page {
      max-width: 400px;
      margin: 80px auto;
      text-align: center;
    }

    .secret-page input {
      width: 100%;
      padding: 10px 12px;
      background: #222;
      border: 1px solid #333;
      border-radius: 2px;
      color: #d0d0d0;
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 1rem;
      text-align: center;
      outline: none;
      margin-top: 12px;
    }

    .secret-page input:focus { border-color: #BB4263; }

    .secret-status {
      margin-top: 12px;
      font-size: 0.9rem;
      color: #555;
    }

    @media (max-width: 1024px) {
      body { font-size: 1rem; }
      .link-title { font-size: 0.95rem; }
      .link-description { font-size: 0.7rem; }
      .link-meta { font-size: 0.65rem; }
      .feed-links { font-size: 0.7rem; }
      .link-thumb, .link-thumb-placeholder { width: 56px; height: 56px; }
      .link-thumb-placeholder code { font-size: 1rem; }
      .load-more a { font-size: 0.7rem; }
      .preview-frames { flex-direction: column; }
      .submit-link { float: none; margin-left: 0; }
    }

  </style>
</head>
<body>
  <header>
    <nav class="feed-links">
      ${path !== "/" ? `<a href="/" class="site-name">links.jon.bo</a>` : ""}
      <a href="/feed.xml">RSS</a>
      <a href="/feed.json">JSON</a>
      <a href="/about">ABOUT</a>
      <a href="/submit" class="submit-link" id="submit-link">+</a>
    </nav>
  </header>
  ${body}
<script>
(function() {
  var el = document.getElementById('submit-link');
  if (!el) return;
  var s = localStorage.getItem('links_secret');
  if (s) { el.textContent = '+ add'; } else { el.style.display = 'none'; }
  if (s) {
    var edits = document.querySelectorAll('.edit-link');
    for (var i = 0; i < edits.length; i++) edits[i].style.display = '';
    var dels = document.querySelectorAll('.delete-link');
    for (var i = 0; i < dels.length; i++) dels[i].style.display = '';
    document.addEventListener('click', function(e) {
      var a = e.target.closest('.delete-link');
      if (!a) return;
      e.preventDefault();
      if (!confirm('Delete this link?')) return;
      var id = a.dataset.id;
      fetch('/api/links/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + s }
      }).then(function(r) {
        if (r.ok) {
          var card = a.closest('.link-card');
          if (card) card.remove();
        } else {
          alert('Failed to delete');
        }
      });
    });
  }
})();
</script>
</body>
</html>`;
}
