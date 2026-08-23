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
import { Platform } from 'react-native';
import { useVideoPlayer, VideoPlayer } from 'expo-video';
import {
  frameAt,
  REPLAY_DURATION,
  setActiveReplay,
  type ReplayFrame,
} from './replayData';
import {
  DEFAULT_PARK_ID,
  DEFAULT_RECORDING_ID,
  parkById,
  recordingsForPark,
  type Park,
  type Recording,
} from '../data/parks';

/**
 * The recordings are streamed from a URL rather than bundled, so the large MP4s
 * never have to live in the repo.
 *
 * On native they come from GitHub Release assets, which serve with HTTP range
 * support (needed for seeking). Upload a new clip with:
 *   gh release upload survey-media <file>.mp4 --clobber
 *
 * Browsers refuse those URLs: they redirect to Azure Blob with
 * `Content-Disposition: attachment` and `Content-Type: application/octet-stream`,
 * which a <video> element will not play. On web we therefore read the same file
 * from the local dev video server, which sets `video/mp4` and honours Range.
 * Start it alongside Expo with:  node video-server.js
 */
const RELEASE_BASE =
  'https://github.com/wageshsharma20/Vajron-App-Prototype/releases/download/survey-media';
const LOCAL_BASE = 'http://localhost:3001';

/** Resolve a recording's video file to a playable URL for the current platform. */
export const videoUrlFor = (recording: Recording): string => {
  if (Platform.OS === 'web') {
    if (__DEV__) {
      return `${LOCAL_BASE}/${recording.video}`;
    } else {
      // In production (Vercel), proxy the GitHub release through our Edge Function
      // to strip the Content-Disposition: attachment header.
      return `/api/video?file=${recording.video}`;
    }
  }
  return `${RELEASE_BASE}/${recording.video}`;
};

const DEFAULT_RECORDING =
  recordingsForPark(DEFAULT_PARK_ID).find((r) => r.id === DEFAULT_RECORDING_ID) ??
  recordingsForPark(DEFAULT_PARK_ID)[0];

