import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable, Platform } from 'react-native';
import { VideoView } from 'expo-video';
import { useTheme, typography } from '../theme';
import { useReplay, REPLAY_VIDEO_URL } from '../replay/ReplayProvider';
import { Play, Pause, RotateCcw, Eye, EyeOff, Settings2, X, ArrowLeft } from 'lucide-react-native';

let MapView: any;
let Marker: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

// Local helper component for DRY controls - Zen Style
const ControlButton = ({ icon, onPress, isFab = false }: { icon: React.ReactNode, label?: string, onPress: () => void, isFab?: boolean }) => (
  <Pressable onPress={onPress} style={styles.controlBtn}>
    <View style={[styles.iconContainer, isFab && styles.captureFab]}>
      {icon}
    </View>
  </Pressable>
);

type Props = {
  /** Returns to the park list in the Recordings tab. */
  onBack?: () => void;
};

/**
 * On web, expo-video's VideoView cannot load GitHub Releases URLs due to
 * redirect chains and Content-Disposition: attachment headers. This component
 * renders a native HTML5 <video> element synced to the replay provider.
 */
const WebVideoFallback = ({ width, height }: { width: number; height: number }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { isPlaying, time } = useReplay();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isPlaying]);

  // Sync seek — only jump if the replay clock drifted >1s from the video
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isFinite(time)) return;
    if (Math.abs(el.currentTime - time) > 1) {
      el.currentTime = time;
    }
  }, [time]);

  return (
    <video
      ref={videoRef}
      src={REPLAY_VIDEO_URL}
      muted
      playsInline
      style={{ width, height, objectFit: 'contain', backgroundColor: '#000' }}
    />
  );
};

