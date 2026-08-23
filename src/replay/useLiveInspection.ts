/**
 * Drives the Reports inspection accordions from the replay clock.
 *
 * As the drone recording plays, every item that has a genuine signal in the
 * detection dataset updates live: asset counts grow as the drone flies over them,
 * coverage-driven items track the per-frame percentages, and category issue counts
 * recompute from the items. Items for things that never appear in this clip's field
 * of view (benches, bins, the lake, gates …) are labelled honestly as not observed
 * rather than carrying the old placeholder findings.
 */
import { useMemo } from 'react';
import { useReplay } from './ReplayProvider';
import {
  clipSummary,
  cumulativeCountsUpTo,
  meanConditionUpTo,
  smoothedValueAt,
  type CoverageKey,
} from './replayData';
import { mockInspection } from '../data/mockData';
import type { InspectionCategory } from '../types';

type ItemStatus = 'good' | 'attention' | 'issue';
type Severity = 'low' | 'medium' | 'high';
type Resolved = { value: string; status: ItemStatus; severity: Severity };

type Ctx = {
  t: number;
  cov: Record<CoverageKey, number>;
  count: (cls: string) => number;
  cond: (cls: string) => number | null;
  score: (key: 'green' | 'plantation') => number;
};

const notInView = (label = 'Not in this view'): Resolved => ({
  value: label,
  status: 'good',
  severity: 'low',
});

