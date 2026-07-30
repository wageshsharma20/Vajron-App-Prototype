import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '../theme/ThemeContext';
import { VideoOverlay } from '../components/VideoOverlay';
import { typography } from '../theme/typography';
import { Play, Pause, Camera, Eye, EyeOff, VideoOff, Settings2 } from 'lucide-react-native';
import { FAB, IconButton } from 'react-native-paper';

// Local helper component for DRY controls
const ControlButton = ({ icon, label, onPress, isFab = false }: { icon: React.ReactNode, label: string, onPress: () => void, isFab?: boolean }) => (
  <View style={styles.controlBtn}>
    {isFab ? (
      <FAB 
        icon={() => icon}
        onPress={onPress}
        style={styles.captureFab}
        color="#000"
      />
    ) : (
      <IconButton 
        icon={() => icon}
        onPress={onPress}
        mode="outlined"
        iconColor="#FFF"
        size={24}
      />
    )}
    <Text style={styles.controlLabel}>{label}</Text>
  </View>
);

const mockBoxes: any[] = [
  { x: 15, y: 20, width: 25, height: 35, label: 'Litter', confidence: 92, type: 'live', category: 'issue' },
  { x: 25, y: 35, width: 10, height: 12, label: 'Damaged Bench', confidence: 85, type: 'live', category: 'issue' },
  { x: 65, y: 25, width: 20, height: 35, label: '', confidence: 0, type: 'ghost', category: 'neutral' },
];

export const LiveVideoFeedScreen = () => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isMapMain, setIsMapMain] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  // Content renderers for easy swapping
  const renderCameraFeed = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.blankVideo}>
        <VideoOff size={40} color={'#444'} />
        <Text style={styles.blankText}>AWAITING STREAM</Text>
      </View>
      {showOverlays && <VideoOverlay boxes={mockBoxes} />}
    </View>
  );

  const renderMapView = () => (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B1321', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#666', fontFamily: typography.fonts.bold, fontSize: 24, letterSpacing: 4 }}>MINIMAP</Text>
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
        <View style={{
          width: layout.height + 2, // +2 to cover any subpixel rounding gaps
          height: layout.width + 2, // +2 to cover any subpixel rounding gaps
          transform: [{ rotate: '90deg' }],
          backgroundColor: '#000',
        }}>
          {/* Main Area */}
          <View style={styles.videoArea}>
            {isMapMain ? renderMapView() : renderCameraFeed()}

            {/* Minimap (Interactive PIP) */}
            {showOverlays && (
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.minimapContainer, { borderColor: theme.border }]}
                onPress={() => setIsMapMain(!isMapMain)}
              >
                {isMapMain ? renderCameraFeed() : renderMapView()}
                <View style={[styles.minimapBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={styles.minimapLabel}>{isMapMain ? 'CAMERA' : 'MAP'}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Drone HUD — Bottom-Right */}
            {showOverlays && (
              <View style={styles.droneHUD}>
                <Text style={styles.droneText}>ALT: 85.2m</Text>
                <Text style={styles.droneText}>SPD: 28.4km/h</Text>
                <Text style={styles.droneText}>BAT: 74%</Text>
              </View>
            )}
          </View>

          {/* Gimbal Slider Mock — DJI Left Edge removed per user request */}

          {/* Controls — DJI Right Edge (Internal right edge) */}
          <View style={styles.controlBar}>
            <ControlButton 
              icon={isPlaying ? <Pause size={20} color="#FFF" /> : <Play size={20} color="#FFF" />} 
              label={isPlaying ? 'Pause' : 'Live'} 
              onPress={() => setIsPlaying(!isPlaying)} 
            />
            
            <ControlButton 
              icon={<Camera size={24} color="#000" />} 
              label="Capture" 
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
              icon={showOverlays ? <Eye size={20} color="#FFF" /> : <EyeOff size={20} color="#FFF" />} 
              label="Overlay" 
              onPress={() => setShowOverlays(!showOverlays)} 
            />

            <ControlButton 
              icon={<Settings2 size={20} color="#FFF" />} 
              label="Settings" 
              onPress={() => bottomSheetRef.current?.expand()} 
            />
          </View>

          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.surfaceLight }}
            handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
          >
            <BottomSheetView style={styles.sheetContent}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Advanced Settings</Text>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Thermal Palette</Text>
                <Text style={[styles.settingsValue, { color: theme.accentTeal }]}>Ironbow</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Exposure</Text>
                <Text style={[styles.settingsValue, { color: theme.textPrimary }]}>Auto</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Detection Sensitivity</Text>
                <Text style={[styles.settingsValue, { color: theme.textPrimary }]}>High</Text>
              </View>
            </BottomSheetView>
          </BottomSheet>

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
  videoArea: {
    flex: 1,
    backgroundColor: '#111',
  },
  blankVideo: {
    ...(StyleSheet.absoluteFill as any),
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  blankText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 2,
    color: '#444',
  },
  minimapContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 140,
    height: 100,
    borderRadius: 4,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  minimapBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  minimapLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 1,
  },
  mapGrid: {
    ...(StyleSheet.absoluteFill as any),
    opacity: 0.1,
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'dashed',
    // Mocking a grid with dashed border for now
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
  },
  homeRadius: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  homePoint: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  homeH: {
    fontFamily: typography.fonts.bold,
    fontSize: 10,
    color: '#FFF',
  },
  droneRadius: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  dronePath: {
    position: 'absolute',
    width: 2,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    bottom: 20, // Path trails behind the drone
    transform: [{ rotate: '45deg' }],
  },
  droneHUD: {
    position: 'absolute',
    bottom: 16,
    right: 80, // Shifted to avoid the control bar
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 4,
  },
  droneText: {
    fontFamily: typography.fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  controlBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 2,
  },
  captureFab: {
    backgroundColor: '#FFF',
    borderRadius: 30,
  },
  controlLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
    color: '#DDD',
  },
  sheetContent: {
    flex: 1,
    padding: 24,
  },
  sheetTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingsLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.base,
  },
  settingsValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
  },
});
