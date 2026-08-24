/**
 * Minimal raw-XML .xlsx reader shared by every converter in this repo.
 *
 * This machine's Python has a broken expat, so every converter parses the OOXML
 * (a zip of XML files) directly with regex rather than a real XML parser or
 * openpyxl. Good enough for the flat, formula-free sheets these reports use.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function decode(s) {
  return s
    .replace(/&#10;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function colidx(ref) {
  const l = (ref || '').replace(/[^A-Z]/g, '');
  let n = 0;
  for (const c of l) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/** Unzips `xlsxPath` into a fresh temp dir and returns a reader bound to it. */
function openWorkbook(xlsxPath) {
  const tmp = path.join(require('os').tmpdir(), 'xlsx-read-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tmp, { recursive: true });
  execSync(`unzip -o -q "${xlsxPath}" -d "${tmp}"`);

  const shared = fs.existsSync(path.join(tmp, 'xl/sharedStrings.xml'))
    ? [...fs.readFileSync(path.join(tmp, 'xl/sharedStrings.xml'), 'utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
        decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')),
      )
    : [];

  // Attribute order in these two tags varies between files (some tools write
  // Id first, some write it last), so each attribute is pulled out on its own
  // rather than matched positionally against its neighbours in one regex.
  const attr = (tag, name) => {
    const m = tag.match(new RegExp(`${name}="([^"]*)"`));
    return m ? m[1] : null;
  };

  const relMap = {};
  for (const m of fs
    .readFileSync(path.join(tmp, 'xl/_rels/workbook.xml.rels'), 'utf8')
    .matchAll(/<Relationship\b[^>]*\/?>/g)) {
    const id = attr(m[0], 'Id');
    const target = attr(m[0], 'Target');
    if (id && target) relMap[id] = target;
  }
  const sheets = {};
  for (const m of fs.readFileSync(path.join(tmp, 'xl/workbook.xml'), 'utf8').matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = attr(m[0], 'name');
    const rid = attr(m[0], 'r:id');
    if (!name || !rid || !relMap[rid]) continue;
    // Target is written two ways across these files: relative to xl/ (the
    // common case, e.g. "worksheets/sheet1.xml") or absolute from the package
    // root (e.g. "/xl/worksheets/sheet1.xml"). Prepending "xl/" to an already-
    // absolute target doubled the path and broke every read of this workbook.
    const target = relMap[rid].replace(/^\//, '');
    sheets[decode(name)] = target.startsWith('xl/') ? target : 'xl/' + target;
  }

  function rowsOf(sheetName) {
    const xml = fs.readFileSync(path.join(tmp, sheets[sheetName]), 'utf8');
    const rows = [];
    for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = {};
      let max = -1;
      for (const cm of rm[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const idx = colidx(cm[1]);
        const attrs = cm[2];
        const inner = cm[3] || '';
        let val = '';
        const vm = inner.match(/<v>([\s\S]*?)<\/v>/);
        if (/t="s"/.test(attrs) && vm) val = shared[parseInt(vm[1], 10)];
        else if (/t="inlineStr"/.test(attrs)) {
          const im = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/);
          val = im ? decode(im[1]) : '';
        } else if (vm) val = vm[1];
        cells[idx] = val;
        if (idx > max) max = idx;
      }
      const arr = [];
      for (let i = 0; i <= max; i++) arr.push(cells[i] ?? '');
      rows.push(arr);
    }
    return rows;
  }

  /** Header-name -> column-index map for a sheet's given header row. */
  function headerIndex(sheetName, headerRow) {
    const row = rowsOf(sheetName)[headerRow] || [];
    const out = {};
    row.forEach((h, i) => {
      const key = String(h).trim().toLowerCase();
      if (key) out[key] = i;
    });
    return out;
  }

  /** First sheet name matching any of `candidates` (case-sensitive, as authored). */
  function sheetNamed(...candidates) {
    for (const c of candidates) if (sheets[c]) return c;
    return null;
  }

  function cleanup() {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  return { sheetNames: Object.keys(sheets), rowsOf, headerIndex, sheetNamed, cleanup };
}

const num = (x, d = null) => {
  const n = parseFloat(x);
  return Number.isFinite(n) ? n : d;
};

module.exports = { openWorkbook, decode, colidx, num };
