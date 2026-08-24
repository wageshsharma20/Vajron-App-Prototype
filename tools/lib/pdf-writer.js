/**
 * Minimal styled PDF writer.
 *
 * Hand-rolled (no pdf library is installed and none was added, to keep the repo
 * dependency-free) — PDF's page-content-stream format is plain text operators,
 * which is tractable to emit directly. Uses the base-14 Helvetica family only,
 * so no font embedding is needed and every PDF reader renders it identically.
 *
 * Driven by the SAME `blocks` structure as xlsx-writer.js, so a single content
 * description produces both the styled workbook and this PDF.
 */
const fs = require('fs');
const path = require('path');

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const NAVY = [0x1f / 255, 0x3b / 255, 0x4d / 255];
const TEAL = [0x17 / 255, 0x70 / 255, 0x6e / 255];
const BANNER_BG = [0xea / 255, 0xf1 / 255, 0xf4 / 255];
const ZEBRA_BG = [0xf5 / 255, 0xf8 / 255, 0xfa / 255];
const BORDER = [0xbf / 255, 0xcd / 255, 0xd4 / 255];
const MUTED = [0x4a / 255, 0x62 / 255, 0x70 / 255];
const WHITE = [1, 1, 1];
const GOOD_BG = [0xd4 / 255, 0xed / 255, 0xd8 / 255];
const GOOD_FG = [0x1f / 255, 0x7a / 255, 0x34 / 255];
const ATTN_BG = [0xf7 / 255, 0xe7 / 255, 0xc4 / 255];
const ATTN_FG = [0xb4 / 255, 0x53 / 255, 0x09 / 255];
const ISSUE_BG = [0xf2 / 255, 0xb8 / 255, 0xb0 / 255];
const ISSUE_FG = [0xa0 / 255, 0x2b / 255, 0x22 / 255];
const BLACK = [0.05, 0.05, 0.05];

// cp1252 (WinAnsi) code points for the handful of non-ASCII characters these
// reports use. Anything else falls back to '?' — deliberately conservative,
// since a silently wrong byte would corrupt the PDF's text encoding.
const WINANSI = { '—': 0x97, '–': 0x96, '·': 0xb7, '…': 0x85, '’': 0x92, '‘': 0x91 };

function pdfString(str) {
  const bytes = [];
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (cp < 128) bytes.push(cp);
    else if (WINANSI[ch] !== undefined) bytes.push(WINANSI[ch]);
    else bytes.push(0x3f); // '?'
  }
  let out = '';
  for (const b of bytes) {
    if (b === 0x28 || b === 0x29 || b === 0x5c) out += '\\' + String.fromCharCode(b);
    else out += String.fromCharCode(b);
  }
  return out;
}

function widthOf(str, size, bold) {
  // Helvetica AFM average-ish metrics; good enough for column-fit decisions,
  // not for justified typesetting.
  const wide = /[A-Z0-9MW]/;
  let w = 0;
  for (const ch of String(str)) w += (bold ? 0.62 : 0.56) * (wide.test(ch) ? 1.15 : 1) * size;
  return w;
}

