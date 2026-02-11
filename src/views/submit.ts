import { layout } from "./layout";

export function renderSecretPage(): string {
  const body = `
  <main class="secret-page">
    <h2 style="color: #d0d0d0; font-size: 1.2rem; font-weight: 600;">Enter Secret</h2>
    <input type="password" id="secret-input" placeholder="paste your secret" autocomplete="off">
    <div class="secret-status" id="secret-status"></div>
    <script>
    (function() {
      var input = document.getElementById('secret-input');
      var status = document.getElementById('secret-status');
      var current = localStorage.getItem('links_secret');
      if (current) {
        status.textContent = 'Secret is set. Paste new to replace, or clear and press Enter to remove.';
      }
      input.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        var val = input.value.trim();
        if (val) {
          localStorage.setItem('links_secret', val);
          status.textContent = 'Secret saved.';
          status.style.color = '#5a5';
          var nav = document.getElementById('submit-link');
          if (nav) nav.textContent = '+ add';
        } else {
          localStorage.removeItem('links_secret');
          status.textContent = 'Secret removed.';
          status.style.color = '#555';
          var nav = document.getElementById('submit-link');
          if (nav) nav.textContent = '+ suggest';
        }
        input.value = '';
      });
    })();
    </script>
  </main>`;

  return layout("secret -- links.jon.bo", body, "/secret");
}

