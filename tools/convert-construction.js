/**
 * Convert the Sanjay Lake "Construction / Works Zone" workbook into the same
 * replay JSON schema the app already consumes for the main survey.
 *
 * This is a SINGLE 38 s clip with its own sheet layout (no Clip/Zone columns,
 * a Construction-material-aware Frame Timeline, one Category Rollup). It maps
 * onto the app's fixed timeline/score/coverage keys; fields the works-zone clip
 * does not measure (dryVeg, stems, algalShare, exposedBed, paved) are written as
 * 0 so the dashboard degrades honestly rather than inventing figures.
 *
 * No notification events are emitted — this clip plays "without any delay".
 *
 * Node is used instead of the Python converter because this machine's Python
 * has a broken expat. Run:  node tools/convert-construction.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const XLSX =
  process.argv[3] ||
  '/Users/wageshsharma/Downloads/Sanjay_Lake_Park_Construction_Zone_Report.xlsx';
const OUT =
  process.argv[2] ||
  path.join(__dirname, '..', 'src', 'data', 'sanjayLakeConstructionReplay.json');

// ---------------------------------------------------------------- xlsx reader
const TMP = path.join(require('os').tmpdir(), 'constr-xlsx');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
execSync(`unzip -o -q "${XLSX}" -d "${TMP}"`);

const decode = (s) =>
  s
    .replace(/&#10;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const shared = [
  ...fs.readFileSync(path.join(TMP, 'xl/sharedStrings.xml'), 'utf8').matchAll(/<si>([\s\S]*?)<\/si>/g),
].map((m) => decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')));

const wbXml = fs.readFileSync(path.join(TMP, 'xl/workbook.xml'), 'utf8');
const relsXml = fs.readFileSync(path.join(TMP, 'xl/_rels/workbook.xml.rels'), 'utf8');
const relMap = {};
for (const m of relsXml.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  relMap[m[1]] = m[2];
}
const SHEETS = {};
for (const m of wbXml.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
  SHEETS[decode(m[1])] = 'xl/' + relMap[m[2]].replace(/^\//, '');
}

const colidx = (ref) => {
  const l = (ref || '').replace(/[^A-Z]/g, '');
  let n = 0;
  for (const c of l) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};

function rowsOf(name) {
  const xml = fs.readFileSync(path.join(TMP, SHEETS[name]), 'utf8');
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

const num = (x, d = null) => {
  const n = parseFloat(x);
  return Number.isFinite(n) ? n : d;
};
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

// ---------------------------------------------------------------- frame timeline
// Works-zone Frame Timeline columns:
// 0 Frame 1 Time 2 Detections 3 ConstrMat% 4 Rubble% 5 Stockpile% 6 Bare% 7 Debris%
// 8 Waterlog% 9 Green% 10 Canopy% 11 Lawn% 12 Water% 13 Overall 14 Green 15 Plantation
// 16 LawnScore 17 Cleanliness 18 Irrigation 19 Infrastructure 20 Safety 21 MeanExG
const FT = rowsOf('4. Frame Timeline').slice(1);

// App's fixed timeline schema. `src` is the works-zone column, or null → 0.
const FIELD_SRC = {
  detections: 2,
  greenCover: 9,
  canopy: 10,
  lawn: 11,
  bareGround: 6,
  dryVeg: null,
  debris: 7,
  stems: null,
  waterSurface: 12,
  algalShare: null,
  exposedBed: null,
  paved: null,
  waterlogging: 8,
  overall: 13,
  green: 14,
  plantation: 15,
  lawnScore: 16,
  cleanliness: 17,
  irrigation: 18,
  infrastructure: 19,
  safety: 20,
};
const TIMELINE_FIELDS = ['t', ...Object.keys(FIELD_SRC)];
const INT_FIELDS = new Set(['detections', 'stems']);

const timeline = [];
const zones = [];
let prevSig = null;
for (const r of FT) {
  const t = num(r[1]);
  if (t === null) continue;
  const row = [t];
  for (const [f, src] of Object.entries(FIELD_SRC)) {
    const val = src === null ? 0 : num(r[src], 0);
    row.push(INT_FIELDS.has(f) ? Math.round(val) : Math.round(val * 10) / 10);
  }
  const sig = row.slice(1).join(',');
  if (sig === prevSig) continue; // source 60 fps repeats each analysed frame
  prevSig = sig;
  timeline.push(row);
  zones.push('Works Zone');
}
const END = timeline[timeline.length - 1][0];

const agg = (field) => {
  const i = TIMELINE_FIELDS.indexOf(field);
  const col = timeline.map((row) => row[i]);
  return {
    mean: Math.round((col.reduce((a, b) => a + b, 0) / col.length) * 10) / 10,
    min: r1(Math.min(...col)),
    max: r1(Math.max(...col)),
  };
};
const SCORE_KEYS = ['overall', 'green', 'plantation', 'lawnScore', 'cleanliness', 'irrigation', 'infrastructure', 'safety'];
const COVERAGE_KEYS = ['greenCover', 'canopy', 'lawn', 'bareGround', 'dryVeg', 'debris', 'stems', 'waterSurface', 'algalShare', 'exposedBed', 'paved', 'waterlogging'];
const summary = {
  scores: Object.fromEntries(SCORE_KEYS.map((f) => [f, agg(f)])),
  coverage: Object.fromEntries(COVERAGE_KEYS.map((f) => [f, agg(f)])),
};

// ---------------------------------------------------------------- detection log
// 0 Frame 1 Time 2 DTUcode 3 Object 4 Category 5 Sub 6 Defect? 7 TrackID 8 X 9 Y
// 10 W 11 H 12 Cond% 13 Area% 14 Conf 15 Notes
const DL = rowsOf('5. Detection Log').slice(2);
const classes = new Map();
const classId = (name, code, cat, sub) => {
  if (!classes.has(name)) classes.set(name, { name, code, category: cat, subParameter: sub, index: classes.size });
  return classes.get(name).index;
};
const byTime = new Map();
const classStats = new Map();
for (const r of DL) {
  if (r.length < 15 || !r[3]) continue;
  const t = num(r[1]);
  if (t === null) continue;
  const ci = classId(r[3], r[2], r[4], r[5]);
  const cond = num(r[12]);
  const conf = num(r[14]);
  const defect = r[6] === 'Yes';
  const gt = Math.round(t * 100) / 100;
  if (!byTime.has(gt)) byTime.set(gt, []);
  byTime.get(gt).push([ci, cond === null ? null : r1(cond), conf === null ? null : Math.round(conf * 100) / 100, defect ? 1 : 0]);
  const st = classStats.get(r[3]) || { n: 0, cs: 0, cn: 0, worst: null };
  st.n += 1;
  if (cond !== null) {
    st.cs += cond;
    st.cn += 1;
    st.worst = st.worst === null ? cond : Math.min(st.worst, cond);
  }
  classStats.set(r[3], st);
}
const detections = [...byTime.keys()].sort((a, b) => a - b).map((t) => [t, byTime.get(t)]);
const classRollup = {};
for (const [name, s] of classStats) {
  classRollup[name] = { count: s.n, meanCondition: s.cn ? Math.round((s.cs / s.cn) * 10) / 10 : null, worstCondition: r1(s.worst) };
}

// ---------------------------------------------------------------- object register
// 0 TrackID 1 DTUcode 2 ObjectClass 3 Sub 4 FirstSeen 5 LastSeen 6 Frames 7 MeanCond 8 Worst 9 PeakArea 10 Defect?
const OR = rowsOf('6. Object Register').slice(2);
const tracks = [];
for (const r of OR) {
  if (r.length < 8 || !r[2]) continue;
  const fs2 = num(r[4]);
  if (fs2 === null) continue;
  tracks.push({ cls: r[2], first: fs2, last: num(r[5], fs2), cond: r1(num(r[7])) });
}

// ---------------------------------------------------------------- text tables
function table(name, headerRow) {
  const rs = rowsOf(name);
  const hdr = rs[headerRow];
  const out = [];
  for (const row of rs.slice(headerRow + 1)) {
    const rec = {};
    for (let i = 0; i < hdr.length; i++) if (hdr[i]) rec[hdr[i]] = row[i] ?? '';
    if (Object.values(rec).some((v) => String(v).trim())) out.push(rec);
  }
  return out;
}

// Anomaly Register (header row 2) → app Anomaly shape (drops Duration column).
const anomalies = table('2. Anomaly Register', 2).map((a) => ({
  Priority: a['Priority'],
  'Track ID': a['Track ID'],
  'DTU code': a['DTU code'],
  Anomaly: a['Anomaly'],
  'DTU sub-parameter': a['DTU sub-parameter'],
  Severity: a['Severity'],
  'Condition %': a['Condition %'],
  'First seen (s)': a['First seen (s)'],
  'Last seen (s)': a['Last seen (s)'],
  'Peak area (px)': a['Peak area (px)'],
  'Suggested action': a['Suggested action'],
}));

const recommendations = table('7. Recommendations', 1);
const categoryA = table('3. Category Rollup', 2);

// ---------------------------------------------------------------- metadata
const sumRows = rowsOf('1. Summary');
const meta = {};
for (const row of sumRows) {
  if (row.length >= 2 && row[0] && row[1] && !/^[A-Z ]+$/.test(String(row[0]).trim().length > 20 ? '' : row[0])) {
    // keep simple "Key || Value" metadata pairs, skip section banners
    if (String(row[0]).includes(' ') && String(row[1]).trim() && String(row[0]).length < 40) meta[row[0]] = row[1];
  }
}
const headlineFindings = sumRows.filter((r) => r[0] && String(r[0]).trim().startsWith('•')).map((r) => String(r[0]).replace(/^•\s*/, '').trim());

