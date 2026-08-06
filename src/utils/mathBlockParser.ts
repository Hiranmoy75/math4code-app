// ─── Custom Block Definitions ────────────────────────────────────────────────
const BLOCKS: Record<string, { label: string; icon: string; className: string }> = {
    definition:  { label: "Definition",  icon: "📘", className: "math-block-definition" },
    theorem:     { label: "Theorem",     icon: "📐", className: "math-block-theorem" },
    lemma:       { label: "Lemma",       icon: "🔹", className: "math-block-lemma" },
    corollary:   { label: "Corollary",   icon: "🔸", className: "math-block-corollary" },
    proposition: { label: "Proposition", icon: "💡", className: "math-block-proposition" },
    proof:       { label: "Proof",       icon: "✍️", className: "math-block-proof" },
    example:     { label: "Example",     icon: "✏️", className: "math-block-example" },
    question:    { label: "Question",    icon: "❓", className: "math-block-question" },
    answer:      { label: "Answer",      icon: "✅", className: "math-block-answer" },
    note:        { label: "Note",        icon: "📝", className: "math-block-note" },
    warning:     { label: "Warning",     icon: "⚠️", className: "math-block-warning" },
    remark:      { label: "Remark",      icon: "💬", className: "math-block-remark" },
};

function escapeHtml(t: string): string {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Math-safe inline markdown ────────────────────────────────────────────────
function inlineMarkdownSafe(text: string): string {
    const tokens: string[] = [];
    let s = text;

    // Protect display math $$...$$
    s = s.replace(/\$\$([^$]+?)\$\$/g, (m) => { tokens.push(m); return `\x00M${tokens.length - 1}\x00`; });
    // Protect inline math $...$
    s = s.replace(/\$([^$\n]+?)\$/g, (m) => { tokens.push(m); return `\x00M${tokens.length - 1}\x00`; });
    // Protect \[...\]
    s = s.replace(/\\\[[\s\S]+?\\\]/g, (m) => { tokens.push(m); return `\x00M${tokens.length - 1}\x00`; });
    // Protect \(...\)
    s = s.replace(/\\\([\s\S]+?\\\)/g, (m) => { tokens.push(m); return `\x00M${tokens.length - 1}\x00`; });

    // Inline images ![alt](url) — before links
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
        (_, alt, src) => `<img src="${src}" alt="${escapeHtml(alt)}" class="math-img-inline" loading="lazy" />`);

    // Markdown transforms
    s = s
        .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
        .replace(/__([^_]+?)__/g, "<strong>$1</strong>")
        .replace(/_([^_\n]+?)_/g, "<em>$1</em>")
        .replace(/~~([^~]+?)~~/g, "<del>$1</del>")
        .replace(/`([^`]+?)`/g, '<code class="math-inline-code">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="math-link">$1</a>');

    // Restore math
    s = s.replace(/\x00M(\d+)\x00/g, (_, i) => tokens[parseInt(i)]);
    return s;
}

// ─── Block body processor ─────────────────────────────────────────────────────
function processBlockBody(raw: string): string {
    const lines = raw.trim().split("\n");
    let html = "";
    let inDisplay = false;
    let displayBuf = "";

    for (const line of lines) {
        const t = line.trim();

        // Toggle for multi-line $$ ... $$
        if (t === "$$") {
            if (!inDisplay) {
                inDisplay = true;
                displayBuf = "$$\n";
            } else {
                inDisplay = false;
                displayBuf += "$$";
                html += `<div class="math-display-wrap">${displayBuf}</div>`;
                displayBuf = "";
            }
            continue;
        }
        if (inDisplay) { displayBuf += line + "\n"; continue; }

        // Single-line $$...$$ on one line
        if (t.startsWith("$$") && t.endsWith("$$") && t.length > 4) {
            html += `<div class="math-display-wrap">${t}</div>`;
            continue;
        }

        if (t === "") { html += "<br>"; continue; }

        html += `<p class="math-block-line">${inlineMarkdownSafe(line)}</p>`;
    }

    if (inDisplay) html += `<div class="math-display-wrap">${displayBuf}</div>`;
    return html;
}

// ─── Balanced brace extractor ─────────────────────────────────────────────────
function extractBraceContent(text: string, startIdx: number): { content: string; endIdx: number } | null {
    if (text[startIdx] !== "{") return null;
    let depth = 0, i = startIdx, content = "";
    while (i < text.length) {
        const ch = text[i];
        if (ch === "{") { depth++; if (depth > 1) content += ch; }
        else if (ch === "}") { depth--; if (depth === 0) return { content, endIdx: i }; else content += ch; }
        else content += ch;
        i++;
    }
    return null;
}

function renderBlockImage(src: string, alt: string, caption?: string): string {
    const capHtml = (caption || alt)
        ? `<figcaption class="math-img-caption">${escapeHtml(caption || alt)}</figcaption>`
        : "";
    return `<figure class="math-img-block"><img src="${src}" alt="${escapeHtml(alt)}" class="math-img" loading="lazy" />${capHtml}</figure>`;
}

// ─── Full document parser ─────────────────────────────────────────────────────
export function parseMathContent(raw: string): string {
    if (!raw || !raw.trim()) return "";

    // Pass 1a ── \image{url} and \image{url}{caption}
    let processed = raw;
    processed = processed.replace(
        /\\image\{([^}]+)\}(?:\{([^}]*)\})?/g,
        (_, src, caption) => `\n${renderBlockImage(src.trim(), caption || "", caption?.trim())}\n`
    );

    // Pass 1b ── replace \blockname{...} with styled HTML divs
    for (const [cmd, meta] of Object.entries(BLOCKS)) {
        const re = new RegExp(`\\\\${cmd}\\{`, "g");
        let result = "", lastIdx = 0, match: RegExpExecArray | null;
        re.lastIndex = 0;
        while ((match = re.exec(processed)) !== null) {
            const braceStart = match.index + match[0].length - 1;
            const extracted = extractBraceContent(processed, braceStart);
            if (!extracted) continue;
            result += processed.slice(lastIdx, match.index);
            result += `\n<div class="math-block ${meta.className}"><div class="math-block-header"><span class="math-block-icon">${meta.icon}</span><span class="math-block-label">${meta.label}</span></div><div class="math-block-body">${processBlockBody(extracted.content)}</div></div>\n`;
            lastIdx = extracted.endIdx + 1;
            re.lastIndex = lastIdx;
        }
        result += processed.slice(lastIdx);
        processed = result;
    }

    // Pass 2 ── line-by-line markdown for remaining text
    const lines = processed.split("\n");
    const out: string[] = [];
    let inCode = false, codeBuf = "", codeLang = "";
    let inList = false, listType = "", listItems: string[] = [];

    const flushList = () => {
        if (!inList) return;
        const tag = listType === "ol" ? "ol" : "ul";
        out.push(`<${tag} class="math-list math-${tag}">${listItems.map(li => `<li>${inlineMarkdownSafe(li)}</li>`).join("")}</${tag}>`);
        listItems = []; inList = false; listType = "";
    };

    for (const line of lines) {
        if (line.startsWith('<div class="math-block') || line.startsWith('<figure class="math-img')) {
            flushList(); out.push(line); continue;
        }

        // Code fences
        if (line.startsWith("```")) {
            flushList();
            if (!inCode) { inCode = true; codeLang = line.slice(3).trim(); codeBuf = ""; }
            else { inCode = false; out.push(`<pre class="math-code-block"><code class="lang-${codeLang}">${escapeHtml(codeBuf.trim())}</code></pre>`); codeBuf = ""; codeLang = ""; }
            continue;
        }
        if (inCode) { codeBuf += line + "\n"; continue; }

        // Horizontal rule
        if (/^(---+|===+|\*\*\*+)\s*$/.test(line)) { flushList(); out.push('<hr class="math-hr" />'); continue; }

        // Headings
        const hm = line.match(/^(#{1,6})\s+(.+)/);
        if (hm) {
            flushList();
            const lvl = hm[1].length;
            out.push(`<h${lvl} class="math-h${lvl}">${inlineMarkdownSafe(hm[2])}</h${lvl}>`);
            continue;
        }

        // Standalone block image: ![alt](url) on its own line
        const imgBlock = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgBlock) {
            flushList();
            out.push(renderBlockImage(imgBlock[2], imgBlock[1]));
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) { flushList(); out.push(`<blockquote class="math-blockquote">${inlineMarkdownSafe(line.slice(2))}</blockquote>`); continue; }

        // Display math block (standalone $$ line)
        if (line.trim().startsWith("$$")) {
            flushList();
            out.push(`<div class="math-display-wrap">${line.trim()}</div>`);
            continue;
        }

        // Unordered list
        const ulm = line.match(/^[\-\*\+]\s+(.+)/);
        if (ulm) { if (inList && listType !== "ul") flushList(); inList = true; listType = "ul"; listItems.push(ulm[1]); continue; }

        // Ordered list
        const olm = line.match(/^\d+\.\s+(.+)/);
        if (olm) { if (inList && listType !== "ol") flushList(); inList = true; listType = "ol"; listItems.push(olm[1]); continue; }

        // Empty line
        if (line.trim() === "") { flushList(); out.push('<div class="math-spacer"></div>'); continue; }

        // Non-list line after list
        if (inList) flushList();

        // Regular paragraph
        out.push(`<p class="math-p">${inlineMarkdownSafe(line)}</p>`);
    }

    flushList();
    return out.join("\n");
}

