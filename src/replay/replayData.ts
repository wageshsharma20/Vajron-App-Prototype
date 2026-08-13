/**
 * Typed access layer over the Sanjay Lake Park AI detection replay dataset.
 *
 * The JSON is generated from Sanjay_Lake_Park_AI_Detection_Report.xlsx by
 * tools/convert-report.py. Rows are stored as plain number tuples rather than
 * objects to keep the bundled payload small; this module is the only place that
 * knows the tuple layout.
 */
import raw from '../data/sanjayLakeReplay.json';

export type ScoreKey =
  | 'overall'
  | 'green'
  | 'plantation'
  | 'lawnScore'
  | 'cleanliness'
  | 'irrigation'
  | 'infrastructure'
  | 'safety';

export type CoverageKey =
  | 'greenCover'
  | 'canopy'
  | 'lawn'
  | 'bareGround'
  | 'dryVeg'
  | 'debris'
  | 'stems'
  | 'waterSurface'
  | 'algalShare'
  | 'exposedBed'
  | 'paved'
  | 'waterlogging';

export type TimelineKey = 't' | 'detections' | ScoreKey | CoverageKey;

export type DetectionClass = {
  index: number;
  name: string;
  code: string;
  category: string;
  subParameter: string;
};

export type ActiveDetection = {
  className: string;
  code: string;
  condition: number | null;
  confidence: number | null;
  isDefect: boolean;
};

export type DetectionGroup = {
  className: string;
  code: string;
  count: number;
  meanCondition: number | null;
  hasDefect: boolean;
};

export type Anomaly = {
  Priority: string;
  'Track ID': string;
  'DTU code': string;
  Anomaly: string;
  'DTU sub-parameter': string;
  Severity: string;
  'Condition %': string;
  'First seen (s)': string;
  'Last seen (s)': string;
  'Peak area (px)': string;
  'Suggested action': string;
};

export type Recommendation = {
  '#': string;
  Priority: string;
  'DTU category': string;
  Finding: string;
  'Recommended action': string;
  Owner: string;
};

type Aggregate = { mean: number; min: number; max: number };

const FIELDS = raw.timelineFields as TimelineKey[];
const TIMELINE = raw.timeline as number[][];
const TIMES = TIMELINE.map((row) => row[0]);

const IDX = FIELDS.reduce<Record<string, number>>((acc, key, i) => {
  acc[key] = i;
  return acc;
}, {});

const CLASSES = raw.detectionClasses as DetectionClass[];
const CLASS_BY_INDEX = new Map(CLASSES.map((c) => [c.index, c]));

// [time, [[classIndex, condition, confidence, isDefect], ...]]
const DETECTIONS = raw.detections as [number, (number | null)[][]][];
const DETECTION_TIMES = DETECTIONS.map((d) => d[0]);

export const replayMeta = raw.meta as Record<string, string | number>;
export const headlineFindings = raw.headlineFindings as string[];
export const anomalies = raw.anomalies as unknown as Anomaly[];
export const recommendations = raw.recommendations as unknown as Recommendation[];
export const categoryA = raw.categoryA as Record<string, string | number>[];
export const categoryB = raw.categoryB as Record<string, string | number>[];
export const classRollup = raw.classRollup as Record<
  string,
  { count: number; meanCondition: number | null; worstCondition: number | null }
>;

export type ReplayEvent = {
  time: number;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
};
/** In-app alerts to raise as playback crosses notable findings (e.g. waterlogging). */
export const replayEvents = (raw.events ?? []) as ReplayEvent[];

export type ClipBound = { clip: string; zone: string; start: number; end: number };
/** The four concatenated survey clips, on the global clock. */
export const clips = (raw.clips ?? []) as ClipBound[];

/** Zone label for each timeline sample, parallel to `timeline`. */
const ZONES = (raw.zones ?? []) as string[];
export const clipSummary = raw.summary as {
  scores: Record<ScoreKey, Aggregate>;
  coverage: Record<CoverageKey, Aggregate>;
};

/** Total length of the analysed clip, in seconds. */
export const REPLAY_DURATION = TIMES[TIMES.length - 1];

/**
 * The burned-in overlay on the source video smooths its sub-scores over roughly
 * one second while printing coverage percentages instantaneously. Matching that
 * window keeps the app's figures identical to the numbers visible in the video,
 * and incidentally stops the readouts jittering at the 15 Hz sample rate.
 */
export const SCORE_SMOOTHING_SEC = 1.0;