export const RecordingPlayerScreen: React.FC<Props> = ({ onBack }) => {
  const { theme } = useTheme();
  // Playback is the app-wide replay clock, so playing here also advances the
  // Dashboard scores and Reports tallies.
  const { player, isPlaying, toggle, restart, park } = useReplay();
  const [showOverlays, setShowOverlays] = useState(true);
  const [isMapMain, setIsMapMain] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // The clip already carries the detector's burned-in annotation layer, so the
  // video is shown as-is (contain = whole frame, nothing cropped) inside the
  // rotated landscape canvas. On web, expo-video cannot load GitHub Releases
  // URLs, so we fall back to a native HTML5 <video> element.
  const renderCameraFeed = () => (
    <View style={[StyleSheet.absoluteFill, styles.feedBackdrop]}>
      {Platform.OS === 'web' ? (
        <WebVideoFallback width={layout.height} height={layout.width} />
      ) : (
        <VideoView
          player={player}
          style={{ width: layout.height, height: layout.width }}
          contentFit="contain"
          nativeControls={false}
          playsInline
          fullscreenOptions={{ enable: false }}
        />
      )}
    </View>
  );

  const renderMapView = () => (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#444', fontFamily: typography.fonts.light, fontSize: 16, letterSpacing: 4 }}>MINIMAP</Text>
      <Text style={{ color: '#666', fontFamily: typography.fonts.regular, fontSize: 10, marginTop: 8, textAlign: 'center', paddingHorizontal: 10 }}>
        Maps SDK disabled in prototype to prevent API Key crash.
      </Text>
    </View>
  );

  return (
    <View 
      style={styles.container}
      onLayout={(e) => {
        setLayout({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
    >
      {/* Back to the park list — sits upright, outside the rotated canvas */}
      {onBack && (
        <Pressable onPress={onBack} style={styles.backChip} hitSlop={10}>
          <ArrowLeft size={16} color="#FFF" />
          <Text style={styles.backChipText} numberOfLines={1}>{park.name}</Text>
        </Pressable>
      )}

      {layout.width > 0 && (
        <View style={[styles.rotatedContainer, {
          width: layout.height + 2,
          height: layout.width + 2,
        }]}>
          {/* Main Area */}
          <View style={styles.videoArea}>
            {isMapMain ? renderMapView() : renderCameraFeed()}

            {/* Minimap (Interactive PIP) */}
            {showOverlays && (
              <TouchableOpacity 
                activeOpacity={0.9}
                style={[styles.minimapContainer, { borderColor: theme.border }]}
                onPress={() => setIsMapMain(!isMapMain)}
              >
                {isMapMain ? renderCameraFeed() : renderMapView()}
                <View style={styles.minimapBadge}>
                  <Text style={styles.minimapLabel}>{isMapMain ? 'CAM' : 'MAP'}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Drone HUD — Zen Minimalist */}
            {showOverlays && (
              <View style={styles.droneHUD}>
                <View style={styles.hudRow}>
                  <Text style={styles.hudLabel}>HEIGHT</Text>
                  <Text style={styles.hudValue}>85.2M</Text>
                </View>
                <View style={styles.hudRow}>
                  <Text style={styles.hudLabel}>SPEED</Text>
                  <Text style={styles.hudValue}>28.4KM/H</Text>
                </View>
                <View style={styles.hudRow}>
                  <Text style={styles.hudLabel}>BATTERY</Text>
                  <Text style={styles.hudValue}>74%</Text>
                </View>
              </View>
            )}
          </View>

          {/* Controls — Minimal right edge */}
          <View style={styles.controlBar}>
            <ControlButton
              icon={isPlaying ? <Pause size={18} color="#FFF" strokeWidth={1} /> : <Play size={18} color="#FFF" strokeWidth={1} />}
              label={isPlaying ? 'PAUSE' : 'PLAY'}
              onPress={toggle}
            />

            <ControlButton
              icon={<RotateCcw size={18} color="#000" strokeWidth={1.5} />}
              label="RESTART"
              onPress={restart}
              isFab
            />

            <ControlButton 
              icon={showOverlays ? <Eye size={18} color="#FFF" strokeWidth={1} /> : <EyeOff size={18} color="#FFF" strokeWidth={1} />} 
              label="SHOW DATA" 
              onPress={() => setShowOverlays(!showOverlays)} 
            />

            <ControlButton 
              icon={<Settings2 size={18} color="#FFF" strokeWidth={1} />} 
              label="SETTINGS" 
              onPress={() => setShowSettings(true)} 
            />
          </View>

          {/* Absolute custom settings overlay inside rotated container */}
          {showSettings && (
            <Pressable style={styles.settingsOverlay} onPress={() => setShowSettings(false)}>
              <Pressable style={[styles.sheetContent, { backgroundColor: theme.surfaceLight }]} onPress={(e) => e.stopPropagation()}>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>ADVANCED SETTINGS</Text>
                  <Pressable onPress={() => setShowSettings(false)}>
                    <X size={24} color={theme.textPrimary} strokeWidth={1} />
                  </Pressable>
                </View>
                <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>THERMAL PALETTE</Text>
                  <Text style={[styles.settingsValue, { color: theme.accentTeal }]}>IRONBOW</Text>
                </View>
                <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>EXPOSURE</Text>
                  <Text style={[styles.settingsValue, { color: theme.textPrimary }]}>AUTO</Text>
                </View>
                <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>DETECTION SENSITIVITY</Text>
                  <Text style={[styles.settingsValue, { color: theme.textPrimary }]}>HIGH</Text>
                </View>
              </Pressable>
            </Pressable>
          )}

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatedContainer: {
    transform: [{ rotate: '90deg' }],
    backgroundColor: '#000',
  },
  videoArea: {
    flex: 1,
    backgroundColor: '#080808', // Slightly off black
  },
  feedBackdrop: {
    backgroundColor: '#000',
  },
  backChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '70%',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  backChipText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#FFF',
  },
  minimapContainer: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    width: 100,
    height: 70,
    borderWidth: 1, // Zen 1px
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  minimapBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopRightRadius: 4,
  },
  minimapLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 2,
  },
  droneHUD: {
    position: 'absolute',
    bottom: 32,
    right: 100, // Shifted to avoid control bar
    gap: 8,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 90,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 4,
  },
  hudLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: 8,
    letterSpacing: 1,
    color: '#888',
  },
  hudValue: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: '#FFF',
  },
  controlBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 64, // much narrower
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24, // tighter gap
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  controlBtn: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  captureFab: {
    backgroundColor: '#fff',
  },
  mapPin: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626', // red by default for critical
    borderWidth: 1,
    borderColor: '#000',
  },
  controlLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: 8, // smaller label
    color: '#888',
    letterSpacing: 1,
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheetContent: {
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: typography.fonts.light,
    fontSize: 20,
    letterSpacing: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    letterSpacing: 1,
  },
  settingsValue: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
    letterSpacing: 1,
  },
});
