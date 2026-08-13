"""Convert the Sanjay Lake Park AI detection workbook into JSON the app replays.

The 2026-08 survey is FOUR clips concatenated into one recording (play area →
lake edge → open-gym/lawns → footbridge). The workbook stores each clip's Time(s)
from zero, so this script assigns each clip a global offset (cumulative sum of the
prior clips' durations) and rewrites every timestamp — frame timeline, detections,
object tracks and anomalies — onto that single global clock, which is what the
concatenated video plays on.

The workbook ships with uncached formulas, so every aggregate is recomputed from
the raw rows rather than read off the Summary / Rollup sheets.
"""
import zipfile, json, os, sys
from collections import defaultdict, OrderedDict
from xml.etree import ElementTree as ET

XLSX = sys.argv[2] if len(sys.argv) > 2 else "/Users/wageshsharma/Downloads/Sanjay_Lake_Park_AI_Detection_Report (2).xlsx"
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

z = zipfile.ZipFile(XLSX)
shared = []
if 'xl/sharedStrings.xml' in z.namelist():
    for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(f'{NS}si'):
        shared.append(''.join(t.text or '' for t in si.iter(f'{NS}t')))

def cellval(c):
    t, v = c.get('t'), c.find(f'{NS}v')
    if t == 's' and v is not None and v.text is not None:
        return shared[int(v.text)]
    isel = c.find(f'{NS}is')
    if isel is not None:
        return ''.join(x.text or '' for x in isel.iter(f'{NS}t'))
    return v.text if (v is not None and v.text is not None) else ''

def colidx(ref):
    letters = ''.join(ch for ch in (ref or '') if ch.isalpha())
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1

wb = ET.fromstring(z.read('xl/workbook.xml'))
rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
rid = {r.get('Id'): r.get('Target') for r in rels}
SHEETS = {}
for s in wb.iter(f'{NS}sheet'):
    tgt = rid[s.get(f'{RNS}id')].lstrip('/')
    SHEETS[s.get('name')] = tgt if tgt.startswith('xl/') else 'xl/' + tgt

def rows_of(sheetname):
    root = ET.fromstring(z.read(SHEETS[sheetname]))
    for r in root.findall(f'.//{NS}row'):
        cells = {}
        for c in r.findall(f'{NS}c'):
            cells[colidx(c.get('r'))] = cellval(c)
        width = (max(cells) + 1) if cells else 0
        yield [cells.get(i, '') for i in range(width)]

def num(x, d=None):
    try:
        return float(x)
    except (TypeError, ValueError):
        return d

def r1(x):
    return None if x is None else round(x, 1)

# ---------------------------------------------------------------- clip offsets
raw = list(rows_of('5. Frame Timeline'))
FT = raw[1:]
# Frame Timeline columns:
# 0 Clip 1 Zone 2 Frame 3 Time 4 Detections 5 Green% 6 Canopy% 7 Lawn% 8 Bare%
# 9 DryVeg% 10 Debris% 11 Stems 12 WaterSurface% 13 Algal% 14 ExposedBed% 15 Paved%
# 16 Overall 17 Green 18 Plantation 19 LawnScore 20 Cleanliness 21 Irrigation
# 22 Infra 23 Safety 24 MeanExG 25 Waterlog%
clip_max = OrderedDict()
clip_zone = {}
for r in FT:
    if len(r) < 4:
        continue
    clip, t = r[0], num(r[3])
    if not clip or t is None:
        continue
    clip_max[clip] = max(clip_max.get(clip, 0.0), t)
    clip_zone.setdefault(clip, r[1])

clip_order = list(clip_max.keys())
offset = {}
running = 0.0
clip_bounds = []
for clip in clip_order:
    offset[clip] = round(running, 2)
    dur = clip_max[clip]
    clip_bounds.append({"clip": clip, "zone": clip_zone.get(clip, ''),
                        "start": round(running, 2), "end": round(running + dur, 2)})
    running += dur
GLOBAL_END = round(running, 2)
print("clip offsets:")
for b in clip_bounds:
    print(f"  {b['clip']:<7} {b['start']:>7.2f} -> {b['end']:>7.2f}   {b['zone']}")

def global_t(clip, local):
    return round(offset.get(clip, 0.0) + local, 2)

