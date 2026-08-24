/**
 * Generates a styled .xlsx + .pdf per DDA inspection category, per park — the
 * files behind the download icon on each Reports accordion row.
 *
 * Source of numbers: the per-clip replay datasets in src/data/*Replay.json —
 * NOT a fresh read of the original workbooks' own Summary/Category-Rollup
 * aggregate tables. Those tables are Excel formulas, and at least one of the
 * seven source workbooks (Sanjay Lake's) ships with those formulas uncached,
 * so reading them raw silently returns blanks. The replay datasets sidestep
 * that entirely: they were built by tools/convert-*.js, which recomputes every
 * aggregate directly from the Detection Log / Frame Timeline raw rows — the
 * same numbers already verified against each workbook's printed scorecard
 * earlier in this project. For a park surveyed as several clips, this script
 * aggregates across that park's clip files (sample-count-weighted means for
 * scores/coverage, summed records for detector classes, concatenated anomaly
 * rows) to produce one park-wide export — the multi-clip equivalent of what
 * Sanjay Lake's single file already contains in one place.
 *
 * Layout/palette: tools/lib/xlsx-writer.js and pdf-writer.js, both using the
 * navy/teal/pale-status palette read directly out of the source workbooks'
 * own xl/styles.xml.
 *
 * Run:  node tools/generate-category-reports.js
 */
const fs = require('fs');
const path = require('path');
const { writeStyledXlsx } = require('./lib/xlsx-writer');
const { writeStyledPdf } = require('./lib/pdf-writer');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const OUT_DIR = path.join(__dirname, '..', 'public', 'reports', 'categories');

// ---------------------------------------------------------------- parks
const PARKS = [
  { id: 'sanjay-lake', name: 'Sanjay Lake', locality: 'East Delhi (DDA)', source: 'Sanjay_Lake_Park_AI_Detection_Report.xlsx', clips: ['sanjayLakeReplay.json'] },
  { id: 'lala-harydal', name: 'Lala Harydal Park', locality: 'North Delhi (DDA)', source: 'Lala_Hardeval_AI_Detection_Report.xlsx', clips: ['lalaHardevalClip1Replay.json', 'lalaHardevalClip2Replay.json', 'lalaHardevalClip3Replay.json'] },
  { id: 'smriti-van-mayur-vihar', name: 'Smriti Van Mayur Vihar', locality: 'Mayur Vihar (DDA)', source: 'Smriti_Van_AI_Detection_Report.xlsx', clips: ['smritiVanClip1Replay.json', 'smritiVanClip2Replay.json', 'smritiVanClip3Replay.json', 'smritiVanClip4Replay.json'] },
  { id: 'r-block-asaf-ali', name: 'R Block, Asaf Ali Park', locality: 'Asaf Ali Road (DDA)', source: 'Asaf_Ali_AI_Detection_Report.xlsx', clips: ['asafAliClip1Replay.json', 'asafAliClip2Replay.json'] },
  { id: 'vasant-udyan', name: 'Vasant Udyan', locality: 'Vasant Kunj (DDA)', source: 'Vasant_Udyan_AI_Detection_Report.xlsx', clips: ['vasantUdyanClip1Replay.json', 'vasantUdyanClip2Replay.json'] },
  { id: 'vasant-vatika', name: 'Vasant Vatika', locality: 'Vasant Kunj (DDA)', source: 'Vasant_Vatika_AI_Detection_Report.xlsx', clips: ['vasantVatikaClip1Replay.json', 'vasantVatikaClip2Replay.json', 'vasantVatikaClip3Replay.json'] },
  { id: 'rohini-dda', name: 'DDA Park, Rohini', locality: 'Rohini (DDA)', source: 'Rohini_AI_Detection_Report.xlsx', clips: ['rohiniDdaClip1Replay.json', 'rohiniDdaClip2Replay.json', 'rohiniDdaClip3Replay.json'] },
];

// ---------------------------------------------------------------- vocabulary
// Exact strings used on-screen (src/replay/replayData.ts) so a downloaded
// figure always matches its on-screen label.
const SCORE_LABELS = {
  overall: 'Overall Park Health',
  green: 'Green Cover',
  plantation: 'Plantation Health',
  lawnScore: 'Lawn Quality',
  cleanliness: 'Cleanliness',
  irrigation: 'Irrigation Efficiency',
  infrastructure: 'Infrastructure',
  safety: 'Safety',
};
const COVERAGE_LABELS = {
  greenCover: 'Green cover',
  canopy: 'Tree canopy',
  lawn: 'Lawn cover',
  bareGround: 'Bare ground',
  dryVeg: 'Dry vegetation',
  debris: 'Ground debris',
  waterSurface: 'Water surface',
  algalShare: 'Algal share',
  exposedBed: 'Exposed bed',
  paved: 'Paved area',
  waterlogging: 'Waterlogging',
};

