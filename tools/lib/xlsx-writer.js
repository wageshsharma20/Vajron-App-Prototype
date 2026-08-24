/**
 * Minimal styled .xlsx writer.
 *
 * Hand-rolls the OOXML package (no real XML library — the openpyxl route was
 * ruled out because this machine's Python has a broken expat, and the free
 * SheetJS writer has no cell-fill support). Every color/font value here was
 * extracted directly from the source AI Detection Report workbooks
 * (`xl/styles.xml`), so the generated files share their palette exactly:
 * navy #1F3B4D headers, teal #17706E accents, pale-tinted status fills.
 *
 * Cells are written as inline strings (`t="inlineStr"`) rather than using a
 * shared-string table — simpler to generate correctly, and these reports are
 * small enough that the size cost is irrelevant.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Strips XML-illegal control characters, then escapes the five XML entities.
const esc = (s) =>
  String(s)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const colLetter = (i) => {
  let n = i + 1,
    s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

// ---------------------------------------------------------------- style table
// Numbering is this module's own — unrelated to any source workbook's indices.
const FONTS = [
  { sz: 10, name: 'Arial' }, // 0 default
  { sz: 16, name: 'Arial', b: 1, color: '1F3B4D' }, // 1 title
  { sz: 10, name: 'Arial', i: 1, color: '4A6270' }, // 2 subtitle
  { sz: 11, name: 'Arial', b: 1, color: '1F3B4D' }, // 3 section banner
  { sz: 10, name: 'Arial', b: 1, color: 'FFFFFF' }, // 4 table header (on navy/teal)
  { sz: 10, name: 'Arial', b: 1, color: '1F3B4D' }, // 5 bold label
  { sz: 9, name: 'Arial', i: 1, color: '6B7A82' }, // 6 footer note
  { sz: 10, name: 'Arial', b: 1, color: '1F7A34' }, // 7 status: good
  { sz: 10, name: 'Arial', b: 1, color: 'B45309' }, // 8 status: attention
  { sz: 10, name: 'Arial', b: 1, color: 'A02B22' }, // 9 status: issue/critical
  { sz: 10, name: 'Arial', color: '4A6270' }, // 10 muted data
];

const FILLS = [
  null, // 0 none (required)
  { pattern: 'gray125' }, // 1 required placeholder slot
  { rgb: 'EAF1F4' }, // 2 banner
  { rgb: '1F3B4D' }, // 3 navy header
  { rgb: '17706E' }, // 4 teal header
  { rgb: 'F5F8FA' }, // 5 zebra row
  { rgb: 'D4EDD8' }, // 6 status bg: good
  { rgb: 'F7E7C4' }, // 7 status bg: attention
  { rgb: 'F2B8B0' }, // 8 status bg: issue/critical
];

const BORDER_THIN = { rgb: 'BFCDD4' };

// cellXfs: {font, fill, border:boolean, align, wrap, valign, indent}
const XF = {
  default: { font: 0, fill: 0, border: false },
  title: { font: 1, fill: 0, border: false },
  subtitle: { font: 2, fill: 0, border: false },
  banner: { font: 3, fill: 2, border: false, valign: 'center', indent: 1 },
  theadNavy: { font: 4, fill: 3, border: true, wrap: true, valign: 'center' },
  theadTeal: { font: 4, fill: 4, border: true, wrap: true, valign: 'center' },
  data: { font: 0, fill: 0, border: true, wrap: true, valign: 'top' },
  dataZebra: { font: 0, fill: 5, border: true, wrap: true, valign: 'top' },
  dataMuted: { font: 10, fill: 0, border: true, wrap: true, valign: 'top' },
  dataMutedZebra: { font: 10, fill: 5, border: true, wrap: true, valign: 'top' },
  label: { font: 5, fill: 0, border: true, wrap: true, valign: 'top' },
  labelZebra: { font: 5, fill: 5, border: true, wrap: true, valign: 'top' },
  statusGood: { font: 7, fill: 6, border: true, valign: 'center', align: 'center' },
  statusAttention: { font: 8, fill: 7, border: true, valign: 'center', align: 'center' },
  statusIssue: { font: 9, fill: 8, border: true, valign: 'center', align: 'center' },
  footer: { font: 6, fill: 0, border: false },
};
const XF_NAMES = Object.keys(XF);
const XF_INDEX = Object.fromEntries(XF_NAMES.map((n, i) => [n, i]));

function buildStylesXml() {
  const fontsXml = FONTS.map((f) => {
    const parts = [`<sz val="${f.sz}"/>`, f.color ? `<color rgb="FF${f.color}"/>` : '', `<name val="${f.name}"/>`];
    if (f.b) parts.push('<b/>');
    if (f.i) parts.push('<i/>');
    return `<font>${parts.join('')}</font>`;
  }).join('');

  const fillsXml = FILLS.map((f) => {
    if (f === null) return '<fill><patternFill patternType="none"/></fill>';
    if (f.pattern) return `<fill><patternFill patternType="${f.pattern}"/></fill>`;
    return `<fill><patternFill patternType="solid"><fgColor rgb="FF${f.rgb}"/><bgColor rgb="FF${f.rgb}"/></patternFill></fill>`;
  }).join('');

  const borderThin =
    `<left style="thin"><color rgb="FF${BORDER_THIN.rgb}"/></left>` +
    `<right style="thin"><color rgb="FF${BORDER_THIN.rgb}"/></right>` +
    `<top style="thin"><color rgb="FF${BORDER_THIN.rgb}"/></top>` +
    `<bottom style="thin"><color rgb="FF${BORDER_THIN.rgb}"/></bottom><diagonal/>`;
  const bordersXml = `<border><left/><right/><top/><bottom/><diagonal/></border><border>${borderThin}</border>`;

  const cellXfsXml = XF_NAMES.map((name) => {
    const s = XF[name];
    const align = [];
    if (s.wrap) align.push('wrapText="1"');
    if (s.valign) align.push(`vertical="${s.valign}"`);
    if (s.align) align.push(`horizontal="${s.align}"`);
    if (s.indent) align.push(`indent="${s.indent}"`);
    const alignXml = align.length ? `<alignment ${align.join(' ')}/>` : '';
    return (
      `<xf numFmtId="0" fontId="${s.font}" fillId="${s.fill}" borderId="${s.border ? 1 : 0}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"` +
      `${align.length ? ' applyAlignment="1"' : ''}>${alignXml}</xf>`
    );
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="0"/>
<fonts count="${FONTS.length}">${fontsXml}</fonts>
<fills count="${FILLS.length}">${fillsXml}</fills>
<borders count="2">${bordersXml}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${XF_NAMES.length}">${cellXfsXml}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

// ---------------------------------------------------------------- sheet body
/**
 * Blocks (each starts a new row group):
 *  { type:'banner', text }
 *  { type:'spacer' }
 *  { type:'table', headers:[str], rows:[[cellOrStr]], widths:[num], header2:'teal' }
 *    a row cell may be a plain string, or {text, status:'good'|'attention'|'issue', muted, bold}
 *  { type:'kv', rows:[[label,value]] }  -- simple two-column label/value pairs
 *  { type:'note', text }
 */