export const REPLAY_VIDEO_URL = videoUrlFor(DEFAULT_RECORDING);

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
  /** The recordings available for the current park (empty for scheduled parks). */
  recordings: Recording[];
  /** The recording currently loaded, or undefined for a park with none. */
  recording?: Recording;
  /**
   * Which detection dataset is active. Consumers must include this in their memo
   * dependencies: switching parks resets the clock, so `time`/`hasStarted` alone
   * can be unchanged across a switch and would serve the previous park's figures.
   */
  datasetId?: Recording['datasetId'];
  /** Load a specific recording of a park — switches its video AND its dataset. */
  selectRecording: (parkId: string, recordingId: string) => void;
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
  const [recordingId, setRecordingId] = useState(DEFAULT_RECORDING_ID);
  const lastPublished = useRef(0);

  const park = parkById(parkId);
  const hasSurvey = park.status === 'ready';
  const recordings = recordingsForPark(parkId);
  const recording = recordings.find((r) => r.id === recordingId) ?? recordings[0];

  // Read by the stable playToEnd listener, which is registered once and would
  // otherwise close over the initial park/recording.
  const navRef = useRef({ parkId, recordingId });
  navRef.current = { parkId, recordingId };

  /**
   * Autoplay after a source swap cannot be a single `play()` call: `replaceAsync`
   * resolves before the underlying element has actually switched over, so a play
   * issued at that moment lands on the outgoing video and the incoming one loads
   * paused. Instead the intent is held and re-asserted until playback truly
   * starts. `generation` invalidates a pending intent when another load or a
   * deliberate pause supersedes it.
   */
  const autoplayRef = useRef<{ generation: number; timer: ReturnType<typeof setInterval> | null }>({
    generation: 0,
    timer: null,
  });

  const cancelAutoplay = useCallback(() => {
    autoplayRef.current.generation += 1;
    if (autoplayRef.current.timer) {
      clearInterval(autoplayRef.current.timer);
      autoplayRef.current.timer = null;
    }
  }, []);

  /** Keep asking the player to start until it reports it is playing. */
  const startPlaybackWhenReady = useCallback(() => {
    cancelAutoplay();
    const generation = autoplayRef.current.generation;
    let attempts = 0;

    const attempt = () => {
      // Superseded by a newer load or an explicit pause.
      if (generation !== autoplayRef.current.generation) return;
      // Success is the new clip's clock actually moving — not `playing`, which
      // still reads true from the outgoing clip for a moment after a swap and
      // would end the retry before the incoming one ever starts.
      if (player.playing && player.currentTime > 0.05) {
        cancelAutoplay();
        return;
      }
      // ~6 s ceiling: enough for a slow first byte, but never an endless loop if
      // the browser refuses playback outright.
      if (attempts > 40) {
        cancelAutoplay();
        return;
      }
      attempts += 1;
      player.play();
    };

    attempt();
    autoplayRef.current.timer = setInterval(attempt, 150);
  }, [player, cancelAutoplay]);

  // Never leave an interval running past unmount.
  useEffect(() => cancelAutoplay, [cancelAutoplay]);

  /**
   * Load a recording: swap the video source AND the dataset that drives the
   * Dashboard/Reports, reset the clock, and optionally start playing. This is the
   * one place a recording change happens, whether user-driven or auto-chained.
   */
  const loadRecording = useCallback(
    (nextParkId: string, rec: Recording, autoplay: boolean) => {
      cancelAutoplay();
      setActiveReplay(rec.datasetId);
      lastPublished.current = 0;
      setTime(0);
      setParkId(nextParkId);
      setRecordingId(rec.id);
      setHasStarted(autoplay);

      player
        .replaceAsync({ uri: videoUrlFor(rec) })
        .then(() => {
          player.currentTime = 0;
          if (autoplay) startPlaybackWhenReady();
        })
        .catch(() => {
          cancelAutoplay();
        });

      if (!autoplay) player.pause();
    },
    [player, cancelAutoplay, startPlaybackWhenReady],
  );

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
    // Backstop: the moment the swapped-in source is playable, nudge it again.
    // Harmless if it is already running — the retry cancels itself once playing.
    const statusSub = player.addListener('statusChange', (payload: { status: string }) => {
      if (payload?.status === 'readyToPlay' && autoplayRef.current.timer) {
        player.play();
      }
    });
    // When a recording finishes, roll straight into the park's next recording so
    // the sequence (survey → works-zone clip) plays as one continuous video. The
    // dataset follows the jump, so the Dashboard/Reports keep updating live. The
    // last recording just ends.
    const endSub = player.addListener('playToEnd', () => {
      const { parkId: pid, recordingId: rid } = navRef.current;
      const list = recordingsForPark(pid);
      const i = list.findIndex((r) => r.id === rid);
      const next = i >= 0 ? list[i + 1] : undefined;
      if (next) loadRecording(pid, next, true);
    });
    return () => {
      timeSub.remove();
      playSub.remove();
      statusSub.remove();
      endSub.remove();
    };
  }, [player, loadRecording]);

  // Recompute on recording change too: the active dataset has swapped even if the
  // clock is still at 0, so the frame must be re-read from the new dataset.
  const frame = useMemo(() => frameAt(time), [time, recordingId, parkId]);

  const play = useCallback(() => {
    setHasStarted(true);
    player.play();
  }, [player]);

  // An explicit pause outranks a pending autoplay, or the retry would fight it.
  const pause = useCallback(() => {
    cancelAutoplay();
    player.pause();
  }, [player, cancelAutoplay]);

  const toggle = useCallback(() => {
    if (player.playing) {
      cancelAutoplay();
      player.pause();
    } else {
      setHasStarted(true);
      startPlaybackWhenReady();
    }
  }, [player, cancelAutoplay, startPlaybackWhenReady]);

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

  /** Restart the whole sequence from the park's first recording (the survey). */
  const restart = useCallback(() => {
    const { parkId: pid } = navRef.current;
    const first = recordingsForPark(pid)[0];
    if (first) {
      loadRecording(pid, first, true);
    } else {
      player.currentTime = 0;
      lastPublished.current = 0;
      setTime(0);
      setHasStarted(true);
      player.play();
    }
  }, [player, loadRecording]);

  /**
   * Load a specific recording of a park. This swaps BOTH the video source and the
   * detection dataset that drives the Dashboard and Reports, then resets the clock
   * so the new recording starts from its summary state.
   */
  const selectRecording = useCallback(
    (nextParkId: string, nextRecordingId: string) => {
      const list = recordingsForPark(nextParkId);
      const next = list.find((r) => r.id === nextRecordingId) ?? list[0];
      if (next) {
        loadRecording(nextParkId, next, false);
      } else {
        player.pause();
        player.currentTime = 0;
        lastPublished.current = 0;
        setTime(0);
        setHasStarted(false);
        setParkId(nextParkId);
        setRecordingId(DEFAULT_RECORDING_ID);
      }
    },
    [player, loadRecording],
  );

  /** Switching parks loads that park's default (first) recording. */
  const selectPark = useCallback(
    (id: string) => {
      const first = recordingsForPark(id)[0];
      selectRecording(id, first ? first.id : DEFAULT_RECORDING_ID);
    },
    [selectRecording],
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
      recordings,
      recording,
      datasetId: recording?.datasetId,
      selectRecording,
      hasStarted,
      hasSurvey,
      play,
      pause,
      toggle,
      seek,
      restart,
    }),
    [player, time, isPlaying, frame, park, selectPark, recordings, recording, selectRecording, hasStarted, hasSurvey, play, pause, toggle, seek, restart],
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