# ---------------------------------------------------------------- frame timeline
# Kept app fields (indices into FT row): mapped to global time.
KEEP = {
    'detections': 4, 'greenCover': 5, 'canopy': 6, 'lawn': 7, 'bareGround': 8,
    'dryVeg': 9, 'debris': 10, 'stems': 11, 'waterSurface': 12, 'algalShare': 13,
    'exposedBed': 14, 'paved': 15, 'waterlogging': 25, 'overall': 16, 'green': 17,
    'plantation': 18, 'lawnScore': 19, 'cleanliness': 20, 'irrigation': 21,
    'infrastructure': 22, 'safety': 23,
}
TIMELINE_FIELDS = ['t'] + list(KEEP.keys())
INT_FIELDS = {'detections', 'stems'}

timeline = []
zones = []
prev_sig = None
for r in FT:
    if len(r) < 26:
        continue
    clip, local = r[0], num(r[3])
    if local is None:
        continue
    gt = global_t(clip, local)
    row = [gt]
    for f, ci in KEEP.items():
        val = num(r[ci], 0.0)
        row.append(int(round(val)) if f in INT_FIELDS else round(val, 1))
    sig = tuple(row[1:])
    if sig == prev_sig:
        continue  # workbook repeats each analysed frame twice (source 60 fps)
    prev_sig = sig
    timeline.append(row)
    zones.append(r[1])

print(f"timeline: {len(FT)} rows -> {len(timeline)} unique samples, global 0..{timeline[-1][0]}s")

def agg(field):
    i = TIMELINE_FIELDS.index(field)
    col = [row[i] for row in timeline]
    return {"mean": round(sum(col) / len(col), 1), "min": r1(min(col)), "max": r1(max(col))}

SCORES = ['overall', 'green', 'plantation', 'lawnScore', 'cleanliness',
          'irrigation', 'infrastructure', 'safety']
COVERAGE = ['greenCover', 'canopy', 'lawn', 'bareGround', 'dryVeg', 'debris',
            'stems', 'waterSurface', 'algalShare', 'exposedBed', 'paved', 'waterlogging']
summary = {"scores": {f: agg(f) for f in SCORES},
           "coverage": {f: agg(f) for f in COVERAGE}}

# ---------------------------------------------------------------- detection log
det = list(rows_of('4. Detection Log'))
DL = det[2:]
# 0 Clip 1 Zone 2 Frame 3 Time 4 DTUcode 5 Object 6 Category 7 Subparam 8 Defect?
# 9 TrackID 10 X 11 Y 12 W 13 H 14 Area% 15 Cond% 16 Conf 17 Notes
classes = OrderedDict()
def class_id(name, code, cat, sub):
    if name not in classes:
        classes[name] = {"name": name, "code": code, "category": cat,
                         "subParameter": sub, "index": len(classes)}
    return classes[name]["index"]

by_time = defaultdict(list)
class_stats = defaultdict(lambda: {"n": 0, "cs": 0.0, "cn": 0, "worst": None})
for r in DL:
    if len(r) < 16 or not r[5]:
        continue
    clip, local = r[0], num(r[3])
    if local is None:
        continue
    gt = global_t(clip, local)
    ci = class_id(r[5], r[4], r[6], r[7])
    cond = num(r[15])
    conf = num(r[16])
    defect = r[8] == 'Yes'
    by_time[gt].append([ci, r1(cond) if cond is not None else None,
                        round(conf, 2) if conf is not None else None,
                        1 if defect else 0])
    st = class_stats[r[5]]
    st["n"] += 1
    if cond is not None:
        st["cs"] += cond; st["cn"] += 1
        st["worst"] = cond if st["worst"] is None else min(st["worst"], cond)

detections = [[t, by_time[t]] for t in sorted(by_time)]
class_rollup = {n: {"count": s["n"],
                    "meanCondition": round(s["cs"]/s["cn"], 1) if s["cn"] else None,
                    "worstCondition": r1(s["worst"])} for n, s in class_stats.items()}
print(f"detection log: {len(DL)} rows -> {len(detections)} instants, {len(classes)} classes")

# ---------------------------------------------------------------- object register
orr = list(rows_of('6. Object Register'))
OR = orr[3:]
# 0 Clip 1 TrackID 2 DTUcode 3 ObjectClass 4 Subparam 5 FirstSeen 6 LastSeen ...
# 9 MeanCond 10 Worst
tracks = []
for r in OR:
    if len(r) < 10 or not r[3]:
        continue
    fs = num(r[5]); ls = num(r[6]); mc = num(r[9])
    if fs is None:
        continue
    tracks.append({"cls": r[3], "first": global_t(r[0], fs),
                   "last": global_t(r[0], ls if ls is not None else fs),
                   "cond": r1(mc)})