// One entry per Reports-tab accordion (src/data/mockData.ts's mockInspection).
// `classes` are the detector classes this category draws findings from;
// `keywords` match this category's recommendations by searching the source
// workbook's own "DTU category" / "Category" field.
const CATEGORIES = [
  {
    id: 'asset-inventory', label: 'Asset Inventory',
    scoreKey: null,
    coverageKeys: [],
    classes: ['Tree Stem', 'Bench', 'Play Equipment', 'Open Gym Equipment', 'Walking Track'],
    keywords: ['asset', 'bench', 'play equipment', 'gym', 'geo-tag'],
  },
  {
    id: 'plantation-green-cover', label: 'Plants & Trees',
    scoreKey: 'plantation',
    coverageKeys: ['canopy', 'lawn', 'greenCover'],
    classes: ['Tree Stem', 'Tree Canopy', 'Lawn / Grass', 'Shrub / Hedge', 'Dry / Dead Vegetation'],
    keywords: ['plantation', 'green cover', 'lawn', 'canopy'],
  },
  {
    id: 'plant-health', label: 'Plant Health',
    scoreKey: 'green',
    coverageKeys: ['greenCover', 'bareGround'],
    classes: ['Stressed Vegetation'],
    keywords: ['health', 'vigour', 'vigor', 'stress'],
  },
  {
    id: 'irrigation', label: 'Irrigation Status',
    scoreKey: 'irrigation',
    coverageKeys: ['bareGround', 'dryVeg', 'waterlogging'],
    classes: ['Waterlogging', 'Bare Ground Patch', 'Dry / Dead Vegetation'],
    keywords: ['irrigation', 'water', 'bare', 'dry ground', 'turf'],
  },
  {
    id: 'cleanliness', label: 'Cleanliness',
    scoreKey: 'cleanliness',
    coverageKeys: ['debris'],
    classes: ['Ground Litter / Debris', 'Rubble / Debris Pile'],
    keywords: ['cleanliness', 'litter', 'debris', 'housekeeping'],
  },
  {
    id: 'infrastructure', label: 'Infrastructure',
    scoreKey: 'infrastructure',
    coverageKeys: ['paved'],
    classes: ['Walking Track', 'Kerb / Edging', 'Bench', 'Open Gym Equipment', 'Pathway Obstruction', 'Paved Area', 'Excavation / Disturbed Ground', 'Material Stockpile', 'Construction Activity'],
    keywords: ['infrastructure', 'pathway', 'kerb', 'edging', 'hardscape', 'construction', 'excavat'],
  },
  {
    id: 'safety-security', label: 'Safety & Security',
    scoreKey: 'safety',
    coverageKeys: [],
    classes: ['Vehicle in Premises', 'Low-Visibility Zone', 'Construction Activity', 'Excavation / Disturbed Ground'],
    keywords: ['safety', 'security', 'vehicle', 'encroach', 'visibility'],
  },
  {
    id: 'water-bodies', label: 'Water Bodies',
    scoreKey: null,
    coverageKeys: ['waterSurface', 'algalShare', 'exposedBed'],
    classes: ['Water Body', 'Exposed Bed / Bank', 'Floating Waste'],
    keywords: ['water bod', 'lake', 'pond', 'algal', 'bank erosion'],
  },
  {
    id: 'landscape-quality', label: 'Landscape Quality',
    scoreKey: null,
    coverageKeys: ['bareGround', 'canopy'],
    classes: [],
    keywords: ['landscape', 'symmetry', 'aesthetic'],
  },
];

// ---------------------------------------------------------------- helpers
const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);
const fmtPct = (n) => (n == null || Number.isNaN(n) ? '—' : `${round1(n)}%`);
const fmtNum = (n) => (n == null || Number.isNaN(n) ? '—' : String(round1(n)));

/** Same four-tier rubric the source workbooks themselves use (verified against
 * eight printed Rating cells across two of the seven reports: every observed
 * mean/rating pair falls cleanly into one band). */
function rating(mean) {
  if (mean == null) return { text: '—', status: null };
  if (mean < 40) return { text: 'Critical', status: 'issue' };
  if (mean < 60) return { text: 'Poor', status: 'issue' };
  if (mean < 75) return { text: 'Fair', status: 'attention' };
  return { text: 'Good', status: 'good' };
}

function severityStatus(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 'issue';
  if (s === 'medium') return 'attention';
  return 'good';
}