export interface BuildMathHtmlOptions {
    isDarkMode?: boolean;
    fontSize?: number;
    textColor?: string;
    backgroundColor?: string;
    instanceId?: string;
}

export function buildMathHtmlDocument(contentHtml: string, options: BuildMathHtmlOptions = {}): string {
    const {
        isDarkMode = false,
        fontSize = 16,
        textColor = isDarkMode ? '#e2e8f0' : '#1e293b',
        backgroundColor = 'transparent',
        instanceId = ''
    } = options;

    return `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden !important;
            background-color: ${backgroundColor};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: ${fontSize}px;
            color: ${textColor};
            line-height: 1.45;
            -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        *, *::before, *::after { box-sizing: border-box; -ms-overflow-style: none !important; scrollbar-width: none !important; }

        .math-preview-root {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        /* ── Typography ───────────────────────────── */
        .math-h1 { font-size: 1.8em; font-weight: 800; margin: 1.2em 0 0.6em; color: ${isDarkMode ? '#f1f5f9' : '#0f172a'}; border-bottom: 3px solid #6366f1; padding-bottom: 0.3em; }
        .math-h2 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; color: ${isDarkMode ? '#e2e8f0' : '#1e293b'}; border-bottom: 2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}; padding-bottom: 0.2em; }
        .math-h3 { font-size: 1.25em; font-weight: 700; margin: 0.8em 0 0.4em; color: ${isDarkMode ? '#cbd5e1' : '#334155'}; }
        .math-h4 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; color: ${isDarkMode ? '#94a3b8' : '#475569'}; }
        .math-h5, .math-h6 { font-size: 1em; font-weight: 600; margin: 0.5em 0 0.2em; color: ${isDarkMode ? '#94a3b8' : '#64748b'}; }

        .math-p { margin: 0 0 4px 0; padding: 0; }
        .math-p:last-child { margin-bottom: 0; }
        .math-spacer { height: 0.6em; }
        .math-hr { border: none; border-top: 2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}; margin: 1.2em 0; }

        .katex-mathml {
            display: none !important;
            position: absolute !important;
            clip: rect(1px, 1px, 1px, 1px) !important;
            width: 1px !important;
            height: 1px !important;
            overflow: hidden !important;
        }

        .math-link { color: #6366f1; text-decoration: underline; }

        .math-inline-code {
            background: ${isDarkMode ? '#1e293b' : '#f1f5f9'};
            color: ${isDarkMode ? '#a78bfa' : '#7c3aed'};
            padding: 0.1em 0.4em; border-radius: 4px;
            font-family: monospace; font-size: 0.9em;
        }

        .math-code-block {
            background: #0f172a; color: #e2e8f0;
            padding: 1rem 1.25rem; border-radius: 0.75rem;
            overflow-x: auto; margin: 0.8rem 0;
            font-family: monospace; font-size: 0.85em; line-height: 1.6;
        }

        .math-blockquote {
            border-left: 4px solid #6366f1;
            background: ${isDarkMode ? '#1e1b4b' : '#eef2ff'};
            padding: 0.6rem 1rem; margin: 0.8rem 0;
            border-radius: 0 0.5rem 0.5rem 0;
            color: ${isDarkMode ? '#a5b4fc' : '#3730a3'}; font-style: italic;
        }

        /* ── Images ──────────────────────────────── */
        .math-img-block { margin: 1.2rem 0; text-align: center; }
        .math-img {
            max-width: 100%; height: auto; border-radius: 0.75rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12); display: inline-block;
        }
        .math-img-caption { margin-top: 0.4rem; font-size: 0.85em; color: ${isDarkMode ? '#94a3b8' : '#64748b'}; font-style: italic; }
        .math-img-inline { max-width: 100%; height: auto; border-radius: 0.4rem; vertical-align: middle; margin: 0 0.2rem; }

        /* ── Display math wrapper ─────────────────── */
        .math-display-wrap { overflow-x: auto; padding: 0.4rem 0; text-align: center; }
        .katex { font-size: 1.1em; }
        .katex-display { margin: 0.4em 0; overflow-x: auto; overflow-y: hidden; }

        /* ── Lists ────────────────────────────────── */
        .math-list { padding-left: 1.5rem; margin: 0.4rem 0; }
        .math-ul { list-style: disc; }
        .math-ol { list-style: decimal; }
        .math-list li { margin-bottom: 0.25rem; }

        /* ── Math Blocks ──────────────────────────── */
        .math-block {
            border-radius: 0.75rem; margin: 1rem 0;
            overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .math-block-header {
            display: flex; align-items: center; gap: 0.5rem;
            padding: 0.5rem 0.9rem;
            font-weight: 700; font-size: 0.8em;
            letter-spacing: 0.05em; text-transform: uppercase;
        }
        .math-block-icon { font-size: 1em; }
        .math-block-body { padding: 0.8rem 1rem; font-size: 0.95em; line-height: 1.7; }
        .math-block-line { margin: 0.2rem 0; }

        /* Block Variants */
        ${isDarkMode ? `
            .math-block-definition { background: #172554; border-left: 5px solid #60a5fa; }
            .math-block-definition .math-block-header { background: #1e3a8a; color: #93c5fd; }
            .math-block-definition .math-block-body { color: #bfdbfe; }

            .math-block-theorem { background: #2e1065; border-left: 5px solid #a78bfa; }
            .math-block-theorem .math-block-header { background: #4c1d95; color: #c4b5fd; }
            .math-block-theorem .math-block-body { color: #ddd6fe; }

            .math-block-lemma { background: #1e1b4b; border-left: 5px solid #a78bfa; }
            .math-block-lemma .math-block-header { background: #3730a3; color: #c4b5fd; }
            .math-block-lemma .math-block-body { color: #ddd6fe; }

            .math-block-corollary { background: #2d1f3a; border-left: 5px solid #e879f9; }
            .math-block-corollary .math-block-header { background: #4a044e; color: #f0abfc; }
            .math-block-corollary .math-block-body { color: #f5d0fe; }

            .math-block-proposition { background: #1e1b4b; border-left: 5px solid #818cf8; }
            .math-block-proposition .math-block-header { background: #312e81; color: #a5b4fc; }
            .math-block-proposition .math-block-body { color: #e0e7ff; }

            .math-block-proof { background: #1e293b; border-left: 5px solid #94a3b8; }
            .math-block-proof .math-block-header { background: #0f172a; color: #94a3b8; }
            .math-block-proof .math-block-body { color: #cbd5e1; font-style: italic; }

            .math-block-example { background: #052e16; border-left: 5px solid #4ade80; }
            .math-block-example .math-block-header { background: #14532d; color: #86efac; }
            .math-block-example .math-block-body { color: #bbf7d0; }

            .math-block-question { background: #2c1206; border-left: 5px solid #fb923c; }
            .math-block-question .math-block-header { background: #431407; color: #fdba74; }
            .math-block-question .math-block-body { color: #fed7aa; }

            .math-block-answer { background: #042f2e; border-left: 5px solid #2dd4bf; }
            .math-block-answer .math-block-header { background: #134e4a; color: #5eead4; }
            .math-block-answer .math-block-body { color: #99f6e4; }

            .math-block-note { background: #1c1004; border-left: 5px solid #fbbf24; }
            .math-block-note .math-block-header { background: #451a03; color: #fcd34d; }
            .math-block-note .math-block-body { color: #fde68a; }

            .math-block-warning { background: #2d0a0a; border-left: 5px solid #f87171; }
            .math-block-warning .math-block-header { background: #450a0a; color: #fca5a5; }
            .math-block-warning .math-block-body { color: #fecaca; }

            .math-block-remark { background: #082f49; border-left: 5px solid #38bdf8; }
            .math-block-remark .math-block-header { background: #0c4a6e; color: #7dd3fc; }
            .math-block-remark .math-block-body { color: #bae6fd; }
        ` : `
            .math-block-definition { background: #eff6ff; border-left: 5px solid #3b82f6; }
            .math-block-definition .math-block-header { background: #dbeafe; color: #1d4ed8; }
            .math-block-definition .math-block-body { color: #1e3a8a; }

            .math-block-theorem { background: #f5f3ff; border-left: 5px solid #8b5cf6; }
            .math-block-theorem .math-block-header { background: #ede9fe; color: #6d28d9; }
            .math-block-theorem .math-block-body { color: #4c1d95; }

            .math-block-lemma { background: #f5f3ff; border-left: 5px solid #7c3aed; }
            .math-block-lemma .math-block-header { background: #ede9fe; color: #5b21b6; }
            .math-block-lemma .math-block-body { color: #3b0764; }

            .math-block-corollary { background: #fdf4ff; border-left: 5px solid #a21caf; }
            .math-block-corollary .math-block-header { background: #fae8ff; color: #86198f; }
            .math-block-corollary .math-block-body { color: #4a044e; }

            .math-block-proposition { background: #eef2ff; border-left: 5px solid #4f46e5; }
            .math-block-proposition .math-block-header { background: #e0e7ff; color: #3730a3; }
            .math-block-proposition .math-block-body { color: #1e1b4b; }

            .math-block-proof { background: #f8fafc; border-left: 5px solid #64748b; }
            .math-block-proof .math-block-header { background: #f1f5f9; color: #334155; }
            .math-block-proof .math-block-body { color: #1e293b; font-style: italic; }

            .math-block-example { background: #f0fdf4; border-left: 5px solid #16a34a; }
            .math-block-example .math-block-header { background: #dcfce7; color: #15803d; }
            .math-block-example .math-block-body { color: #14532d; }

            .math-block-question { background: #fff7ed; border-left: 5px solid #ea580c; }
            .math-block-question .math-block-header { background: #ffedd5; color: #c2410c; }
            .math-block-question .math-block-body { color: #7c2d12; }

            .math-block-answer { background: #f0fdfa; border-left: 5px solid #0d9488; }
            .math-block-answer .math-block-header { background: #ccfbf1; color: #0f766e; }
            .math-block-answer .math-block-body { color: #134e4a; }

            .math-block-note { background: #fffbeb; border-left: 5px solid #d97706; }
            .math-block-note .math-block-header { background: #fef3c7; color: #b45309; }
            .math-block-note .math-block-body { color: #78350f; }

            .math-block-warning { background: #fef2f2; border-left: 5px solid #dc2626; }
            .math-block-warning .math-block-header { background: #fee2e2; color: #b91c1c; }
            .math-block-warning .math-block-body { color: #7f1d1d; }

            .math-block-remark { background: #f0f9ff; border-left: 5px solid #0284c7; }
            .math-block-remark .math-block-header { background: #e0f2fe; color: #0369a1; }
            .math-block-remark .math-block-body { color: #0c4a6e; }
        `}
    </style>
</head>
<body>
    <div id="content" class="math-preview-root">
        ${contentHtml}
    </div>
    <script>
        var instanceId = "${instanceId}";
        var lastSentH = 0;
        function sendHeight() {
            try {
                var el = document.getElementById('content');
                if (!el) return;

                // Absolute positioning measures pure intrinsic content height
                var h = Math.ceil(Math.max(el.offsetHeight || 0, el.getBoundingClientRect().height || 0));

                if (h > 0 && Math.abs(h - lastSentH) >= 1) {
                    lastSentH = h;
                    var finalHeight = h + 1; // 1px rounding buffer
                    var msg = JSON.stringify({ id: instanceId, height: finalHeight, type: 'mathHeight' });

                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(msg);
                    }
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage(msg, '*');
                    }
                }
            } catch(e) {}
        }

        function renderMath() {
            try {
                if (typeof renderMathInElement !== 'undefined') {
                    renderMathInElement(document.body, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\\\[', right: '\\\\]', display: true},
                            {left: '\\\\(', right: '\\\\)', display: false}
                        ],
                        throwOnError: false,
                        trust: true
                    });
                }
            } catch (e) {}
            sendHeight();
        }

        if (typeof renderMathInElement !== 'undefined') {
            renderMath();
        } else {
            window.addEventListener('load', renderMath);
        }

        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);

        if (typeof ResizeObserver !== 'undefined') {
            var cEl = document.getElementById('content');
            if (cEl) {
                new ResizeObserver(function() {
                    sendHeight();
                }).observe(cEl);
            }
        }

        setTimeout(sendHeight, 50);
        setTimeout(sendHeight, 150);
        setTimeout(sendHeight, 350);
    </script>
</body>
</html>`;
}


