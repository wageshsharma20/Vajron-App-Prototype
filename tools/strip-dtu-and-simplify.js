/**
 * Strip "DTU" references from all replay JSONs and simplify notification vocab.
 * Run once: node tools/strip-dtu-and-simplify.js
 *
 * FIXED (see tools/repair-corrupted-datasets.js for the story): the original
 * version of this script walked the ENTIRE JSON object graph and ran the word
 * simplifications against every string it found. That's correct for narrative
 * text (event messages, suggested actions, recommendation text) but wrong for
 * structural/identifier strings that the app matches on exactly — and three of
 * the replacement words (canopy, irrigation, infrastructure) are also literal
 * TimelineKey/ScoreKey names and literal detector class names. The blanket
 * walk silently corrupted:
 *   - timelineFields (e.g. 'canopy' -> 'tree cover'), which broke every
 *     live per-frame lookup keyed on that field for 16 of 19 datasets —
 *     Dashboard cards and Reports items reading that field went to 0/NaN
 *     while a recording was playing.
 *   - detector class names in detectionClasses[].name, tracks[].cls and
 *     anomalies[].Anomaly (e.g. 'Tree Canopy' -> 'Tree tree cover'), which
 *     desynced them from classRollup's keys (untouched, since those are
 *     object keys, not values) — anything matching class names against
 *     classRollup silently stopped finding a whole class's anomaly rows.
 *   - clips[].zone / meta's "Zones covered" line, producing artifacts like
 *     "Garden & tree tree cover".
 *
 * This version simplifies only the fields that are genuinely free narrative
 * text (an explicit allowlist), and renames DTU-prefixed keys as before —
 * every other string in the tree is left byte-for-byte alone.
 */
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'src', 'data');

const files = fs.readdirSync(DATA).filter((f) => f.endsWith('Replay.json'));

// ── Word replacements for simpler English ──
const SIMPLIFY = [
  [/\bdecompacting\b/gi, 'loosening the soil'],
  [/\bdecompaction\b/gi, 'soil loosening'],
  [/\baeratingi?\b/gi, 'loosening'],
  [/\boverseeding\b/gi, 're-seeding'],
  [/\bre-turfing\b/gi, 'replanting grass'],
  [/\breturfing\b/gi, 'replanting grass'],
  [/\binfrastructure\b/gi, 'facilities'],
  [/\bdeterioration\b/gi, 'damage'],
  [/\bdeteriorating\b/gi, 'getting worse'],
  [/\balgal\b/gi, 'algae'],
  [/\bstagnant\b/gi, 'still'],
  [/\bcompacted\b/gi, 'hard-packed'],
  [/\bparterre\b/gi, 'garden beds'],
  [/\bornamental beds\b/gi, 'flower beds'],
  [/\bcanopy\b/gi, 'tree cover'],
  [/\bauthorised\b/gi, 'allowed'],
  [/\bprolonged\b/gi, 'long-term'],
  [/\bresurfacing\b/gi, 'repaving'],
  [/\bdiagnostic\b/gi, 'check'],
  [/\bvegetation\b/gi, 'plant growth'],
  [/\birrigation\b/gi, 'watering'],
];

function simplifyText(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const [pattern, replacement] of SIMPLIFY) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ── Key renames to strip DTU (safe: renames dictionary keys, never touches a
// value that has to match something elsewhere, e.g. a class name) ──
const KEY_RENAMES = {
  'DTU code': 'Code',
  'DTU sub-parameter': 'Sub-parameter',
  'DTU category': 'Category',
  'DTU Category': 'Category',
};

function renameKeysAndStripDTUWord(obj) {
  if (Array.isArray(obj)) return obj.map(renameKeysAndStripDTUWord);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[KEY_RENAMES[k] || k] = renameKeysAndStripDTUWord(v);
    }
    return out;
  }
  // Only the "DTU " prefix is stripped everywhere (e.g. "DTU category" values
  // like "A1 Plantation & Green Cover" never collide with anything else this
  // app matches on) — word-level simplification is NOT applied here.
  if (typeof obj === 'string') return obj.replace(/\bDTU\s*/gi, '');
  return obj;
}

/** Fields that are genuinely free narrative text — the only ones eligible for
 * word-level simplification. Everything else (class names, zone labels,
 * timelineFields, metadata) is identifier-shaped and must survive untouched. */
function simplifyProseFields(data) {
  if (Array.isArray(data.events)) {
    data.events = data.events.map((e) => ({ ...e, title: simplifyText(e.title), message: simplifyText(e.message) }));
  }
  if (Array.isArray(data.anomalies)) {
    data.anomalies = data.anomalies.map((a) => ({ ...a, 'Suggested action': simplifyText(a['Suggested action']) }));
  }
  if (Array.isArray(data.recommendations)) {
    data.recommendations = data.recommendations.map((r) => ({
      ...r,
      Finding: simplifyText(r.Finding),
      'Recommended action': simplifyText(r['Recommended action']),
    }));
  }
  if (Array.isArray(data.categoryA)) {
    data.categoryA = data.categoryA.map((r) => (r.Remark ? { ...r, Remark: simplifyText(r.Remark) } : r));
  }
  if (Array.isArray(data.headlineFindings)) {
    data.headlineFindings = data.headlineFindings.map(simplifyText);
  }
  return data;
}

let totalDTU = 0;
for (const file of files) {
  const p = path.join(DATA, file);
  const raw = fs.readFileSync(p, 'utf8');
  const dtuCount = (raw.match(/DTU/g) || []).length;
  totalDTU += dtuCount;

  const data = JSON.parse(raw);
  const cleaned = simplifyProseFields(renameKeysAndStripDTUWord(data));

  fs.writeFileSync(p, JSON.stringify(cleaned));
  console.log(`${file}: ${dtuCount} DTU refs removed`);
}

console.log(`\nStripped ${totalDTU} DTU references across ${files.length} files`);
console.log('Simplified vocabulary in narrative fields only (events, suggested actions, recommendations, headline findings)');