/** Greedy word-wrap to fit `maxWidth`; returns an array of lines. */
function wrapText(str, maxWidth, size, bold) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? line + ' ' + w : w;
    if (widthOf(candidate, size, bold) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

class PdfDoc {
  constructor() {
    this.pages = [];
    this._newPage();
  }

  _newPage() {
    this.stream = [];
    this.pages.push(this.stream);
    this.y = PAGE_H - MARGIN;
  }

  ensureSpace(h) {
    if (this.y - h < MARGIN) this._newPage();
  }

  rect(x, y, w, h, [r, g, b]) {
    this.stream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  strokeRect(x, y, w, h, [r, g, b], lw = 0.6) {
    this.stream.push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${lw} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`,
    );
  }

  hline(x1, x2, y, [r, g, b], lw = 0.6) {
    this.stream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${lw} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`);
  }

  text(x, y, str, { size = 10, bold = false, italic = false, color = BLACK } = {}) {
    const font = bold ? '/FBold' : italic ? '/FItalic' : '/FReg';
    const [r, g, b] = color;
    this.stream.push(
      `BT ${font} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfString(str)}) Tj ET`,
    );
  }
}

/** Renders the same `blocks` model xlsx-writer.js consumes into a PDF doc. */
function renderReport(doc, { title, subtitle, meta, blocks }) {
  doc.text(MARGIN, doc.y, title, { size: 17, bold: true, color: NAVY });
  doc.y -= 22;
  if (subtitle) {
    doc.text(MARGIN, doc.y, subtitle, { size: 9.5, italic: true, color: MUTED });
    doc.y -= 16;
  }
  for (const line of meta || []) {
    doc.text(MARGIN, doc.y, line, { size: 9.5, italic: true, color: MUTED });
    doc.y -= 13;
  }
  doc.y -= 6;

  const banner = (text) => {
    doc.ensureSpace(26);
    doc.rect(MARGIN, doc.y - 18, CONTENT_W, 20, BANNER_BG);
    doc.text(MARGIN + 8, doc.y - 13, text, { size: 11, bold: true, color: NAVY });
    doc.y -= 26;
  };

  const kv = (rows) => {
    rows.forEach(([label, value], i) => {
      doc.ensureSpace(16);
      if (i % 2 === 1) doc.rect(MARGIN, doc.y - 12, CONTENT_W, 14, ZEBRA_BG);
      doc.text(MARGIN + 4, doc.y - 9, label, { size: 9.5, bold: true, color: NAVY });
      doc.text(MARGIN + 200, doc.y - 9, String(value), { size: 9.5, color: BLACK });
      doc.y -= 15;
    });
    doc.y -= 6;
  };

  const note = (text) => {
    doc.ensureSpace(14);
    for (const line of wrapText(text, CONTENT_W - 8, 8.5, false)) {
      doc.text(MARGIN + 4, doc.y - 9, line, { size: 8.5, italic: true, color: MUTED });
      doc.y -= 12;
    }
    doc.y -= 4;
  };

  const table = ({ headers, rows, widths, header2 }) => {
    const total = widths.reduce((a, b) => a + b, 0);
    const scale = CONTENT_W / total;
    const colW = widths.map((w) => w * scale);
    const colX = [MARGIN];
    for (let i = 1; i < colW.length; i++) colX.push(colX[i - 1] + colW[i - 1]);

    const drawHeader = () => {
      const hFill = header2 === 'teal' ? TEAL : NAVY;
      doc.rect(MARGIN, doc.y - 18, CONTENT_W, 20, hFill);
      headers.forEach((h, i) => doc.text(colX[i] + 4, doc.y - 13, h, { size: 8.5, bold: true, color: WHITE }));
      doc.y -= 20;
    };

    doc.ensureSpace(24);
    drawHeader();

    rows.forEach((row, ri) => {
      // Pre-wrap every cell so the row height matches its tallest cell.
      const wrapped = row.map((cell, ci) => {
        const c = cell && typeof cell === 'object' ? cell : { text: cell };
        return { ...c, lines: wrapText(c.text ?? '', colW[ci] - 8, 8.5, false) };
      });
      const lineCount = Math.max(1, ...wrapped.map((c) => c.lines.length));
      const rowH = lineCount * 11 + 6;

      if (doc.y - rowH < MARGIN) {
        doc._newPage();
        drawHeader();
      }

      if (ri % 2 === 1) doc.rect(MARGIN, doc.y - rowH, CONTENT_W, rowH, ZEBRA_BG);

      wrapped.forEach((c, ci) => {
        let bg = null,
          fg = BLACK,
          bold = false;
        if (c.status === 'good') {
          bg = GOOD_BG;
          fg = GOOD_FG;
          bold = true;
        } else if (c.status === 'attention') {
          bg = ATTN_BG;
          fg = ATTN_FG;
          bold = true;
        } else if (c.status === 'issue' || c.status === 'critical') {
          bg = ISSUE_BG;
          fg = ISSUE_FG;
          bold = true;
        } else if (c.muted) {
          fg = MUTED;
        } else if (c.bold) {
          fg = NAVY;
          bold = true;
        }
        if (bg) doc.rect(colX[ci] + 1, doc.y - rowH + 2, colW[ci] - 2, rowH - 4, bg);
        c.lines.forEach((line, li) => {
          doc.text(colX[ci] + 4, doc.y - 12 - li * 11, line, { size: 8.5, color: fg, bold });
        });
      });

      doc.hline(MARGIN, MARGIN + CONTENT_W, doc.y - rowH, BORDER, 0.4);
      doc.y -= rowH;
    });
    doc.y -= 10;
  };

  for (const block of blocks) {
    if (block.type === 'spacer') {
      doc.y -= 8;
      continue;
    }
    if (block.type === 'banner') banner(block.text);
    else if (block.type === 'kv') kv(block.rows);
    else if (block.type === 'note') note(block.text);
    else if (block.type === 'table') table(block);
    doc.ensureSpace(1);
  }
}

// ---------------------------------------------------------------- PDF bytes
function buildPdfBytes(pages) {
  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length; // 1-based object number
  };

  const fontReg = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const fontItalic = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

  const pageNums = [];
  const contentNums = [];

  for (const stream of pages) {
    const body = stream.join('\n');
    const cNum = addObj(`<< /Length ${Buffer.byteLength(body, 'latin1')} >>\nstream\n${body}\nendstream`);
    contentNums.push(cNum);
  }

  const pagesRefNum = objects.length + pages.length + 1; // Pages object comes after all page objects
  for (let i = 0; i < pages.length; i++) {
    const pNum = addObj(
      `<< /Type /Page /Parent ${pagesRefNum} 0 R /Resources << /Font << /FReg ${fontReg} 0 R /FBold ${fontBold} 0 R /FItalic ${fontItalic} 0 R >> >> /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentNums[i]} 0 R >>`,
    );
    pageNums.push(pNum);
  }

  const pagesObj = addObj(`<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>`);
  if (pagesObj !== pagesRefNum) throw new Error('internal: pages object numbering drifted');

  const catalogNum = addObj(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  let out = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

/** Writes a styled PDF built from the same block model as writeStyledXlsx. */
function writeStyledPdf(outPath, { title, subtitle, meta, blocks }) {
  const doc = new PdfDoc();
  renderReport(doc, { title, subtitle, meta, blocks });
  const bytes = buildPdfBytes(doc.pages);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, bytes);
}

module.exports = { writeStyledPdf };
