import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { VideoOverlay } from '../components/VideoOverlay';
import { typography } from '../theme/typography';
import { Play, Pause, Camera, Eye, EyeOff, VideoOff } from 'lucide-react-native';

const mockBoxes: any[] = [
  { x: 30, y: 40, width: 20, height: 40, label: 'Human', confidence: 95, type: 'live', category: 'human' },
  { x: 38, y: 55, width: 8, height: 12, label: 'Handgun', confidence: 88, type: 'live', category: 'weapon' },
  { x: 60, y: 30, width: 15, height: 35, label: '', confidence: 0, type: 'ghost', category: 'neutral' },
];



export const LiveVideoFeedScreen = () => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [layout, setLayout] = useState({ width: 0, height: 0 });



  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}
      onLayout={(e) => {
        setLayout({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
    >
      {layout.width > 0 && (
        <View style={{
          width: layout.height,
          height: layout.width,
          transform: [{ rotate: '90deg' }],
          backgroundColor: '#000',
        }}>
          <View style={styles.videoContainer}>
            {/* Blank Video Placeholder */}
            <View style={styles.blankVideo}>
              <VideoOff size={48} color={theme.textSecondary} opacity={0.5} />
              <Text style={[styles.blankText, { color: theme.textSecondary }]}>AWAITING VIDEO STREAM</Text>
            </View>
            
            {showOverlays && <VideoOverlay boxes={mockBoxes} />}

            {/* Telemetry PiP */}
            {showOverlays && (
              <View style={[styles.pipTelemetry, { backgroundColor: theme.overlay }]}>
                <Text style={[styles.pipText, { color: theme.textPrimary }]}>ALT: 124.5m</Text>
                <Text style={[styles.pipText, { color: theme.textPrimary }]}>SPD: 34.2km/h</Text>
                <Text style={[styles.pipText, { color: theme.textPrimary }]}>BAT: 68%</Text>
              </View>
            )}

            {/* PiP Mini-map placeholder */}
            {showOverlays && (
              <View style={[styles.pipMinimap, { backgroundColor: theme.overlay, borderColor: theme.border }]}>
                <View style={[styles.minimapDot, { backgroundColor: theme.accentTeal }]} />
                <Text style={[styles.minimapLabel, { color: theme.textSecondary }]}>MINIMAP</Text>
              </View>
            )}
          </View>

          {/* Controls - Floating at bottom of rotated view */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={handlePlayPause}>
              {isPlaying ? <Pause size={20} color="#FFF" /> : <Play size={20} color="#FFF" />}
              <Text style={styles.controlText}>{isPlaying ? 'PAUSE' : 'LIVE'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlBtn}>
              <Camera size={20} color="#FFF" />
              <Text style={styles.controlText}>SNAPSHOT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={() => setShowOverlays(!showOverlays)}>
              {showOverlays ? <Eye size={20} color="#FFF" /> : <EyeOff size={20} color="#FFF" />}
              <Text style={styles.controlText}>OVERLAYS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  blankVideo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  blankText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    letterSpacing: 2,
    opacity: 0.5,
  },
  pipTelemetry: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    borderRadius: 6,
  },
  pipText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
    fontVariant: typography.tabularNums,
  },
  pipMinimap: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 100,
    height: 80,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  minimapLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: 8,
  },
  controls: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: 55, // Made much thinner
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlBtn: {
    alignItems: 'center',
    gap: 2,
  },
  controlText: {
    fontFamily: typography.fonts.bold,
    fontSize: 9, // Slightly smaller text
    color: '#FFF',
  }
});
