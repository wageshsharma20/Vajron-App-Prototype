/**
 * Targeted, minimal repair for src/data/sanjayLakeReplay.json.
 *
 * This file was corrupted by the same over-broad word-substitution bug now
 * fixed in tools/strip-dtu-and-simplify.js (see that file's header comment for
 * the full story): timelineFields entries and detector-class-name values got
 * mangled ('canopy' -> 'tree cover', etc.), which desyncs them from the app's
 * fixed key vocabulary and from this same file's own (untouched) classRollup
 * keys.
 *
 * Every other Sanjay Lake source workbook this project has is a different,
 * older single-clip (57.9 s) export — not the four-clip 180 s survey this
 * dataset represents — so a full reconvert isn't an option here. Instead this
 * repairs the corrupted strings in place, using the file's OWN classRollup
 * object (a plain dictionary; its keys were never touched by the bug, only
 * values elsewhere were) as ground truth for what each class name should read.
 *
 * Run:  node tools/repair-sanjay-lake.js
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'data', 'sanjayLakeReplay.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const CANONICAL_FIELDS = [
  't', 'detections', 'greenCover', 'canopy', 'lawn', 'bareGround', 'dryVeg', 'debris', 'stems',
  'waterSurface', 'algalShare', 'exposedBed', 'paved', 'waterlogging', 'overall', 'green',
  'plantation', 'lawnScore', 'cleanliness', 'irrigation', 'infrastructure', 'safety',
];

let changes = 0;

// 1. timelineFields: purely positional (KEEP's key order is identical across
// every converter in this repo), so a hard replacement is exactly right.
if (JSON.stringify(data.timelineFields) !== JSON.stringify(CANONICAL_FIELDS)) {
  console.log('timelineFields before:', JSON.stringify(data.timelineFields));
  data.timelineFields = CANONICAL_FIELDS;
  changes++;
  console.log('timelineFields after: ', JSON.stringify(data.timelineFields));
}

// 2. Class-name-shaped values: reverse the known bad substitutions, but only
// keep a candidate if it turns out to name a class classRollup already knows
// about — i.e. this file's own data proves it's the right name, not a guess.
const knownClasses = new Set(Object.keys(data.classRollup || {}));
const REVERSE = [
  [/\btree tree cover\b/gi, 'Tree Canopy'],
  [/\bDry \/ Dead plant growth\b/g, 'Dry / Dead Vegetation'],
  [/\bStressed plant growth\b/g, 'Stressed Vegetation'],
];
function repairClassName(name) {
  if (typeof name !== 'string' || knownClasses.has(name)) return name;
  for (const [pattern, replacement] of REVERSE) {
    if (pattern.test(name)) {
      const fixed = name.replace(pattern, replacement);
      if (knownClasses.has(fixed)) return fixed;
    }
  }
  return name;
}

for (const c of data.detectionClasses || []) {
  const fixed = repairClassName(c.name);
  if (fixed !== c.name) {
    console.log(`detectionClasses: "${c.name}" -> "${fixed}"`);
    c.name = fixed;
    changes++;
  }
}
for (const t of data.tracks || []) {
  const fixed = repairClassName(t.cls);
  if (fixed !== t.cls) {
    t.cls = fixed;
    changes++;
  }
}
for (const a of data.anomalies || []) {
  const fixed = repairClassName(a.Anomaly);
  if (fixed !== a.Anomaly) {
    a.Anomaly = fixed;
    changes++;
  }
}
console.log(`class-name value repairs: ${changes} field(s) touched so far`);

// 3. Zone / metadata prose: best-effort — same candidate check, but these are
// display labels, not join keys, so there's no ground-truth set to validate
// against. Only fix the exact "word tree cover" duplication artifact, which is
// unambiguous (the source word can only have been "canopy").
function dedupTreeCover(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/\btree tree cover\b/gi, 'tree canopy');
}
let zoneFixed = 0;
for (const c of data.clips || []) {
  const before = c.zone;
  c.zone = dedupTreeCover(c.zone);
  if (c.zone !== before) {
    zoneFixed++;
    console.log(`clips[].zone: "${before}" -> "${c.zone}"`);
  }
}
if (data.meta) {
  for (const [k, v] of Object.entries(data.meta)) {
    const fixed = dedupTreeCover(v);
    if (fixed !== v) {
      console.log(`meta['${k}']: "${v}" -> "${fixed}"`);
      data.meta[k] = fixed;
      zoneFixed++;
    }
  }
}
changes += zoneFixed;

// 4. DTU-prefixed keys, if this file still has the old naming (every other
// dataset in the repo already uses the short form).
const KEY_RENAMES = { 'DTU code': 'Code', 'DTU sub-parameter': 'Sub-parameter', 'DTU category': 'Category', 'DTU Category': 'Category' };
function renameKeys(obj) {
  if (Array.isArray(obj)) return obj.map(renameKeys);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[KEY_RENAMES[k] || k] = renameKeys(v);
    return out;
  }
  return obj;
}
const beforeKeys = JSON.stringify(Object.keys(data.anomalies?.[0] || {}));
const renamed = renameKeys(data);
const afterKeys = JSON.stringify(Object.keys(renamed.anomalies?.[0] || {}));
if (beforeKeys !== afterKeys) {
  console.log('anomaly keys before:', beforeKeys);
  console.log('anomaly keys after: ', afterKeys);
  changes++;
}

if (changes === 0) {
  console.log('Nothing to repair — file is already clean.');
} else {
  fs.writeFileSync(FILE, JSON.stringify(renamed));
  console.log(`\nRepaired and wrote ${FILE}`);
}
