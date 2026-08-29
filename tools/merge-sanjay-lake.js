/**
 * Joins the Sanjay Lake park survey and the works-zone clip into one dataset.
 *
 *   sanjayLakeReplay.json              clips 1-4, 180.455 s of video
 *   sanjayLakeConstructionReplay.json  clip 5,     38.039 s of video
 *   -->  sanjayLakeFullReplay.json     one 218.494 s survey
 *
 * The two clips now ship as a single MP4 (assets/video/sanjay-lake-full.mp4,
 * built by the same concatenation), so the app needs one dataset on one clock
 * rather than two datasets swapped at a boundary. Everything from the works-zone
 * clip is shifted by OFFSET_SEC — the exact duration of the first video, not the
 * dataset's own `globalEnd`, because the clock the app reads is the video's.
 *
 * Both inputs stay pristine, so this is re-runnable: rerun it after
 * tools/patch-events.js changes either clip's notifications.
 *
 * Run: node tools/merge-sanjay-lake.js
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'src', 'data');
const SURVEY = 'sanjayLakeReplay.json';
const WORKS = 'sanjayLakeConstructionReplay.json';
const OUT = 'sanjayLakeFullReplay.json';

/**
 * Where the works-zone clip begins on the joined clock: the measured duration of
 * sanjay-lake-detection.mp4. The survey dataset's last timeline sample is at
 * 180.15 s and its `globalEnd` is 180.18, both slightly short of the video —
 * using either would slide the works-zone figures ahead of its picture.
 */
const OFFSET_SEC = 180.455;
/** Measured duration of the joined video, and so of the merged dataset. */
const TOTAL_SEC = 218.4937;

const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;
const num = (v) => (v === '' || v === '-' || v == null ? null : Number(v));

const survey = read(SURVEY);
const works = read(WORKS);

if (JSON.stringify(survey.timelineFields) !== JSON.stringify(works.timelineFields)) {
  throw new Error('timelineFields differ between the two clips — merge would misalign columns');
}
if (JSON.stringify(survey.detectionFields) !== JSON.stringify(works.detectionFields)) {
  throw new Error('detectionFields differ between the two clips');
}

// ── Detection classes ───────────────────────────────────────────────────────
// The two clips were converted independently and number their classes
// differently — the works-zone run has five classes the park survey never saw
// (stockpiles, rubble piles, construction activity, excavation, obstruction).
// Survey indices are kept as-is so its detections need no rewriting; works-zone
// detections are remapped by class name onto the union.
const classes = survey.detectionClasses.map((c) => ({ ...c }));
const indexByName = new Map(classes.map((c) => [c.name, c.index]));
for (const c of works.detectionClasses) {
  if (!indexByName.has(c.name)) {
    const index = classes.length;
    classes.push({ ...c, index });
    indexByName.set(c.name, index);
  }
}
const worksRemap = new Map(works.detectionClasses.map((c) => [c.index, indexByName.get(c.name)]));

// ── Timeline, zones, detections, tracks ─────────────────────────────────────
const timeline = [
  ...survey.timeline.map((row) => row.slice()),
  ...works.timeline.map((row) => {
    const next = row.slice();
    next[0] = round(next[0] + OFFSET_SEC);
    return next;
  }),
];

const zones = [...survey.zones, ...works.zones];
if (zones.length !== timeline.length) {
  throw new Error(`zones (${zones.length}) and timeline (${timeline.length}) lengths disagree`);
}

const detections = [
  ...survey.detections.map((d) => [d[0], d[1]]),
  ...works.detections.map(([t, rows]) => [
    round(t + OFFSET_SEC),
    rows.map((r) => [worksRemap.get(r[0]), r[1], r[2], r[3]]),
  ]),
];

const tracks = [
  ...survey.tracks,
  ...works.tracks.map((t) => ({
    ...t,
    first: round(t.first + OFFSET_SEC),
    last: round(t.last + OFFSET_SEC),
  })),
];

// ── Clips ───────────────────────────────────────────────────────────────────
// Clip 4's end is stretched from its dataset value (180.18) to the video join,
// so no instant between the two clips falls outside every clip and reads as an
// empty zone.
const clips = survey.clips.map((c) => ({ ...c }));
clips[clips.length - 1].end = OFFSET_SEC;
clips.push({
  clip: `Clip ${clips.length + 1}`,
  zone: 'Works zone — pathway construction',
  start: OFFSET_SEC,
  end: TOTAL_SEC,
});

