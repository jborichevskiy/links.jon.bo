/** Minimal markdown to HTML converter. Handles the basics. */
export function md(input: string): string {
  const lines = input.split("\n");
  let html = "";
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { html += "</ul>\n"; inList = false; }
      const level = headingMatch[1].length;
      html += `<h${level}>${inline(headingMatch[2])}</h${level}>\n`;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>\n`;
      continue;
    }

    // Close list if we're no longer in one
    if (inList && !line.match(/^[-*]\s+/)) {
      html += "</ul>\n";
      inList = false;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      html += "<hr>\n";
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      continue;
    }

    // Paragraph
    html += `<p>${inline(line)}</p>\n`;
  }

  if (inList) html += "</ul>\n";
  return html;
}

function inline(text: string): string {
  return text
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>");
}
