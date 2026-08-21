/**
 * Convert the R Block Asaf Ali AI detection workbook into the replay JSON the app plays.
 *
 * This workbook is a hybrid of the two earlier layouts: it is a FOUR-clip survey
 * (Clip / Zone columns, like Sanjay Lake) but carries the extended
 * construction-aware Frame Timeline columns. Columns are therefore resolved by
 * header name rather than by fixed index, so a shifted column cannot silently
 * feed the wrong series into a score.
 *
 * Each clip's Time(s) restarts at zero, so every timestamp — frame timeline,
 * detections, object tracks and anomalies — is rewritten onto one global clock
 * (cumulative sum of the prior clips' durations), which is what the concatenated
 * recording plays on.
 *
 * Notification events are emitted from this park's own findings; see EVENTS.
 *
 * Node is used rather than the Python converter because this machine's Python
 * has a broken expat. Run:  node tools/convert-asaf.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const XLSX =
  process.argv[3] || '/Users/wageshsharma/Downloads/Asaf_Ali_AI_Detection_Report.xlsx';
const OUT_DIR = process.argv[2] || path.join(__dirname, '..', 'src', 'data');

/**
 * The survey is delivered as four separate clip recordings, so one dataset is
 * built per clip with its clock rebased to zero — each file pairs 1:1 with the
 * video the app plays for it. The app chains the four in order, which is what
 * makes them read as a single continuous survey.
 *
 * `events` are the in-app alerts for that clip, each anchored to a real anomaly
 * in its register (time / severity / condition noted alongside) and fired a beat
 * after first-seen so the feature is on screen when the banner appears.
 */
const CLIPS = [
  {
    clip: 'Clip 1',
    out: 'asafAliClip1Replay.json',
    events: [
      // 0.00s Shrub/Hedge cond 50.6 · 13.83s Bare Ground cond 51.8
      // 20.97s Ground Litter High cond 36.9 · 32.34s Lawn cond 54.6
      { time: 6.0, type: 'info', title: 'Hedges need a trim', message: 'Shrub line growing uneven under the canopy — trimming would tidy it.' },
      { time: 16.0, type: 'info', title: 'A few bare patches', message: 'Some bare ground showing through the garden — could do with re-turfing.' },
      { time: 23.0, type: 'warning', title: 'Litter building up', message: 'Loose debris across the garden floor — this one could use a clean-up.' },
      { time: 35.0, type: 'info', title: 'Lawn could use attention', message: 'Grass thinning in places — overseeding would bring it back.' },
    ],
  },
  {
    clip: 'Clip 2',
    out: 'asafAliClip2Replay.json',
    events: [
      // 0.20s Walking Track High cond 41.5 · 0.00s Dry/Dead Veg cond 50.4
      // 10.08s Vehicle in Premises · 31.80s Shrub/Hedge cond 55.4
      { time: 4.0, type: 'warning', title: 'Path surface worn', message: 'Walking track showing wear by the pavilion — worth patching.' },
      { time: 12.0, type: 'info', title: 'Vehicle inside the park', message: 'A vehicle picked up within the boundary — worth confirming it is authorised.' },
      { time: 22.0, type: 'info', title: 'Some dry vegetation', message: 'Patches of dry growth near the pavilion — a watering round would help.' },
      { time: 34.0, type: 'info', title: 'Hedges need a trim', message: 'Shrub planting around the pavilion is getting shaggy — worth a trim.' },
    ],
  },
];

// ---------------------------------------------------------------- xlsx reader
const TMP = path.join(require('os').tmpdir(), 'asaf-xlsx-conv');
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

