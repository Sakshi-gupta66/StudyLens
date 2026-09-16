/* =========================================================
   StudyLens — Markdown
   A small, dependency-free markdown renderer. LLM output is
   never trusted: everything is HTML-escaped first, then a
   limited set of markdown constructs are turned into tags.
   Raw HTML from the backend is never executed.
   ========================================================= */

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
  return out;
}

function renderMarkdown(source) {
  if (!source || typeof source !== "string") return "";

  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inCodeBlock = false;
  let codeBuffer = [];
  let listType = null; // 'ul' | 'ol' | null
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      html += `<p>${inlineMarkdown(paragraphBuffer.join(" "))}</p>`;
      paragraphBuffer = [];
    }
  };

  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushParagraph();
        closeList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = Math.min(headingMatch[1].length + 1, 4); // shift down: # -> h2
      html += `<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`;
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    const numberedMatch = line.match(/^\s*\d+[\.\)]\s+(.*)$/);

    if (bulletMatch) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${inlineMarkdown(bulletMatch[1])}</li>`;
      continue;
    }

    if (numberedMatch) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${inlineMarkdown(numberedMatch[1])}</li>`;
      continue;
    }

    const quoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      closeList();
      html += `<blockquote>${inlineMarkdown(quoteMatch[1])}</blockquote>`;
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      closeList();
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  if (inCodeBlock) {
    html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
  }
  flushParagraph();
  closeList();

  return html;
}

function estimateReadingTime(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

window.renderMarkdown = renderMarkdown;
window.estimateReadingTime = estimateReadingTime;
window.escapeHtml = escapeHtml;