/** Weighted mean/min/max across a park's clips for one summary.scores/coverage key. */
function aggregateStat(clips, group, key) {
  let sum = 0, w = 0, min = Infinity, max = -Infinity, any = false;
  for (const c of clips) {
    const agg = c.summary?.[group]?.[key];
    if (!agg) continue;
    const weight = c.meta?.sampleCount || c.timeline?.length || 1;
    sum += agg.mean * weight;
    w += weight;
    min = Math.min(min, agg.min);
    max = Math.max(max, agg.max);
    any = true;
  }
  if (!any) return { mean: null, min: null, max: null };
  return { mean: round1(sum / w), min: round1(min), max: round1(max) };
}

/** Loads a park's clip datasets and reduces them to one park-wide view. */
function aggregatePark(park) {
  const clips = park.clips.map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')));

  const scores = {};
  for (const key of Object.keys(SCORE_LABELS)) scores[key] = aggregateStat(clips, 'scores', key);
  const coverage = {};
  for (const key of Object.keys(COVERAGE_LABELS)) coverage[key] = aggregateStat(clips, 'coverage', key);

  const classRollup = {};
  for (const c of clips) {
    for (const [cls, st] of Object.entries(c.classRollup || {})) {
      if (!classRollup[cls]) classRollup[cls] = { count: 0, condSum: 0, condN: 0, worst: null };
      const r = classRollup[cls];
      r.count += st.count || 0;
      if (st.meanCondition != null) {
        r.condSum += st.meanCondition * (st.count || 0);
        r.condN += st.count || 0;
      }
      if (st.worstCondition != null) r.worst = r.worst == null ? st.worstCondition : Math.min(r.worst, st.worstCondition);
    }
  }
  for (const r of Object.values(classRollup)) {
    r.meanCondition = r.condN ? round1(r.condSum / r.condN) : null;
    r.worstCondition = r.worst;
  }

  const anomalies = [];
  for (const c of clips) {
    const zone = c.clips?.[0]?.zone || '';
    for (const a of c.anomalies || []) anomalies.push({ ...a, _zone: zone });
  }

  // recommendations / headlineFindings / meta are whole-park (identical across
  // every clip of the same park — verified: the converters never scope them to
  // a single clip), so any one clip's copy is the park-wide one.
  const first = clips[0];
  return {
    clipCount: clips.length,
    scores,
    coverage,
    classRollup,
    anomalies,
    recommendations: first.recommendations || [],
    headlineFindings: first.headlineFindings || [],
    meta: first.meta || {},
  };
}

function recMatchesCategory(rec, cat) {
  const field = (rec['DTU category'] || rec['Category'] || '').toLowerCase();
  const finding = (rec['Finding'] || '').toLowerCase();
  return cat.keywords.some((k) => field.includes(k) || finding.includes(k));
}

const MAX_ANOMALY_ROWS = 40;