const relMap = {};
for (const m of fs
  .readFileSync(path.join(TMP, 'xl/_rels/workbook.xml.rels'), 'utf8')
  .matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  relMap[m[1]] = m[2];
}
const SHEETS = {};
for (const m of fs
  .readFileSync(path.join(TMP, 'xl/workbook.xml'), 'utf8')
  .matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
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

/** Map a header row to {normalisedHeader: columnIndex}. */
function headerIndex(row) {
  const out = {};
  row.forEach((h, i) => {
    const key = String(h).trim().toLowerCase();
    if (key) out[key] = i;
  });
  return out;
}
/** Resolve the first header that exists, or throw — a silent miss corrupts scores. */
function col(idx, names, { optional = false } = {}) {
  for (const n of names) {
    const k = n.toLowerCase();
    if (idx[k] !== undefined) return idx[k];
  }
  if (optional) return null;
  throw new Error(`Missing expected column: ${names[0]}`);
}


// ---------------------------------------------------------------- shared sheets
const ftRows = rowsOf('4. Frame Timeline');
const FTI = headerIndex(ftRows[0]);
const FT = ftRows.slice(1);
const C_CLIP = col(FTI, ['clip']);
const C_ZONE = col(FTI, ['zone']);
const C_TIME = col(FTI, ['time (s)']);

const dlRows = rowsOf('5. Detection Log');
const DLI = headerIndex(dlRows[1]);
const DL = dlRows.slice(2);
const D_CLIP = col(DLI, ['clip']);
const D_TIME = col(DLI, ['time (s)']);
const D_CODE = col(DLI, ['dtu code']);
const D_OBJ = col(DLI, ['detected object']);
const D_CAT = col(DLI, ['dtu category']);
const D_SUB = col(DLI, ['sub-parameter']);
const D_DEF = col(DLI, ['defect?']);
const D_COND = col(DLI, ['condition %']);
const D_CONF = col(DLI, ['confidence']);

const orRows = rowsOf('6. Object Register');
const ORI = headerIndex(orRows[1]);
const OR = orRows.slice(2);
const O_CLIP = col(ORI, ['clip']);
const O_CLS = col(ORI, ['object class']);
const O_FIRST = col(ORI, ['first seen (s)']);
const O_LAST = col(ORI, ['last seen (s)']);
const O_MEAN = col(ORI, ['mean condition %']);

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

// The app's fixed timeline schema. Each entry lists the acceptable workbook
// headers; a null resolution means these clips do not measure it, and it is
// written as 0 so the dashboard degrades honestly rather than inventing a figure.
const FIELD_HEADERS = {
  detections: ['detections'],
  greenCover: ['green cover %'],
  canopy: ['canopy %'],
  lawn: ['lawn %'],
  bareGround: ['bare ground %'],
  dryVeg: ['dry vegetation %', 'dry veg %'],
  debris: ['ground debris %'],
  stems: ['stems'],
  waterSurface: ['water %', 'water surface %'],
  algalShare: ['algal %'],
  exposedBed: ['exposed bed %'],
  paved: ['paved %'],
  waterlogging: ['waterlogging %'],
  overall: ['overall'],
  green: ['green'],
  plantation: ['plantation'],
  lawnScore: ['lawn score'],
  cleanliness: ['cleanliness'],
  irrigation: ['irrigation'],
  infrastructure: ['infrastructure'],
  safety: ['safety'],
};
const FIELD_SRC = {};
const notMeasured = [];
for (const [field, names] of Object.entries(FIELD_HEADERS)) {
  const c = col(FTI, names, { optional: true });
  FIELD_SRC[field] = c;
  if (c === null) notMeasured.push(field);
}
const TIMELINE_FIELDS = ['t', ...Object.keys(FIELD_SRC)];
const INT_FIELDS = new Set(['detections', 'stems']);
const SCORE_KEYS = ['overall', 'green', 'plantation', 'lawnScore', 'cleanliness', 'irrigation', 'infrastructure', 'safety'];
const COVERAGE_KEYS = ['greenCover', 'canopy', 'lawn', 'bareGround', 'dryVeg', 'debris', 'stems', 'waterSurface', 'algalShare', 'exposedBed', 'paved', 'waterlogging'];

// Summary metadata and headline findings describe the whole park, so every clip
// carries them; the per-clip figures come from that clip's own rows.
const sumRows = rowsOf('1. Summary');
const meta = {};
for (const row of sumRows) {
  if (row.length >= 2 && row[0] && row[1] && String(row[0]).includes(' ') && String(row[0]).length < 40) {
    if (String(row[1]).trim()) meta[row[0]] = row[1];
  }
}
const headlineFindings = sumRows
  .filter((r) => r[0] && String(r[0]).trim().startsWith('•'))
  .map((r) => String(r[0]).replace(/^•\s*/, '').trim());

const recommendations = table('7. Recommendations', 1);
const categoryA = table('3. Category Rollup', 2);
const anomalyRows = table('2. Anomaly Register', 2);

if (notMeasured.length) console.log('not measured in this park (written as 0):', notMeasured.join(', '));

// ---------------------------------------------------------------- per-clip build
/** Build one clip's dataset, with its clock rebased so the clip starts at zero. */
function buildClip(spec) {
  const { clip, out, events } = spec;
  const inScope = (c) => c === clip;
  // Rebased: this clip starts at 0, so its local times are already global.
  const localT = (t) => Math.round(t * 100) / 100;

  let zone = '';
  let end = 0;
  for (const r of FT) {
    if (!inScope(r[C_CLIP])) continue;
    const t = num(r[C_TIME]);
    if (t === null) continue;
    if (t > end) end = t;
    if (!zone) zone = r[C_ZONE];
  }
  if (end === 0) throw new Error(`No rows found for ${clip}`);
  const END = localT(end);

  // --- frame timeline
  const timeline = [];
  const zones = [];
  let prevSig = null;
  for (const r of FT) {
    if (!inScope(r[C_CLIP])) continue;
    const t = num(r[C_TIME]);
    if (t === null) continue;
    const row = [localT(t)];
    for (const [field, src] of Object.entries(FIELD_SRC)) {
      const val = src === null ? 0 : num(r[src], 0);
      row.push(INT_FIELDS.has(field) ? Math.round(val) : Math.round(val * 10) / 10);
    }
    const sig = row.slice(1).join(',');
    if (sig === prevSig) continue; // the workbook repeats each analysed frame (60 fps source)
    prevSig = sig;
    timeline.push(row);
    zones.push(r[C_ZONE]);
  }

  const agg = (field) => {
    const i = TIMELINE_FIELDS.indexOf(field);
    const c = timeline.map((row) => row[i]);
    return {
      mean: Math.round((c.reduce((a, b) => a + b, 0) / c.length) * 10) / 10,
      min: r1(Math.min(...c)),
      max: r1(Math.max(...c)),
    };
  };
  const summary = {
    scores: Object.fromEntries(SCORE_KEYS.map((f) => [f, agg(f)])),
    coverage: Object.fromEntries(COVERAGE_KEYS.map((f) => [f, agg(f)])),
  };

  // --- detection log
  const classes = new Map();
  const classId = (name, code, cat, sub) => {
    if (!classes.has(name)) classes.set(name, { name, code, category: cat, subParameter: sub, index: classes.size });
    return classes.get(name).index;
  };
  const byTime = new Map();
  const classStats = new Map();
  for (const r of DL) {
    const name = r[D_OBJ];
    const t = num(r[D_TIME]);
    if (!name || t === null || !inScope(r[D_CLIP])) continue;
    const gt = localT(t);
    const ci = classId(name, r[D_CODE], r[D_CAT], r[D_SUB]);
    const cond = num(r[D_COND]);
    const conf = num(r[D_CONF]);
    if (!byTime.has(gt)) byTime.set(gt, []);
    byTime.get(gt).push([
      ci,
      cond === null ? null : r1(cond),
      conf === null ? null : Math.round(conf * 100) / 100,
      r[D_DEF] === 'Yes' ? 1 : 0,
    ]);
    const st = classStats.get(name) || { n: 0, cs: 0, cn: 0, worst: null };
    st.n += 1;
    if (cond !== null) {
      st.cs += cond;
      st.cn += 1;
      st.worst = st.worst === null ? cond : Math.min(st.worst, cond);
    }
    classStats.set(name, st);
  }
  const detections = [...byTime.keys()].sort((a, b) => a - b).map((t) => [t, byTime.get(t)]);
  const classRollup = {};
  for (const [name, s] of classStats) {
    classRollup[name] = {
      count: s.n,
      meanCondition: s.cn ? Math.round((s.cs / s.cn) * 10) / 10 : null,
      worstCondition: r1(s.worst),
    };
  }

  // --- object register
  const tracks = [];
  for (const r of OR) {
    const cls = r[O_CLS];
    const first = num(r[O_FIRST]);
    if (!cls || first === null || !inScope(r[O_CLIP])) continue;
    tracks.push({
      cls,
      first: localT(first),
      last: localT(num(r[O_LAST], first)),
      cond: r1(num(r[O_MEAN])),
    });
  }

  // --- anomalies (Clip column dropped to match the app's Anomaly shape)
  const anomalies = anomalyRows
    .filter((a) => inScope(a['Clip'] || 'Clip 1'))
    .map((a) => {
      const first = num(a['First seen (s)']);
      const last = num(a['Last seen (s)']);
      return {
        Priority: a['Priority'],
        'Track ID': a['Track ID'],
        'DTU code': a['DTU code'],
        Anomaly: a['Anomaly'],
        'DTU sub-parameter': a['DTU sub-parameter'],
        Severity: a['Severity'],
        'Condition %': a['Condition %'],
        'First seen (s)': first === null ? '' : localT(first),
        'Last seen (s)': last === null ? '' : localT(last),
        'Peak area (px)': a['Peak area (px)'],
        'Suggested action': a['Suggested action'],
      };
    });

  // An event past the end of its clip would never fire — catch it here rather
  // than have it silently go missing during a demo.
  for (const ev of events) {
    if (ev.time >= END) throw new Error(`${clip}: event "${ev.title}" at ${ev.time}s is past the clip end (${END}s)`);
  }

  const payload = {
    meta: {
      ...meta,
      clip,
      zone,
      videoDurationSec: END,
      timelineEndSec: timeline[timeline.length - 1][0],
      sampleCount: timeline.length,
      generatedFrom: path.basename(XLSX),
    },
    clips: [{ clip, zone, start: 0, end: END }],
    globalEnd: END,
    headlineFindings,
    timelineFields: TIMELINE_FIELDS,
    timeline,
    zones,
    detectionClasses: [...classes.values()].map((c) => ({
      index: c.index,
      name: c.name,
      code: c.code,
      category: c.category,
      subParameter: c.subParameter,
    })),
    detectionFields: ['classIndex', 'condition', 'confidence', 'isDefect'],
    detections,
    classRollup,
    tracks,
    summary,
    events,
    anomalies,
    recommendations,
    categoryA,
    categoryB: [],
  };

  const outPath = path.join(OUT_DIR, out);
  fs.writeFileSync(outPath, JSON.stringify(payload));
  console.log(
    `\n${clip}  "${zone}"  0..${END}s  -> ${out} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`,
  );
  console.log(`  samples=${timeline.length} instants=${detections.length} classes=${classes.size} tracks=${tracks.length} anomalies=${anomalies.length}`);
  console.log(`  scores:`, Object.fromEntries(SCORE_KEYS.map((k) => [k, summary.scores[k].mean])));
  console.log(`  events:`, events.map((e) => `${e.time}s ${e.title}`).join(' | '));
  return { clip, zone, end: END, out };
}

const built = CLIPS.map(buildClip);
console.log('\n=== summary ===');
let total = 0;
for (const b of built) {
  console.log(`  ${b.clip}  ${b.zone.padEnd(24)} ${b.end.toFixed(2).padStart(7)}s  ${b.out}`);
  total += b.end;
}
console.log(`  total ${total.toFixed(2)}s across ${built.length} clips`);