# ---------------------------------------------------------------- other tables
def table(sheetname, header_row):
    rs = list(rows_of(sheetname))
    hdr = rs[header_row]
    out = []
    for row in rs[header_row + 1:]:
        rec = {hdr[i]: (row[i] if i < len(row) else '') for i in range(len(hdr)) if hdr[i]}
        if any(str(v).strip() for v in rec.values()):
            out.append(rec)
    return out

anomalies_raw = table('7. Anomalies', 2)
# rewrite First/Last seen to global using the Clip column
anomalies = []
for a in anomalies_raw:
    clip = a.get('Clip', 'Clip 1')
    fs = num(a.get('First seen (s)')); ls = num(a.get('Last seen (s)'))
    a = dict(a)
    if fs is not None:
        a['First seen (s)'] = global_t(clip, fs)
    if ls is not None:
        a['Last seen (s)'] = global_t(clip, ls)
    anomalies.append(a)

recommendations = table('8. Recommendations', 2)
catA = table('2. Category A Rollup', 2)
catB = table('3. Category B Rollup', 2)

# resolve Category A formula columns from the detection tally
for r in catA:
    st = class_rollup.get(r.get('Detector class', ''))
    if st:
        r['Records'] = st['count']
        r['Mean cond. %'] = st['meanCondition'] if st['meanCondition'] is not None else 'n/a'
        r['Worst %'] = st['worstCondition'] if st['worstCondition'] is not None else 'n/a'

# ---------------------------------------------------------------- notification events
# Fire an in-app alert as playback crosses a notable finding. Waterlogging is the
# headline one the client asked for; the lake water-quality alert is included when
# present. Times are clamped so nothing fires in the first ~2 s of playback.
def first_anomaly(cls, severities):
    hits = [a for a in anomalies if a.get('Anomaly') == cls and a.get('Severity') in severities]
    hits.sort(key=lambda a: num(a.get('First seen (s)'), 1e9))
    return hits[0] if hits else None

events = []
wl = first_anomaly('Waterlogging', ('High', 'Critical')) or first_anomaly('Waterlogging', ('Medium',))
if wl:
    events.append({
        "time": max(2.0, round(num(wl['First seen (s)'], 0), 1)),
        "type": "warning",
        "title": "Waterlogging detected",
        "message": "Standing water in the children's play area — investigate drainage.",
    })
wb_anom = first_anomaly('Water Body', ('Critical', 'High'))
if wb_anom:
    events.append({
        "time": round(num(wb_anom['First seen (s)'], 0), 1),
        "type": "error",
        "title": "Water quality alert",
        "message": "Poor water quality at the lake edge — algal growth and floating waste.",
    })
events.sort(key=lambda e: e['time'])
print("notification events:", events)

# ---------------------------------------------------------------- metadata
meta_rows = list(rows_of('1. Summary'))
meta = {}
for row in meta_rows[3:16]:
    if len(row) > 1 and row[0] and row[1]:
        meta[row[0]] = row[1]
headline = [row[0] for row in meta_rows if row and str(row[0]).startswith('•')]

payload = {
    "meta": {**meta, "videoDurationSec": 180.45, "timelineEndSec": timeline[-1][0],
             "sampleCount": len(timeline), "generatedFrom": os.path.basename(XLSX)},
    "clips": clip_bounds,
    "globalEnd": GLOBAL_END,
    "headlineFindings": headline,
    "timelineFields": TIMELINE_FIELDS,
    "timeline": timeline,
    "zones": zones,
    "detectionClasses": [{"index": c["index"], "name": c["name"], "code": c["code"],
                          "category": c["category"], "subParameter": c["subParameter"]}
                         for c in classes.values()],
    "detectionFields": ["classIndex", "condition", "confidence", "isDefect"],
    "detections": detections,
    "classRollup": class_rollup,
    "tracks": tracks,
    "summary": summary,
    "events": events,
    "anomalies": anomalies,
    "recommendations": recommendations,
    "categoryA": catA,
    "categoryB": catB,
}

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, 'sanjayLakeReplay.json')
with open(path, 'w') as f:
    json.dump(payload, f, separators=(',', ':'))
print(f"\nwrote {path}  ({os.path.getsize(path)/1024:.0f} KB)")
print("classes:", list(classes))
print("scores:", {k: v['mean'] for k, v in summary['scores'].items()})
print("coverage:", {k: v['mean'] for k, v in summary['coverage'].items()})