function buildSheetXml({ title, subtitle, meta, blocks, colCount }) {
  const rows = [];
  let r = 1;
  const merges = [];

  const pushRow = (cells, xfName, opts = {}) => {
    const xml = cells
      .map((c, i) => {
        const ref = `${colLetter(i)}${r}`;
        let text, style;
        if (c && typeof c === 'object') {
          text = c.text ?? '';
          style =
            c.status === 'good'
              ? 'statusGood'
              : c.status === 'attention'
              ? 'statusAttention'
              : c.status === 'issue' || c.status === 'critical'
              ? 'statusIssue'
              : c.muted
              ? opts.zebra
                ? 'dataMutedZebra'
                : 'dataMuted'
              : c.bold
              ? opts.zebra
                ? 'labelZebra'
                : 'label'
              : xfName || (opts.zebra ? 'dataZebra' : 'data');
        } else {
          text = c ?? '';
          style = xfName || (opts.zebra ? 'dataZebra' : 'data');
        }
        const sIdx = XF_INDEX[style];
        if (text === '' || text === null || text === undefined) {
          return `<c r="${ref}" s="${sIdx}"/>`;
        }
        return `<c r="${ref}" s="${sIdx}" t="inlineStr"><is><t xml:space="preserve">${esc(text)}</t></is></c>`;
      })
      .join('');
    rows.push({ r, xml, height: opts.height });
    r += 1;
  };

  const mergeRow = (text, xfName, span) => {
    const width = span ?? colCount;
    merges.push(`${colLetter(0)}${r}:${colLetter(width - 1)}${r}`);
    const sIdx = XF_INDEX[xfName];
    const xml =
      `<c r="${colLetter(0)}${r}" s="${sIdx}" t="inlineStr"><is><t xml:space="preserve">${esc(text)}</t></is></c>` +
      Array.from({ length: width - 1 }, (_, i) => `<c r="${colLetter(i + 1)}${r}" s="${sIdx}"/>`).join('');
    rows.push({ r, xml, height: xfName === 'title' ? 26 : xfName === 'banner' ? 20 : undefined });
    r += 1;
  };

  mergeRow(title, 'title');
  if (subtitle) mergeRow(subtitle, 'subtitle');
  r += 1; // spacer row

  if (meta && meta.length) {
    for (const line of meta) mergeRow(line, 'subtitle');
    r += 1;
  }

  for (const block of blocks) {
    if (block.type === 'spacer') {
      r += 1;
      continue;
    }
    if (block.type === 'banner') {
      mergeRow(block.text, 'banner');
      continue;
    }
    if (block.type === 'note') {
      mergeRow(block.text, 'footer');
      continue;
    }
    if (block.type === 'kv') {
      block.rows.forEach(([label, value], i) => {
        pushRow([{ text: label, bold: true }, value], null, { zebra: i % 2 === 1 });
      });
      r += 1;
      continue;
    }
    if (block.type === 'table') {
      const theadStyle = block.header2 === 'teal' ? 'theadTeal' : 'theadNavy';
      pushRow(block.headers, theadStyle, { height: 18 });
      block.rows.forEach((row, i) => pushRow(row, null, { zebra: i % 2 === 1 }));
      r += 1;
      continue;
    }
  }

  const sheetData = rows
    .map((row) => `<row r="${row.r}"${row.height ? ` ht="${row.height}" customHeight="1"` : ''}>${row.xml}</row>`)
    .join('');
  const cols = (blocks.find((b) => b.type === 'table')?.widths || [])
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${cols ? `<cols>${cols}</cols>` : ''}
<sheetData>${sheetData}</sheetData>
${merges.length ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

function buildWorkbookXml(sheetTitle) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${esc(sheetTitle).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

/** Writes one single-sheet styled workbook to `outPath`. */
function writeStyledXlsx(outPath, { sheetName = 'Report', title, subtitle, meta, blocks, colCount = 5 }) {
  const tmp = path.join(require('os').tmpdir(), 'xlsx-write-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(path.join(tmp, 'xl/worksheets'), { recursive: true });
  fs.mkdirSync(path.join(tmp, '_rels'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'xl/_rels'), { recursive: true });

  fs.writeFileSync(path.join(tmp, '[Content_Types].xml'), CONTENT_TYPES);
  fs.writeFileSync(path.join(tmp, '_rels/.rels'), ROOT_RELS);
  fs.writeFileSync(path.join(tmp, 'xl/_rels/workbook.xml.rels'), WORKBOOK_RELS);
  fs.writeFileSync(path.join(tmp, 'xl/workbook.xml'), buildWorkbookXml(sheetName));
  fs.writeFileSync(path.join(tmp, 'xl/styles.xml'), buildStylesXml());
  fs.writeFileSync(path.join(tmp, 'xl/worksheets/sheet1.xml'), buildSheetXml({ title, subtitle, meta, blocks, colCount }));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.rmSync(outPath, { force: true });
  execSync(`cd "${tmp}" && zip -q -X -r "${outPath}" .`);
  fs.rmSync(tmp, { recursive: true, force: true });
}

module.exports = { writeStyledXlsx };