/** Builds the shared block model both writers render from. */
function buildBlocks(park, agg, cat) {
  const blocks = [];

  if (cat.scoreKey) {
    const s = agg.scores[cat.scoreKey];
    const rt = rating(s.mean);
    blocks.push({ type: 'banner', text: 'CATEGORY SCORE' });
    blocks.push({
      type: 'table',
      header2: 'teal',
      widths: [30, 12, 12, 12, 16],
      headers: ['Indicator', 'Mean', 'Min', 'Max', 'Rating'],
      rows: [[SCORE_LABELS[cat.scoreKey], fmtPct(s.mean), fmtPct(s.min), fmtPct(s.max), { text: rt.text, status: rt.status }]],
    });
    blocks.push({ type: 'spacer' });
  }

  const covRows = cat.coverageKeys
    .map((k) => {
      const v = agg.coverage[k];
      if (!v || v.mean == null) return null;
      return [COVERAGE_LABELS[k], fmtPct(v.mean), fmtPct(v.min), fmtPct(v.max)];
    })
    .filter(Boolean);
  if (covRows.length) {
    blocks.push({ type: 'banner', text: 'SCENE COVERAGE (park-wide mean)' });
    blocks.push({ type: 'table', widths: [28, 12, 12, 12], headers: ['Metric', 'Mean', 'Min', 'Max'], rows: covRows });
    blocks.push({ type: 'spacer' });
  }

  if (cat.classes.length) {
    const classRows = cat.classes.map((cls) => {
      const r = agg.classRollup[cls];
      if (!r || !r.count) {
        return [{ text: cls, muted: true }, '0', { text: '—', muted: true }, { text: '—', muted: true }, { text: 'Not observed in these clips', muted: true }];
      }
      const rt = rating(r.meanCondition);
      return [cls, String(r.count), fmtNum(r.meanCondition), fmtNum(r.worstCondition), { text: rt.text, status: rt.status }];
    });
    blocks.push({ type: 'banner', text: 'DETECTOR FINDINGS' });
    blocks.push({
      type: 'table',
      widths: [26, 10, 12, 10, 14],
      headers: ['Detector class', 'Records', 'Mean cond. %', 'Worst %', 'Condition'],
      rows: classRows,
    });
    blocks.push({ type: 'spacer' });
  }

  const catAnomalies = agg.anomalies
    .filter((a) => cat.classes.includes(a.Anomaly))
    .sort((a, b) => parseFloat(a['Condition %'] ?? 100) - parseFloat(b['Condition %'] ?? 100));
  if (catAnomalies.length) {
    const shown = catAnomalies.slice(0, MAX_ANOMALY_ROWS);
    blocks.push({ type: 'banner', text: 'ANOMALIES (worst first)' });
    blocks.push({
      type: 'table',
      widths: [7, 20, 18, 10, 10, 35],
      headers: ['Priority', 'Zone', 'Anomaly', 'Severity', 'Cond. %', 'Suggested action'],
      rows: shown.map((a) => [
        String(a.Priority ?? ''),
        a._zone || '',
        a.Anomaly || '',
        { text: a.Severity || '', status: severityStatus(a.Severity) },
        fmtNum(parseFloat(a['Condition %'])),
        a['Suggested action'] || '',
      ]),
    });
    if (catAnomalies.length > MAX_ANOMALY_ROWS) {
      blocks.push({
        type: 'note',
        text: `Showing the worst ${MAX_ANOMALY_ROWS} of ${catAnomalies.length} tracked instances in this category.`,
      });
    }
    blocks.push({ type: 'spacer' });
  }

  const catRecs = agg.recommendations.filter((r) => recMatchesCategory(r, cat));
  if (catRecs.length) {
    blocks.push({ type: 'banner', text: 'RECOMMENDED ACTIONS' });
    blocks.push({
      type: 'table',
      widths: [6, 12, 32, 32, 18],
      headers: ['#', 'Priority', 'Finding', 'Recommended action', 'Owner'],
      rows: catRecs.map((r) => [
        String(r['#'] ?? ''),
        { text: r.Priority || '', status: severityStatus(r.Priority) },
        r.Finding || '',
        r['Recommended action'] || '',
        r.Owner || '',
      ]),
    });
    blocks.push({ type: 'spacer' });
  }

  if (!cat.scoreKey && !covRows.length && !cat.classes.length && !catAnomalies.length && !catRecs.length) {
    blocks.push({ type: 'banner', text: 'CATEGORY SCORE' });
    blocks.push({ type: 'note', text: 'Not assessable from this RGB drone survey — no dedicated finding in this category for this park.' });
    blocks.push({ type: 'spacer' });
  }

  blocks.push({
    type: 'note',
    text:
      `Generated from ${park.source} · DDA AI Park Monitor. Figures are the park-wide mean across ${agg.clipCount} analysed ` +
      `clip${agg.clipCount > 1 ? 's' : ''}, recomputed directly from the detection log rather than the workbook's own summary formulas.`,
  });

  return blocks;
}

// ---------------------------------------------------------------- main
function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  let xlsxCount = 0, pdfCount = 0;

  for (const park of PARKS) {
    console.log(`\n=== ${park.name} ===`);
    const agg = aggregatePark(park);
    const surveyDate = agg.meta['Survey date'] || agg.meta['Capture date (from filename)'] || '';

    for (const cat of CATEGORIES) {
      const blocks = buildBlocks(park, agg, cat);
      const title = `${park.name.toUpperCase()} — ${cat.label.toUpperCase()}`;
      const subtitle = `Category export · AI Drone Survey · DDA / DTU parameter framework`;
      const meta = [`Site: ${park.name}, ${park.locality}`, `Survey date: ${surveyDate}`, `Category: ${cat.label}`];

      const xlsxPath = path.join(OUT_DIR, park.id, `${cat.id}.xlsx`);
      writeStyledXlsx(xlsxPath, { sheetName: cat.label, title, subtitle, meta, blocks, colCount: 6 });
      xlsxCount++;

      const pdfPath = path.join(OUT_DIR, park.id, `${cat.id}.pdf`);
      writeStyledPdf(pdfPath, { title, subtitle, meta, blocks });
      pdfCount++;
    }
    console.log(`  wrote ${CATEGORIES.length} categories x2 formats`);
  }

  console.log(`\nDone: ${xlsxCount} xlsx + ${pdfCount} pdf written to ${path.relative(process.cwd(), OUT_DIR)}/`);
}

main();
