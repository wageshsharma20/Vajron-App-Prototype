/**
 * Maps the replay clock onto the dashboard's existing ScoreData shape so the
 * score cards light up from the real detection dataset without changing their UI.
 *
 * Eight of the dashboard's score cards have a genuine per-frame series in the
 * report. The remaining five are recorded in the workbook as not assessable from
 * this clip (no bench/bin in frame, no sanctioned layout drawing, single-date
 * capture), so they are returned unchanged and flagged rather than animated with
 * invented numbers.
 */
import { useMemo } from 'react';
import { useReplay } from './ReplayProvider';
import { clipSummary, smoothedValueAt, type ScoreKey } from './replayData';
import { mockScores } from '../data/mockData';
import type { ScoreData } from '../types';

export type LiveScore = ScoreData & {
  /** True when the value is driven by the replay dataset. */
  isLive: boolean;
  /** Why a card is not live, when it isn't. */
  note?: string;
};

/** Dashboard card id -> replay dataset series. */
const LIVE_MAP: Record<string, ScoreKey> = {
  'overall-health': 'overall',
  'green-cover': 'green',
  'plantation-health': 'plantation',
  'lawn-health': 'lawnScore',
  cleanliness: 'cleanliness',
  irrigation: 'irrigation',
  infrastructure: 'infrastructure',
  safety: 'safety',
};

const NOT_ASSESSED: Record<string, string> = {
  'tree-survival': 'Needs a planting register to separate existing from new stock',
  'encroachment-risk': 'No encroachment or unauthorised construction in this field of view',
  'citizen-readiness': 'Not derivable from imagery',
  'maintenance-priority': 'Composite of the anomaly register — see Reports',
  'layout-compliance': 'Requires the sanctioned layout drawing to compare against',
};

/** Seconds back to look when deciding whether a score is rising or falling. */
const TREND_LOOKBACK_SEC = 3;

const trendOf = (now: number, before: number): ScoreData['trend'] => {
  const delta = now - before;
  if (delta > 0.5) return 'up';
  if (delta < -0.5) return 'down';
  return 'stable';
};

export const useLiveScores = (): LiveScore[] => {
  const { time, hasStarted, hasSurvey } = useReplay();

  return useMemo(() => {
    return (mockScores as ScoreData[]).map((card) => {
      const key = LIVE_MAP[card.id];
      if (!key) {
        return { ...card, isLive: false, note: NOT_ASSESSED[card.id] };
      }

      // No processed survey for this park — show nothing rather than invent it.
      if (!hasSurvey) {
        return { ...card, score: 0, trend: 'stable', changePercent: 0, isLive: false, note: 'Awaiting survey' };
      }

      // Before the recording is played, show the completed survey figure (the
      // clip mean) rather than the value at t=0, so the dashboard reads as a
      // finished report instead of a half-empty one.
      if (!hasStarted) {
        return {
          ...card,
          score: Math.round(clipSummary.scores[key].mean),
          trend: 'stable',
          changePercent: 0,
          isLive: false,
        };
      }

      const now = smoothedValueAt(key, time);
      const before = smoothedValueAt(key, Math.max(0, time - TREND_LOOKBACK_SEC));
      return {
        ...card,
        score: Math.round(now),
        trend: trendOf(now, before),
        changePercent: Math.round((now - before) * 10) / 10,
        isLive: true,
      };
    });
  }, [time, hasStarted, hasSurvey]);
};

/** The eight cards backed by real per-frame data, in dashboard order. */
export const useLiveScoresOnly = (): LiveScore[] => useLiveScores().filter((s) => s.isLive);
