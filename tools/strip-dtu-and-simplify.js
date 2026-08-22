/**
 * Strip "DTU" references from all replay JSONs and simplify notification vocab.
 * Run once: node tools/strip-dtu-and-simplify.js
 */
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'src', 'data');

const files = fs.readdirSync(DATA).filter(f => f.endsWith('Replay.json'));

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

// ── Key renames to strip DTU ──
const KEY_RENAMES = {
  'DTU code': 'Code',
  'DTU sub-parameter': 'Sub-parameter',
  'DTU category': 'Category',
  'DTU Category': 'Category',
};

function stripDTU(obj) {
  if (Array.isArray(obj)) return obj.map(stripDTU);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const newKey = KEY_RENAMES[k] || k;
      out[newKey] = stripDTU(v);
    }
    return out;
  }
  if (typeof obj === 'string') {
    // Remove "DTU" prefix from category values like "A1 Plantation & Green Cover"
    let s = obj.replace(/\bDTU\s*/gi, '');
    return simplifyText(s);
  }
  return obj;
}

let totalDTU = 0;
for (const file of files) {
  const p = path.join(DATA, file);
  const raw = fs.readFileSync(p, 'utf8');
  const dtuCount = (raw.match(/DTU/g) || []).length;
  totalDTU += dtuCount;
  
  const data = JSON.parse(raw);
  
  // Strip DTU from all nested objects
  const cleaned = stripDTU(data);
  
  // Also simplify event messages
  if (cleaned.events) {
    cleaned.events = cleaned.events.map(e => ({
      ...e,
      title: simplifyText(e.title),
      message: simplifyText(e.message),
    }));
  }
  
  fs.writeFileSync(p, JSON.stringify(cleaned));
  console.log(`${file}: ${dtuCount} DTU refs removed`);
}

console.log(`\n✅ Stripped ${totalDTU} DTU references across ${files.length} files`);
console.log('✅ Simplified vocabulary in all event messages');