// ── Notifications ───────────────────────────────────────────────────────────
const events = [
  ...survey.events,
  ...works.events.map((e) => ({ ...e, time: round(e.time + OFFSET_SEC, 1) })),
].sort((a, b) => a.time - b.time);

// ── Summary ─────────────────────────────────────────────────────────────────
// Recomputed over the joined timeline rather than blended from the two clips'
// own aggregates: a mean of two means would weight a 38 s clip as heavily as a
// 180 s one, and min/max cannot be recovered from summaries at all.
const idx = {};
survey.timelineFields.forEach((f, i) => (idx[f] = i));
const aggregate = (keys) => {
  const out = {};
  for (const key of keys) {
    const col = idx[key];
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (const row of timeline) {
      const v = row[col];
      if (typeof v !== 'number') continue;
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }
    out[key] = {
      mean: round(sum / timeline.length, 1),
      min: round(min, 1),
      max: round(max, 1),
    };
  }
  return out;
};
const summary = {
  scores: aggregate(Object.keys(survey.summary.scores)),
  coverage: aggregate(Object.keys(survey.summary.coverage)),
};

// ── Class rollup ────────────────────────────────────────────────────────────
// Keyed by class name in both inputs, so this folds cleanly: counts add, the
// mean is re-weighted by count, and "worst" is the lower of the two.
const classRollup = {};
for (const [name, r] of Object.entries(survey.classRollup)) classRollup[name] = { ...r };
for (const [name, r] of Object.entries(works.classRollup)) {
  const cur = classRollup[name];
  if (!cur) {
    classRollup[name] = { ...r };
    continue;
  }
  const total = cur.count + r.count;
  const means = [cur, r].filter((x) => x.meanCondition != null);
  classRollup[name] = {
    count: total,
    meanCondition: means.length
      ? round(means.reduce((a, x) => a + x.meanCondition * x.count, 0) /
          means.reduce((a, x) => a + x.count, 0), 1)
      : null,
    worstCondition: [cur.worstCondition, r.worstCondition].filter((v) => v != null).length
      ? Math.min(...[cur.worstCondition, r.worstCondition].filter((v) => v != null))
      : null,
  };
}

// ── Anomalies ───────────────────────────────────────────────────────────────
// The works-zone rows carry no Clip/Zone columns because that report covered a
// single zone; they are filled in here so the joined table stays one shape.
// Priority is renumbered across the combined list, worst condition first, since
// two independently-numbered "Priority 1" rows in one table means nothing.
const worksClipLabel = clips[clips.length - 1].clip;
const worksZoneLabel = clips[clips.length - 1].zone;
const anomalies = [
  ...survey.anomalies.map((a) => ({ ...a })),
  ...works.anomalies.map((a) => ({
    Priority: a.Priority,
    Clip: worksClipLabel,
    Zone: worksZoneLabel,
    'Track ID': a['Track ID'],
    Code: a.Code,
    Anomaly: a.Anomaly,
    'Sub-parameter': a['Sub-parameter'],
    Severity: a.Severity,
    'Condition %': a['Condition %'],
    'First seen (s)': String(round(Number(a['First seen (s)']) + OFFSET_SEC)),
    'Last seen (s)': String(round(Number(a['Last seen (s)']) + OFFSET_SEC)),
    'Peak area (px)': a['Peak area (px)'],
    'Suggested action': a['Suggested action'],
  })),
]
  .sort((a, b) => (num(a['Condition %']) ?? 999) - (num(b['Condition %']) ?? 999))
  .map((a, i) => ({ ...a, Priority: String(i + 1) }));

// ── Recommendations ─────────────────────────────────────────────────────────
const recommendations = [
  ...survey.recommendations.map((r) => ({ ...r })),
  ...works.recommendations.map((r) => ({
    '#': r['#'],
    Priority: r.Priority,
    Zone: worksZoneLabel,
    Category: r.Category,
    Finding: r.Finding,
    'Recommended action': r['Recommended action'],
    Owner: r.Owner,
  })),
].map((r, i) => ({ ...r, '#': String(i + 1) }));