const payload = {
  meta: { ...meta, videoDurationSec: END, timelineEndSec: END, sampleCount: timeline.length, generatedFrom: path.basename(XLSX) },
  clips: [{ clip: 'Works Zone', zone: 'Pathway works area', start: 0, end: END }],
  globalEnd: END,
  headlineFindings,
  timelineFields: TIMELINE_FIELDS,
  timeline,
  zones,
  detectionClasses: [...classes.values()].map((c) => ({ index: c.index, name: c.name, code: c.code, category: c.category, subParameter: c.subParameter })),
  detectionFields: ['classIndex', 'condition', 'confidence', 'isDefect'],
  detections,
  classRollup,
  tracks,
  summary,
  events: [], // no timed notifications for this clip
  anomalies,
  recommendations,
  categoryA,
  categoryB: [],
};

fs.writeFileSync(OUT, JSON.stringify(payload));
console.log(`wrote ${OUT}  (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
console.log(`timeline: ${FT.length} rows -> ${timeline.length} unique samples, 0..${END}s`);
console.log(`classes (${classes.size}):`, [...classes.keys()].join(', '));
console.log('scores:', Object.fromEntries(SCORE_KEYS.map((k) => [k, summary.scores[k].mean])));
console.log('coverage:', Object.fromEntries(COVERAGE_KEYS.map((k) => [k, summary.coverage[k].mean])));
console.log(`anomalies: ${anomalies.length}, recommendations: ${recommendations.length}, categoryA: ${categoryA.length}, tracks: ${tracks.length}`);