/** One resolver per inspection item id. Absent ids keep their original value. */
const RESOLVERS: Record<string, (c: Ctx) => Resolved> = {
  // --- Asset Inventory — counts grow as the drone flies over each asset ---
  'gps-location': () => ({ value: 'No GPS sidecar — telemetry pending', status: 'attention', severity: 'low' }),
  'tree-geotagging': (c) => ({ value: `${c.count('Tree Stem')} stems geo-tracked`, status: 'good', severity: 'low' }),
  'bench-count': (c) => {
    const n = c.count('Bench');
    return n > 0 ? { value: `${n} benches mapped`, status: 'good', severity: 'low' } : notInView('None in view yet');
  },
  'dustbin-count': () => notInView('None in this survey'),
  'light-pole-count': () => notInView('Not separable in oblique view'),
  'play-equipment': (c) => ({ value: `${c.count('Play Equipment')} instances tracked`, status: 'good', severity: 'low' }),
  'irrigation-inventory': () => notInView('None visible in clip'),
  'pathway-length': (c) => ({ value: `${c.count('Walking Track')} track segments`, status: 'good', severity: 'low' }),

  // --- Plants & Trees ---
  'tree-count': (c) => ({ value: `${c.count('Tree Stem')} stems tracked (${Math.round(c.cov.stems)} in view)`, status: 'good', severity: 'low' }),
  'tree-health': (c) => {
    const p = Math.round(c.score('plantation'));
    return { value: `${p}% canopy vigour`, status: p >= 75 ? 'good' : p >= 60 ? 'attention' : 'issue', severity: 'medium' };
  },
  'canopy-cover': (c) => ({ value: `${c.cov.canopy.toFixed(1)}% of frame`, status: c.cov.canopy >= 12 ? 'good' : 'attention', severity: 'low' }),
  'lawn-coverage': (c) => {
    const n = c.count('Lawn / Grass');
    return { value: `${c.cov.lawn.toFixed(1)}% grass across ${n} patches`, status: c.cov.lawn < 5 ? 'issue' : 'attention', severity: 'medium' };
  },
  'weed-infestation': () => notInView('Not assessable at this altitude'),
  'shrub-coverage': (c) => ({ value: `${c.count('Shrub / Hedge')} shrub/hedge zones`, status: 'good', severity: 'low' }),
  'pruning-quality': () => notInView('Not assessable at this altitude'),
  'hedge-trimming': () => notInView('Not assessable in this clip'),
  'flower-beds': () => notInView('None in view'),
  'dead-vegetation': (c) => ({ value: `${c.cov.dryVeg.toFixed(1)}% standing dry vegetation`, status: 'good', severity: 'low' }),

  // --- Plant Health (RGB clip — no multispectral) ---
  'health-index': (c) => {
    const g = Math.round(c.score('green'));
    return { value: `Green vigour ${g}%`, status: g >= 60 ? 'good' : 'attention', severity: 'low' };
  },
  'leaf-discoloration': () => notInView('Needs multispectral — RGB only'),
  'pest-disease': () => notInView('Not derivable from RGB'),
  'water-stress': (c) => ({ value: `${c.cov.bareGround.toFixed(0)}% bare / dry ground`, status: c.cov.bareGround > 20 ? 'attention' : 'good', severity: 'medium' }),
  'nutrient-levels': () => notInView('Needs multispectral'),
  'growth-progress': () => notInView('Single-date baseline'),

  // --- Irrigation Status ---
  'dry-zones': (c) => ({ value: `${c.cov.bareGround.toFixed(1)}% bare ground`, status: c.cov.bareGround > 15 ? 'issue' : 'attention', severity: 'high' }),
  'waterlogging': (c) => {
    const n = c.count('Waterlogging');
    const pct = c.cov.waterlogging;
    return n > 0 || pct > 3
      ? { value: `${pct.toFixed(1)}% standing water · ${n} zones`, status: pct > 12 ? 'issue' : 'attention', severity: 'high' }
      : notInView('None detected yet');
  },
  'leak-detection': () => notInView('No irrigation infra visible'),
  'moisture-levels': () => ({ value: 'Uneven — large dry patches', status: 'attention', severity: 'low' }),

  // --- Cleanliness ---
  'litter': (c) => ({ value: `${c.count('Ground Litter / Debris')} litter / debris zones`, status: 'issue', severity: 'medium' }),
  'bin-status': () => ({ value: 'No bin in this view', status: 'attention', severity: 'low' }),
  'debris': (c) => ({ value: `${c.cov.debris.toFixed(1)}% ground debris`, status: c.cov.debris > 20 ? 'issue' : 'attention', severity: 'medium' }),
  'green-waste': (c) => ({ value: `Leaf litter ~${c.cov.debris.toFixed(0)}% of open ground`, status: 'attention', severity: 'low' }),
  'water-stagnation': (c) => {
    const n = c.count('Waterlogging');
    return n > 0 ? { value: `${n} waterlogged spot${n > 1 ? 's' : ''}`, status: 'attention', severity: 'low' } : notInView('None detected');
  },

  // --- Infrastructure ---
  'pathways': (c) => {
    const cond = c.cond('Walking Track');
    return { value: cond !== null ? `Track detected — ${Math.round(cond)}% condition` : 'Track detected', status: 'attention', severity: 'low' };
  },
  'gates': () => notInView(),
  'boundary-wall': () => notInView(),
  'railing': (c) => {
    const cond = c.cond('Kerb / Edging');
    return { value: cond !== null ? `Kerb/edging ${Math.round(cond)}% — displaced stones` : 'Kerb/edging — displaced stones', status: 'attention', severity: 'medium' };
  },
  'benches': (c) => {
    const n = c.count('Bench');
    const cond = c.cond('Bench');
    return n > 0
      ? { value: `${n} benches — ${cond !== null ? Math.round(cond) + '% condition' : 'mapped'}`, status: cond !== null && cond < 60 ? 'attention' : 'good', severity: 'low' }
      : notInView('None in view yet');
  },
  'gym-equipment': (c) => {
    const n = c.count('Open Gym Equipment');
    return n > 0 ? { value: `${n} units — serviceable`, status: 'good', severity: 'low' } : notInView('None in view yet');
  },
  'signage': () => notInView('Not legible at this altitude'),
  'light-poles': () => notInView('Not separable from stems'),
  'drinking-water': () => notInView(),
  'toilets': () => notInView(),
  'parking': () => notInView(),
  'gazebo': () => notInView(),
  'excavations': () => notInView('None in this view'),
  'utility-damage': () => notInView('None detected'),

  // --- Safety & Security ---
  'encroachment': () => notInView('None in this survey'),
  'construction-activity': () => notInView('None in this survey'),
  'vehicles-inside': (c) => {
    const n = c.count('Vehicle in Premises');
    return n > 0 ? { value: `${n} vehicle${n > 1 ? 's' : ''} inside boundary`, status: 'issue', severity: 'high' } : notInView('None detected');
  },
  'unsafe-trees': () => ({ value: 'None flagged', status: 'good', severity: 'low' }),
  'blind-spots': (c) => {
    const n = c.count('Low-Visibility Zone');
    return n > 0 ? { value: `${n} low-visibility zone${n > 1 ? 's' : ''}`, status: 'attention', severity: 'low' } : notInView('All areas covered');
  },

  // --- Water Bodies (lake edge & footbridge clips) ---
  'water-level': (c) => {
    const bed = c.cov.exposedBed;
    return bed > 2
      ? { value: `Depleted — ${bed.toFixed(1)}% exposed bed`, status: bed > 8 ? 'issue' : 'attention', severity: 'medium' }
      : notInView('Not in view yet');
  },
  'algae-growth': (c) => {
    const a = c.cov.algalShare;
    return a > 1
      ? { value: `${a.toFixed(1)}% algal share of water`, status: a > 10 ? 'issue' : 'attention', severity: 'medium' }
      : notInView('Not in view yet');
  },
  'floating-waste': (c) => {
    const n = c.count('Floating Waste');
    return n > 0 ? { value: `${n} floating-waste items`, status: 'issue', severity: 'medium' } : notInView('Not in view yet');
  },
  'water-clarity': (c) => {
    const a = c.cov.algalShare;
    return c.cov.waterSurface > 0.5
      ? { value: a > 5 ? 'Turbid green / olive' : 'Moderate clarity', status: a > 5 ? 'attention' : 'good', severity: 'low' }
      : notInView('Not in view yet');
  },
  'bank-erosion': (c) => {
    const n = c.count('Exposed Bed / Bank');
    return n > 0 ? { value: `${n} eroded / cracked bank segments`, status: 'attention', severity: 'low' } : notInView('Not in view yet');
  },
  'fountain': () => notInView('None seen in survey'),

  // --- Landscape Quality ---
  'symmetry': () => ({ value: 'Regular avenue rows discernible', status: 'good', severity: 'low' }),
  'colour-uniformity': (c) => ({ value: `Patchy — ${c.cov.bareGround.toFixed(0)}% bare, ${c.cov.canopy.toFixed(0)}% canopy`, status: 'attention', severity: 'low' }),
};

