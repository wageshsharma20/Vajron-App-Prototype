import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Pressable, Animated, Platform } from 'react-native';
import { useTheme, typography } from '../theme';
import { VideoOverlay } from '../components/VideoOverlay';
import { Play, Pause, Camera, Eye, EyeOff, VideoOff, Settings2, X } from 'lucide-react-native';

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

const mockBoxes: any[] = [
  { x: 15, y: 20, width: 25, height: 35, label: 'LITTER', confidence: 92, type: 'live', category: 'issue' },
  { x: 25, y: 35, width: 10, height: 12, label: 'DAMAGED BENCH', confidence: 85, type: 'live', category: 'issue' },
  { x: 65, y: 25, width: 20, height: 35, label: '', confidence: 0, type: 'ghost', category: 'neutral' },
];

export const LiveVideoFeedScreen = () => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isMapMain, setIsMapMain] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // Content renderers for easy swapping
  const renderCameraFeed = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.blankVideo}>
        <VideoOff size={32} color={'#333'} strokeWidth={1} />
        <Text style={styles.blankText}>AWAITING STREAM</Text>
      </View>
      {showOverlays && <VideoOverlay boxes={mockBoxes} />}
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
              label={isPlaying ? 'PAUSE' : 'LIVE'} 
              onPress={() => setIsPlaying(!isPlaying)} 
            />
            
            <ControlButton 
              icon={<Camera size={18} color="#000" strokeWidth={1.5} />} 
              label="PHOTO" 
              onPress={() => {
                Alert.alert('Capture Mode', 'Select capture mode', [
                  { text: 'Take Photo', onPress: () => console.log('Photo') },
                  { text: 'Start Recording', onPress: () => console.log('Video') },
                  { text: 'Cancel', style: 'cancel' }
                ]);
              }}
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
  blankVideo: {
    ...(StyleSheet.absoluteFill as any),
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  blankText: {
    fontFamily: typography.fonts.light,
    fontSize: 14,
    letterSpacing: 4,
    color: '#555',
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
    ...StyleSheet.absoluteFillObject,
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
