/**
 * App-wide replay clock.
 *
 * A single video player instance lives here and drives every screen: the video
 * plays on the Camera tab while the dashboard, gauges and defect tables all read
 * their figures from the same playback position. Switching tabs mid-playback
 * therefore shows a consistent picture rather than four independent mocks.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useVideoPlayer, VideoPlayer } from 'expo-video';
import {
  frameAt,
  REPLAY_DURATION,
  type ReplayFrame,
} from './replayData';
import { DEFAULT_PARK_ID, parkById, type Park } from '../data/parks';

/**
 * The survey recording is streamed from a URL rather than bundled, so the 350 MB
 * file never has to live in the repo. It is hosted as a GitHub Release asset on
 * this repo, which serves it with HTTP range support (needed for seeking) and
 * permissive CORS — the stable /releases/download/ URL re-signs on every request,
 * so it does not expire. Re-upload with:
 *   gh release upload survey-media <file>.mp4 --clobber
 */
export const REPLAY_VIDEO_URL =
  'https://github.com/wageshsharma20/Vajron-App-Prototype/releases/download/survey-media/sanjay-lake-detection.mp4';

export const REPLAY_SOURCE = { uri: REPLAY_VIDEO_URL };

/**
 * How often the clock republishes. The dataset is sampled at 15 Hz but the UI
 * only needs to feel live — 5 Hz keeps the numbers legible and avoids a
 * re-render storm across every subscribed screen.
 */
const TIME_UPDATE_INTERVAL_SEC = 0.2;

type ReplayContextValue = {
  player: VideoPlayer;
  /** Current playback position in seconds. */
  time: number;
  isPlaying: boolean;
  /** Metrics for the current instant. */
  frame: ReplayFrame;
  duration: number;
  progress: number;
  /** The park whose survey the whole app is currently showing. */
  park: Park;
  selectPark: (id: string) => void;
  /**
   * False until the recording is first played. While false the app shows the
   * completed survey summary; once true it tracks the recording frame by frame.
   */
  hasStarted: boolean;
  /** True when the selected park has a processed survey to show. */
  hasSurvey: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  restart: () => void;
};

const ReplayContext = createContext<ReplayContextValue | null>(null);

export const ReplayProvider = ({ children }: { children: React.ReactNode }) => {
  const player = useVideoPlayer(REPLAY_SOURCE, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = TIME_UPDATE_INTERVAL_SEC;
    p.muted = true;
  });

  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [parkId, setParkId] = useState(DEFAULT_PARK_ID);
  const lastPublished = useRef(0);

  const park = parkById(parkId);
  const hasSurvey = park.status === 'ready';

  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', (payload: { currentTime: number }) => {
      const next = payload?.currentTime ?? 0;
      // The player can emit faster than the configured interval while seeking.
      if (Math.abs(next - lastPublished.current) < TIME_UPDATE_INTERVAL_SEC / 2) return;
      lastPublished.current = next;
      setTime(next);
    });
    const playSub = player.addListener('playingChange', (payload: { isPlaying: boolean }) => {
      setIsPlaying(Boolean(payload?.isPlaying));
    });
    return () => {
      timeSub.remove();
      playSub.remove();
    };
  }, [player]);

  const frame = useMemo(() => frameAt(time), [time]);

  const play = useCallback(() => {
    setHasStarted(true);
    player.play();
  }, [player]);

  const pause = useCallback(() => player.pause(), [player]);

  const toggle = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      setHasStarted(true);
      player.play();
    }
  }, [player]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(REPLAY_DURATION, seconds));
      setHasStarted(true);
      player.currentTime = clamped;
      lastPublished.current = clamped;
      setTime(clamped);
    },
    [player],
  );

  const restart = useCallback(() => {
    player.currentTime = 0;
    lastPublished.current = 0;
    setTime(0);
    setHasStarted(true);
    player.play();
  }, [player]);

  /** Switching parks resets the clock so the new survey starts from its summary. */
  const selectPark = useCallback(
    (id: string) => {
      player.pause();
      player.currentTime = 0;
      lastPublished.current = 0;
      setTime(0);
      setHasStarted(false);
      setParkId(id);
    },
    [player],
  );

  const value = useMemo<ReplayContextValue>(
    () => ({
      player,
      time,
      isPlaying,
      frame,
      duration: REPLAY_DURATION,
      progress: REPLAY_DURATION > 0 ? time / REPLAY_DURATION : 0,
      park,
      selectPark,
      hasStarted,
      hasSurvey,
      play,
      pause,
      toggle,
      seek,
      restart,
    }),
    [player, time, isPlaying, frame, park, selectPark, hasStarted, hasSurvey, play, pause, toggle, seek, restart],
  );

  return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
};

export const useReplay = (): ReplayContextValue => {
  const ctx = useContext(ReplayContext);
  if (!ctx) {
    throw new Error('useReplay must be used inside a <ReplayProvider>');
  }
  return ctx;
};

/** Formats seconds as m:ss.d, matching the timecode burned into the video. */
export const formatTimecode = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const d = Math.floor((safe * 10) % 10);
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
};