const worstStatus = (items: { status: string }[]): string => {
  if (items.some((i) => i.status === 'issue')) return 'issue';
  if (items.some((i) => i.status === 'attention')) return 'attention';
  return 'good';
};

export const useLiveInspection = (): InspectionCategory[] => {
  // datasetId is a dependency, not decoration — see the note in useLiveScores.
  const { time, hasStarted, hasSurvey, duration, datasetId } = useReplay();

  // Before playback the whole clip is summarised (as a completed survey); once
  // playing, findings accumulate up to the current position. A park with no
  // processed survey shows the untouched list with no findings asserted.
  const at = hasStarted ? time : duration;

  return useMemo(() => {
    if (!hasSurvey) {
      return (mockInspection as InspectionCategory[]).map((cat) => ({
        ...cat,
        issueCount: 0,
        status: 'good',
        items: cat.items.map((item) => ({
          ...item,
          value: 'Awaiting survey',
          status: 'good' as const,
          severity: 'low' as const,
        })),
      }));
    }

    const counts = cumulativeCountsUpTo(at);
    // Idle: report the clip-wide means, which is what a finished survey states.
    // Playing: report the instantaneous value at the current frame.
    const coverage = (key: CoverageKey) =>
      hasStarted ? smoothedValueAt(key, at, 0) : clipSummary.coverage[key].mean;

        const cov = new Proxy({} as Record<CoverageKey, number>, {
      get: (target, prop) => {
        const k = prop as CoverageKey;
        if (clipSummary.coverage && clipSummary.coverage[k]) {
          return coverage(k) ?? 0;
        }
        return 0;
      }
    });

    const ctx: Ctx = {
      t: at,
      cov,
      count: (cls) => counts[cls] ?? 0,
      cond: (cls) => meanConditionUpTo(cls, at),
      score: (key) => {
        if (!clipSummary.scores || !clipSummary.scores[key]) return 0;
        return hasStarted ? (smoothedValueAt(key, at) ?? 0) : (clipSummary.scores[key].mean ?? 0);
      },
    };

    return (mockInspection as InspectionCategory[]).map((cat) => {
      const items = cat.items.map((item) => {
        const resolve = RESOLVERS[item.id];
        if (!resolve) return item;
        const r = resolve(ctx);
        return { ...item, value: r.value, status: r.status, severity: r.severity };
      });
      const issueCount = items.filter((i) => i.status === 'issue').length;
      return { ...cat, items, issueCount, status: worstStatus(items) };
    });
  }, [at, hasStarted, hasSurvey, datasetId]);
};
