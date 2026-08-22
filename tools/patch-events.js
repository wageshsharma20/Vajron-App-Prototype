/**
 * Patch notification events across all park replay JSONs.
 * Run once: node tools/patch-events.js
 */
const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'src', 'data');

function patch(file, events) {
  const p = path.join(DATA, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  data.events = events;
  fs.writeFileSync(p, JSON.stringify(data));
  console.log(`${file}: ${events.length} events`);
  events.forEach(e => console.log(`  ${String(e.time).padStart(5)}s  [${e.type}]  ${e.title}`));
}

// ──────────────────────────────────────────── Sanjay Lake — Full Survey
patch('sanjayLakeReplay.json', [
  { time: 45, type: 'warning', title: 'Waterlogging detected', message: "Standing water in the children's play area — investigate drainage." },
  { time: 55, type: 'warning', title: 'Dry patches on the lawn', message: 'Dry, stressed turf visible across the play area lawn — irrigation check needed.' },
  { time: 93, type: 'warning', title: 'Dry vegetation flagged', message: '2–3 trees showing dry, stressed canopy — schedule irrigation and inspection.' },
  { time: 147, type: 'warning', title: 'Bare patches spreading', message: 'Bare, compacted ground along the pathway — re-turfing and decompaction recommended.' },
  { time: 167, type: 'warning', title: 'Construction debris on footbridge', message: 'Construction debris detected on the footbridge — clear the site and verify safety barriers.' },
]);

// ──────────────────────────────────────────── Lala Hardeval
// Clip 1: keep 5s bare patches, 18s litter. Add 60s bare patches. Remove 28s water, 50s hedges, 68s path.
patch('lalaHardevalClip1Replay.json', [
  { time: 5, type: 'warning', title: 'Bare patches showing', message: 'Ground cover thinning under the palm avenue — could use re-turfing.' },
  { time: 18, type: 'info', title: 'Some litter about', message: 'A bit of loose debris across the lawns — a sweep would tidy it up.' },
  { time: 60, type: 'warning', title: 'More bare patches ahead', message: 'Bare ground expanding along the far end of the avenue — needs re-turfing.' },
]);

// Clip 2: keep 5s lawn, 27s canopy. Remove 16s litter, 40s water, 44s vehicle.
patch('lalaHardevalClip2Replay.json', [
  { time: 5, type: 'info', title: 'Lawn could use attention', message: 'Turf patchy around the formal beds — aerating and overseeding would help.' },
  { time: 27, type: 'info', title: 'Canopy looking thin', message: 'Tree canopy a little sparse here — some watering would help.' },
]);

// Clip 3: remove 4s litter. Keep 11s lawn, 17s bare patches.
patch('lalaHardevalClip3Replay.json', [
  { time: 11, type: 'info', title: 'Lawn could use attention', message: 'Grass thinning beside the axis — overseeding would bring it back.' },
  { time: 17, type: 'info', title: 'A few bare patches', message: 'Some bare ground along the central axis — could do with re-turfing.' },
]);

// ──────────────────────────────────────────── Smriti Van
// Clip 2: remove 4s litter, remove 17s path blocked. Add 17s leaves. Keep 25s water. Delay 36s error → 40s.
patch('smritiVanClip2Replay.json', [
  { time: 17, type: 'info', title: 'Fallen leaves piling up', message: 'Leaf litter accumulating across the play area — needs a good sweep before it gets slippery.' },
  { time: 25, type: 'warning', title: 'Standing water observed', message: 'Water pooling in the play area — worth checking the drainage.' },
  { time: 40, type: 'error', title: 'Play equipment broken — critical', message: 'Swing appears collapsed on the sand. Inspect and make safe before reopening.' },
]);

// Clip 3: shift 6s→7s, change 10s canopy→algae/disease, keep 14s ground cover, delay 26s→28s.
patch('smritiVanClip3Replay.json', [
  { time: 7, type: 'warning', title: 'Standing water observed', message: 'Water lying across the open ground — worth a look at levels and drainage.' },
  { time: 10, type: 'warning', title: 'Algae risk from stagnant water', message: 'Prolonged waterlogging could breed algae and mosquitoes — drainage needs urgent attention to prevent disease spread.' },
  { time: 14, type: 'warning', title: 'Ground cover thinning', message: 'Ground is bare and compacted in places — decompacting and re-turfing would help.' },
  { time: 28, type: 'info', title: 'Some litter about', message: 'A bit of loose debris across the open ground — worth a sweep.' },
]);

// Clip 4: remove 7s standing water. Keep 4s, 21s, 31s.
patch('smritiVanClip4Replay.json', [
  { time: 4, type: 'info', title: 'A few bare patches', message: 'Some compacted ground along the path — could do with re-turfing.' },
  { time: 21, type: 'info', title: 'Lawn could use attention', message: 'Grass thinning in patches — aerating and overseeding would bring it back.' },
  { time: 31, type: 'info', title: 'Hedges need a trim', message: 'A few gaps showing along the shrub line — trimming and gap-filling would tidy it.' },
]);

// ──────────────────────────────────────────── R Block Asaf Ali
// Clip 1: remove 16s bare patches, remove 23s litter. Keep 6s hedges, 35s lawn.
patch('asafAliClip1Replay.json', [
  { time: 6, type: 'info', title: 'Hedges need a trim', message: 'Shrub line growing uneven under the canopy — trimming would tidy it.' },
  { time: 35, type: 'info', title: 'Lawn could use attention', message: 'Grass thinning in places — overseeding would bring it back.' },
]);

// Clip 2: change 4s→infra poor, remove 12s vehicle, keep 22s dry veg, change 34s→building repair.
patch('asafAliClip2Replay.json', [
  { time: 4, type: 'warning', title: 'Pavilion structure deteriorating', message: 'Infrastructure showing signs of wear — cracks and peeling visible on the building.' },
  { time: 22, type: 'info', title: 'Some dry vegetation', message: 'Patches of dry growth near the pavilion — a watering round would help.' },
  { time: 34, type: 'warning', title: 'Building needs repair', message: 'Pavilion exterior in poor condition — repainting and structural repair recommended.' },
]);

// ──────────────────────────────────────────── Vasant Udyan
// Clip 1: change 4s→broken tiles, change 10s→litter/sweeping, remove 17s vehicle. Keep 24s, 33s.
patch('vasantUdyanClip1Replay.json', [
  { time: 4, type: 'warning', title: 'Play area flooring damaged', message: 'Tiles and floor surface in the children\'s play area are cracked and broken — repair needed for safety.' },
  { time: 10, type: 'info', title: 'Some litter about', message: 'Loose debris scattered across the area — a good sweep would tidy things up.' },
  { time: 24, type: 'info', title: 'A few bare patches', message: 'Bare, compacted ground under the equipment — could do with re-turfing.' },
  { time: 33, type: 'info', title: 'Lawn could use attention', message: 'Grass thinning around the edges — aerating and overseeding would help.' },
]);

// Clip 2: remove 25s standing water. Keep 4s, 11s, 18s.
patch('vasantUdyanClip2Replay.json', [
  { time: 4, type: 'warning', title: 'Ground cover thinning', message: 'Bare, compacted ground along the path — decompacting and re-turfing would help.' },
  { time: 11, type: 'warning', title: 'Path surface worn', message: 'Walking track showing wear along this stretch — worth patching.' },
  { time: 18, type: 'info', title: 'Hedges need a trim', message: 'Gaps showing along the shrub line — trimming and gap-filling would tidy it.' },
]);

// ──────────────────────────────────────────── Vasant Vatika
// Clip 1: remove 6.5s litter. Keep 3s shrubs.
patch('vasantVatikaClip1Replay.json', [
  { time: 3, type: 'warning', title: 'Shrubs showing wear', message: 'Hedge condition dipping near the fountain — gaps and thinning visible.' },
]);

// Clip 2: remove 28s vehicle. Keep 3s, 14s, 35s.
patch('vasantVatikaClip2Replay.json', [
  { time: 3, type: 'warning', title: 'Litter building up', message: 'Ground litter detected along the avenue — condition at 36%, needs attention.' },
  { time: 14, type: 'warning', title: 'Hedges degrading', message: 'Multiple shrub lines showing poor condition — trimming and gap-filling recommended.' },
  { time: 35, type: 'warning', title: 'Bare patches and dry vegetation', message: 'Compacted ground and dry vegetation cluster detected — irrigation review needed.' },
]);

// Clip 3: change 3s error→mild warning, remove 10s waterlogging, change 16s→bare patches, remove 27s error. Keep 40s, 55s.
patch('vasantVatikaClip3Replay.json', [
  { time: 3, type: 'info', title: 'Ground wearing thin', message: 'Some bare patches visible near the gym area — minor re-turfing would help.' },
  { time: 16, type: 'warning', title: 'Bare patches spreading', message: 'Exposed ground expanding across the hedge bed zone — needs soil treatment and re-seeding.' },
  { time: 40, type: 'error', title: 'Ground condition critical', message: 'Bare ground at 6% condition — worst finding in this survey. Immediate action required.' },
  { time: 55, type: 'warning', title: 'Path surface degrading', message: 'Walking track wearing thin at the far end — resurfacing recommended.' },
]);

console.log('\n✅ All events patched.');