// ── Category A ──────────────────────────────────────────────────────────────
// Matched on category + sub-parameter. A survey row gains a Clip 5 column and
// absorbs the works-zone record count; a sub-parameter only the works-zone clip
// saw is appended with its earlier clips left blank.
const clipCols = survey.clips.map((c) => c.clip);
const worksCol = worksClipLabel;
const keyOf = (r) => `${r.Category}|||${r['Sub-parameter']}`;
const worksByKey = new Map(works.categoryA.map((r) => [keyOf(r), r]));
const categoryA = survey.categoryA.map((row) => {
  const w = worksByKey.get(keyOf(row));
  const out = { ...row };
  if (!w) {
    out[worksCol] = '';
    return out;
  }
  worksByKey.delete(keyOf(row));
  const a = num(row.Records) ?? 0;
  const b = num(w.Records) ?? 0;
  out.Records = a + b;
  out[worksCol] = String(b);
  const ma = num(row['Mean cond. %']);
  const mb = num(w['Mean cond. %']);
  if (ma != null && mb != null && a + b > 0) out['Mean cond. %'] = round((ma * a + mb * b) / (a + b), 1);
  else if (mb != null && ma == null) out['Mean cond. %'] = mb;
  const wa = num(row['Worst %']);
  const wb = num(w['Worst %']);
  if (wa != null && wb != null) out['Worst %'] = Math.min(wa, wb);
  else if (wb != null && wa == null) out['Worst %'] = wb;
  if (w.Status === 'Detected') out.Status = 'Detected';
  return out;
});
for (const w of worksByKey.values()) {
  const out = { ...w };
  for (const c of clipCols) out[c] = '';
  out[worksCol] = String(num(w.Records) ?? '');
  categoryA.push(out);
}

// ── Meta ────────────────────────────────────────────────────────────────────
const meta = { ...survey.meta };
meta['Clips analysed'] = `5 drone clips, ${
  (Number(String(survey.meta['Clips analysed']).match(/([\d,]+) analysed frames/)?.[1]?.replace(/,/g, '')) || 0) +
  (Number(String(works.meta['Clip duration']).match(/([\d,]+) analysed frames/)?.[1]?.replace(/,/g, '')) || 0)
} analysed frames`;
meta['Total footage analysed'] = `${round(TOTAL_SEC, 1)} s (3840 x 2160 @ 59.94 fps source)`;
meta['Detection classes'] = `${classes.length} active classes mapped to Category A`;
meta['Annotated videos'] = 'Five clips joined into one MP4 file (sanjay-lake-full.mp4)';
meta[`${worksClipLabel} - ${worksZoneLabel}`] = String(works.meta['Site / zone'] ?? '');
meta.videoDurationSec = TOTAL_SEC;
meta.timelineEndSec = timeline[timeline.length - 1][0];
meta.sampleCount = timeline.length;
meta.generatedFrom = `${SURVEY} + ${WORKS} (tools/merge-sanjay-lake.js)`;

const merged = {
  meta,
  headlineFindings: [...survey.headlineFindings, ...works.headlineFindings],
  timelineFields: survey.timelineFields,
  timeline,
  zones,
  clips,
  globalEnd: TOTAL_SEC,
  detectionFields: survey.detectionFields,
  detectionClasses: classes,
  detections,
  tracks,
  classRollup,
  anomalies,
  recommendations,
  categoryA,
  categoryB: survey.categoryB,
  summary,
  events,
};

fs.writeFileSync(path.join(DATA, OUT), JSON.stringify(merged));
console.log(`${OUT} written`);
console.log(`  timeline   ${survey.timeline.length} + ${works.timeline.length} = ${timeline.length} samples, 0 → ${meta.timelineEndSec}s`);
console.log(`  detections ${survey.detections.length} + ${works.detections.length} = ${detections.length}`);
console.log(`  classes    ${survey.detectionClasses.length} + ${works.detectionClasses.length} → ${classes.length} (union)`);
console.log(`  clips      ${clips.length}, last ${clips[clips.length - 1].start} → ${clips[clips.length - 1].end}`);
console.log(`  anomalies  ${anomalies.length}   recommendations ${recommendations.length}   categoryA ${categoryA.length}`);
console.log(`  events     ${events.length}`);
events.forEach((e) => console.log(`    ${String(e.time).padStart(7)}s  [${e.type}]  ${e.title}`));