export function renderSubmitPage(): string {
  const body = `
  <main>
    <div class="submit-form">
      <label for="url-input">URL</label>
      <input type="url" id="url-input" placeholder="https://..." autofocus>

      <div id="preview-section" class="preview-section" style="display:none;">
        <h3>Preview</h3>
        <div class="preview-frames">
          <div class="preview-frame">
            <div class="preview-frame-label">Desktop</div>
            <iframe id="preview-desktop" style="height:140px;" sandbox="allow-same-origin"></iframe>
          </div>
          <div class="preview-frame">
            <div class="preview-frame-label">Mobile</div>
            <iframe id="preview-mobile" style="height:140px; max-width:375px;" sandbox="allow-same-origin"></iframe>
          </div>
        </div>
      </div>

      <div id="auth-fields">
        <label for="title-input">Title</label>
        <input type="text" id="title-input" placeholder="Page title (auto-filled)">

        <label for="desc-input">Description</label>
        <textarea id="desc-input" placeholder="Description (auto-filled)"></textarea>

        <label for="via-input">Via <span style="color:#3a3a3e;">(optional)</span></label>
        <input type="text" id="via-input" placeholder="source or URL">

        <label for="note-input">Note <span style="color:#3a3a3e;">(optional)</span></label>
        <textarea id="note-input" placeholder="Your commentary"></textarea>
      </div>

      <div id="guest-fields" style="display:none;">
        <label for="guest-name">Your name <span style="color:#3a3a3e;">(optional)</span></label>
        <input type="text" id="guest-name" placeholder="name">

        <label for="guest-comment">Comment <span style="color:#3a3a3e;">(optional)</span></label>
        <textarea id="guest-comment" placeholder="why you're suggesting this"></textarea>
      </div>

      <button class="submit-btn" id="submit-btn" disabled>+</button>
      <div class="submit-status" id="submit-status"></div>
    </div>

    <script>
    (function() {
      var urlInput = document.getElementById('url-input');
      var titleInput = document.getElementById('title-input');
      var descInput = document.getElementById('desc-input');
      var viaInput = document.getElementById('via-input');
      var noteInput = document.getElementById('note-input');
      var guestName = document.getElementById('guest-name');
      var guestComment = document.getElementById('guest-comment');
      var authFields = document.getElementById('auth-fields');
      var guestFields = document.getElementById('guest-fields');
      var submitBtn = document.getElementById('submit-btn');
      var statusEl = document.getElementById('submit-status');
      var previewSection = document.getElementById('preview-section');
      var previewDesktop = document.getElementById('preview-desktop');
      var previewMobile = document.getElementById('preview-mobile');

      var secret = localStorage.getItem('links_secret');
      var isAuth = !!secret;
      var editId = new URLSearchParams(window.location.search).get('id');
      var isEdit = isAuth && editId;

      submitBtn.textContent = isEdit ? 'save' : (isAuth ? '+ add' : '+ suggest');
      authFields.style.display = isAuth ? '' : 'none';
      guestFields.style.display = isAuth ? 'none' : '';

      var debounceTimer = null;
      var currentMeta = null;

      // If editing, fetch existing link data and pre-fill
      if (isEdit) {
        fetch('/api/links/' + editId)
          .then(function(r) { return r.json(); })
          .then(function(link) {
            if (link.error) {
              statusEl.textContent = link.error;
              statusEl.className = 'submit-status error';
              return;
            }
            urlInput.value = link.url || '';
            titleInput.value = link.title || '';
            descInput.value = link.description || '';
            viaInput.value = link.via || '';
            noteInput.value = link.note || '';
            currentMeta = { title: link.title, description: link.description, image_url: link.image_url, site_name: link.site_name };
            updateSubmitState();
            renderPreview(currentMeta, link.url);
            previewSection.style.display = '';
          });
      }

      function isValidUrl(s) {
        try { var u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; }
        catch(e) { return false; }
      }

      function updateSubmitState() {
        submitBtn.disabled = !isValidUrl(urlInput.value.trim());
      }

      urlInput.addEventListener('input', function() {
        updateSubmitState();
        if (!isAuth) return;
        clearTimeout(debounceTimer);
        var url = urlInput.value.trim();
        if (!isValidUrl(url)) {
          previewSection.style.display = 'none';
          return;
        }
        debounceTimer = setTimeout(function() { fetchPreview(url); }, 400);
      });

      urlInput.addEventListener('paste', function() {
        setTimeout(function() {
          var url = urlInput.value.trim();
          if (isAuth && isValidUrl(url)) {
            clearTimeout(debounceTimer);
            fetchPreview(url);
          }
          updateSubmitState();
        }, 0);
      });

      function fetchPreview(url) {
        statusEl.textContent = 'Fetching metadata...';
        statusEl.className = 'submit-status';
        fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          statusEl.textContent = '';
          if (data.error) {
            statusEl.textContent = data.error;
            statusEl.className = 'submit-status error';
            return;
          }
          currentMeta = data;
          if (!titleInput.value) titleInput.value = data.title || '';
          if (!descInput.value) descInput.value = data.description || '';
          renderPreview(data, url);
          previewSection.style.display = '';
        })
        .catch(function() {
          statusEl.textContent = 'Failed to fetch metadata';
          statusEl.className = 'submit-status error';
        });
      }

      // Re-render preview when title or description changes
      titleInput.addEventListener('input', updatePreview);
      descInput.addEventListener('input', updatePreview);

      function updatePreview() {
        if (!currentMeta) return;
        var url = urlInput.value.trim();
        if (!isValidUrl(url)) return;
        var meta = Object.assign({}, currentMeta, {
          title: titleInput.value.trim() || currentMeta.title,
          description: descInput.value.trim() || currentMeta.description
        });
        renderPreview(meta, url);
      }

      function renderPreview(meta, url) {
        var card = buildCardHtml(meta, url);
        writeToIframe(previewDesktop, card, '864px', '1.4rem');
        writeToIframe(previewMobile, card, '375px', '1rem');
      }

      function buildCardHtml(meta, url) {
        var hostname = '';
        try { hostname = new URL(url).hostname.replace(/^www\\./, ''); } catch(e) {}

        var OVERRIDES = { 'x.com': 'Twitter', 'twitter.com': 'Twitter' };
        var title = esc(meta.title || hostname);
        var desc = meta.description ? esc(meta.description) : '';
        var site = esc(OVERRIDES[hostname] || meta.site_name || hostname);

        var thumb = meta.image_url
          ? '<img src="' + esc(meta.image_url) + '" alt="" style="flex-shrink:0;width:80px;height:80px;border-radius:2px;object-fit:cover;">'
          : '<div style="flex-shrink:0;width:80px;height:80px;border-radius:2px;background:#222;display:flex;align-items:center;justify-content:center;"><code style="font-size:1.4rem;color:#3a3a3e;font-family:Consolas,Monaco,monospace;">?</code></div>';

        return '<div style="display:flex;gap:16px;padding:14px 0;">'
          + thumb
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-size:1.33rem;font-weight:600;color:#d0d0d0;margin-bottom:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + title + '</div>'
          + (desc ? '<div style="font-size:1.12rem;color:#666;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + desc + '</div>' : '')
          + '<div style="font-size:0.98rem;color:#555;margin-top:4px;"><span style="color:#BB4263;">' + site + '</span></div>'
          + '</div></div>';
      }

      function writeToIframe(iframe, cardHtml, width, fontSize) {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write('<!DOCTYPE html><html><head>'
          + '<link rel="preconnect" href="https://rsms.me/">'
          + '<link rel="stylesheet" href="https://rsms.me/inter/inter.css">'
          + '<style>*{margin:0;padding:0;box-sizing:border-box;}'
          + 'body{font-family:Inter,-apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",Helvetica,Arial,sans-serif;'
          + 'font-feature-settings:"liga","tnum","case","calt","zero","ss01","locl";'
          + 'background:#1a1a1c;color:#a9a9b3;'
          + 'max-width:' + width + ';padding:10px;-webkit-font-smoothing:antialiased;'
          + 'font-size:' + fontSize + ';line-height:1.54;}'
          + '</style></head><body>' + cardHtml + '</body></html>');
        doc.close();
      }

      function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
      }

      submitBtn.addEventListener('click', function() {
        var url = urlInput.value.trim();
        if (!isValidUrl(url)) return;

        submitBtn.disabled = true;
        statusEl.textContent = 'Submitting...';
        statusEl.className = 'submit-status';

        var headers = { 'Content-Type': 'application/json' };
        var secret = localStorage.getItem('links_secret');
        if (secret) headers['Authorization'] = 'Bearer ' + secret;

        var payload = isAuth
          ? {
              url: url,
              title: titleInput.value.trim() || null,
              description: descInput.value.trim() || null,
              via: viaInput.value.trim() || null,
              note: noteInput.value.trim() || null
            }
          : {
              url: url,
              name: guestName.value.trim() || null,
              comment: guestComment.value.trim() || null
            };

        var endpoint = isEdit ? '/api/links/' + editId : '/api/links';
        var method = isEdit ? 'PUT' : 'POST';

        fetch(endpoint, {
          method: method,
          headers: headers,
          body: JSON.stringify(payload)
        })
        .then(function(r) { return r.json().then(function(d) { return {ok: r.ok, data: d}; }); })
        .then(function(res) {
          if (res.ok) {
            if (isEdit) {
              window.location.href = '/';
              return;
            }
            statusEl.textContent = res.data.message || 'Done!';
            statusEl.className = 'submit-status success';
            urlInput.value = '';
            titleInput.value = '';
            descInput.value = '';
            viaInput.value = '';
            noteInput.value = '';
            guestName.value = '';
            guestComment.value = '';
            previewSection.style.display = 'none';
            currentMeta = null;
            submitBtn.disabled = true;
          } else {
            statusEl.textContent = res.data.error || 'Something went wrong';
            statusEl.className = 'submit-status error';
            submitBtn.disabled = false;
          }
        })
        .catch(function() {
          statusEl.textContent = 'Network error';
          statusEl.className = 'submit-status error';
          submitBtn.disabled = false;
        });
      });

      updateSubmitState();
    })();
    </script>
  </main>`;

  return layout("submit -- links.jon.bo", body, "/submit");
}