/** Index of the last sample at or before `t`. Clamped to the array bounds. */
function indexAt(times: number[], t: number): number {
  if (t <= times[0]) return 0;
  if (t >= times[times.length - 1]) return times.length - 1;
  let lo = 0;
  let hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (times[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Raw instantaneous value of a single field at time `t`. */
export function valueAt(field: TimelineKey, t: number): number {
  return TIMELINE[indexAt(TIMES, t)][IDX[field]];
}

/** Trailing mean of `field` over `windowSec` ending at `t`. */
export function smoothedValueAt(field: TimelineKey, t: number, windowSec = SCORE_SMOOTHING_SEC): number {
  const end = indexAt(TIMES, t);
  const col = IDX[field];
  const from = t - windowSec;
  let sum = 0;
  let n = 0;
  for (let i = end; i >= 0 && TIMES[i] >= from; i -= 1) {
    sum += TIMELINE[i][col];
    n += 1;
  }
  return n === 0 ? TIMELINE[end][col] : sum / n;
}

export type ReplayFrame = {
  time: number;
  detections: number;
  scores: Record<ScoreKey, number>;
  coverage: Record<CoverageKey, number>;
};

const SCORE_KEYS: ScoreKey[] = [
  'overall',
  'green',
  'plantation',
  'lawnScore',
  'cleanliness',
  'irrigation',
  'infrastructure',
  'safety',
];

const COVERAGE_KEYS: CoverageKey[] = [
  'greenCover',
  'canopy',
  'lawn',
  'bareGround',
  'dryVeg',
  'debris',
  'stems',
  'waterSurface',
  'algalShare',
  'exposedBed',
  'paved',
  'waterlogging',
];

/** Zone (survey clip) label at time `t`. */
export function zoneAt(t: number): string {
  return ZONES[indexAt(TIMES, t)] ?? '';
}

/**
 * Everything the dashboard needs for a single instant: smoothed scores (to match
 * the video overlay) and instantaneous coverage percentages.
 */
export function frameAt(t: number): ReplayFrame {
  const i = indexAt(TIMES, t);
  const row = TIMELINE[i];

  const scores = {} as Record<ScoreKey, number>;
  for (const key of SCORE_KEYS) scores[key] = smoothedValueAt(key, t);

  const coverage = {} as Record<CoverageKey, number>;
  for (const key of COVERAGE_KEYS) coverage[key] = row[IDX[key]];

  return {
    time: row[0],
    detections: row[IDX.detections],
    scores,
    coverage,
  };
}

/** Individual detections logged at the sampled instant nearest to `t`. */
export function detectionsAt(t: number): ActiveDetection[] {
  const entry = DETECTIONS[indexAt(DETECTION_TIMES, t)];
  if (!entry) return [];
  return entry[1].map((d) => {
    const cls = CLASS_BY_INDEX.get(d[0] as number);
    return {
      className: cls?.name ?? 'Unknown',
      code: cls?.code ?? '',
      condition: d[1],
      confidence: d[2],
      isDefect: d[3] === 1,
    };
  });
}

/** Detections at `t`, collapsed to one row per class — the "detected in this frame" panel. */
export function detectionGroupsAt(t: number): DetectionGroup[] {
  const groups = new Map<string, { code: string; conds: number[]; count: number; defect: boolean }>();
  for (const d of detectionsAt(t)) {
    const g = groups.get(d.className) ?? { code: d.code, conds: [], count: 0, defect: false };
    g.count += 1;
    g.defect = g.defect || d.isDefect;
    if (d.condition !== null) g.conds.push(d.condition);
    groups.set(d.className, g);
  }
  return Array.from(groups.entries())
    .map(([className, g]) => ({
      className,
      code: g.code,
      count: g.count,
      meanCondition: g.conds.length
        ? Math.round((g.conds.reduce((a, b) => a + b, 0) / g.conds.length) * 10) / 10
        : null,
      hasDefect: g.defect,
    }))
    .sort((a, b) => b.count - a.count || a.className.localeCompare(b.className));
}

/** Anomalies whose tracked lifetime has begun by time `t`, worst first. */
export function anomaliesUpTo(t: number): Anomaly[] {
  return anomalies.filter((a) => Number(a['First seen (s)']) <= t);
}

type TrackRow = { cls: string; first: number; cond: number | null };
// Object tracks, already rewritten to the global clock by the converter.
const TRACKS = (raw.tracks ?? []) as TrackRow[];

/**
 * Number of distinct tracked objects of each class whose track has begun by `t`.
 * These grow as the survey plays — an asset the drone has flown over is "found".
 */
export function cumulativeCountsUpTo(t: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tr of TRACKS) {
    if (tr.first <= t) out[tr.cls] = (out[tr.cls] ?? 0) + 1;
  }
  return out;
}

/** Mean condition of a class across tracks found by `t` (null if none yet). */
export function meanConditionUpTo(cls: string, t: number): number | null {
  let sum = 0;
  let n = 0;
  for (const tr of TRACKS) {
    if (tr.first <= t && tr.cond !== null) {
      sum += tr.cond;
      n += 1;
    }
  }
  return n ? Math.round((sum / n) * 10) / 10 : null;
}

/** Sparkline source: `field` sampled at a fixed number of points up to `t`. */
export function seriesUpTo(field: TimelineKey, t: number, points = 48): number[] {
  const end = indexAt(TIMES, t);
  if (end <= 0) return [TIMELINE[0][IDX[field]]];
  const step = Math.max(1, Math.floor(end / points));
  const out: number[] = [];
  for (let i = 0; i <= end; i += step) out.push(TIMELINE[i][IDX[field]]);
  return out;
}

export const scoreLabels: Record<ScoreKey, string> = {
  overall: 'Overall Park Health',
  green: 'Green Cover',
  plantation: 'Plantation Health',
  lawnScore: 'Lawn Quality',
  cleanliness: 'Cleanliness',
  irrigation: 'Irrigation Efficiency',
  infrastructure: 'Infrastructure',
  safety: 'Safety',
};

export const coverageLabels: Record<CoverageKey, string> = {
  greenCover: 'Green cover',
  canopy: 'Tree canopy',
  lawn: 'Lawn cover',
  bareGround: 'Bare ground',
  dryVeg: 'Dry vegetation',
  debris: 'Ground debris',
  stems: 'Trees in view',
  waterSurface: 'Water surface',
  algalShare: 'Algal share',
  exposedBed: 'Exposed bed',
  paved: 'Paved area',
  waterlogging: 'Waterlogging',
};
