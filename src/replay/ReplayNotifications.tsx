/**
 * Raises in-app alerts as the survey recording plays past notable findings.
 *
 * The waterlogging alert is the headline one: as playback crosses the point where
 * the detector reports standing water in the play area, a banner slides in. Events
 * come from the dataset (converter-generated) so they stay in sync with the video.
 * Mounted once at app level so the alert shows on whichever tab is open.
 */
import React, { useEffect, useRef, useState } from 'react';
import { NotificationBanner } from '../components/NotificationBanner';
import { useReplay } from './ReplayProvider';
import { replayEvents, type ReplayEvent } from './replayData';

export const ReplayNotifications = () => {
  const { time, isPlaying, hasStarted, hasSurvey } = useReplay();
  const [active, setActive] = useState<ReplayEvent | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const lastTime = useRef(0);

  // A large backward jump (restart / park switch) re-arms every event.
  useEffect(() => {
    if (time < lastTime.current - 1) {
      firedRef.current.clear();
      setActive(null);
    }
    lastTime.current = time;
  }, [time]);

  useEffect(() => {
    if (!hasSurvey || !hasStarted || !isPlaying) return;
    for (const ev of replayEvents) {
      if (time >= ev.time && !firedRef.current.has(ev.time)) {
        firedRef.current.add(ev.time);
        setActive(ev);
        break;
      }
    }
  }, [time, isPlaying, hasStarted, hasSurvey]);

  if (!active) return null;

  return (
    <NotificationBanner
      // Keyed so a second event remounts the banner and replays the slide-in.
      key={active.time}
      title={active.title}
      message={active.message}
      type={active.type}
      durationMs={6000}
      onDismiss={() => setActive(null)}
    />
  );
};
