import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

interface Props {
  location?: string;
  coordinates?: string;
}

export const MiniMap: React.FC<Props> = ({
  location = 'Sector Alpha - Park 4',
  coordinates = '37.7749° N, 122.4194° W',
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const expandProg = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const mapAlpha = useSharedValue(0);
  const pinProg = useSharedValue(0);

  const expand = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);

    if (next) {
      expandProg.value = withSpring(1, { stiffness: 400, damping: 35 });
      mapAlpha.value = withDelay(100, withTiming(1, { duration: 300 }));
      pinProg.value = withDelay(350, withSpring(1, { stiffness: 400, damping: 20 }));
    } else {
      expandProg.value = withSpring(0, { stiffness: 400, damping: 35 });
      mapAlpha.value = withTiming(0, { duration: 200 });
      pinProg.value = withTiming(0, { duration: 150 });
    }
  }, [isExpanded]);

  const cardStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProg.value, [0, 1], [120, 260]),
    transform: [{ scale: pressScale.value }],
  }), []);

  const gridStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProg.value, [0, 1], [0.08, 0]),
  }), []);

  const mapBgStyle = useAnimatedStyle(() => ({
    opacity: mapAlpha.value,
  }), []);

  const iconOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(expandProg.value, [0, 1], [1, 0]),
  }), []);

  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinProg.value,
    transform: [
      { scale: pinProg.value },
      { translateY: interpolate(pinProg.value, [0, 1], [-15, 0]) },
    ],
  }), []);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPressIn={() => { pressScale.value = withSpring(0.97); }}
        onPressOut={() => { pressScale.value = withSpring(1); }}
        onPress={expand}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
            cardStyle,
          ]}
        >
          {/* Collapsed grid pattern — pure View based */}
          <Animated.View style={[StyleSheet.absoluteFill, gridStyle]} pointerEvents="none">
            {Array.from({ length: 7 }).map((_, i) => (
              <View
                key={`hg-${i}`}
                style={{
                  position: 'absolute',
                  top: `${(i + 1) * 12.5}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: theme.textPrimary,
                }}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={`vg-${i}`}
                style={{
                  position: 'absolute',
                  left: `${(i + 1) * 7.7}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: theme.textPrimary,
                }}
              />
            ))}
          </Animated.View>

          {/* Expanded map detail layer */}
          <Animated.View style={[StyleSheet.absoluteFill, mapBgStyle]} pointerEvents="none">
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surfaceLight }]} />

            {/* Roads */}
            <View style={[styles.hRoad, { top: '35%', height: 3, backgroundColor: theme.textPrimary, opacity: 0.22 }]} />
            <View style={[styles.hRoad, { top: '65%', height: 3, backgroundColor: theme.textPrimary, opacity: 0.22 }]} />
            <View style={[styles.vRoad, { left: '30%', width: 2, backgroundColor: theme.textPrimary, opacity: 0.18 }]} />
            <View style={[styles.vRoad, { left: '70%', width: 2, backgroundColor: theme.textPrimary, opacity: 0.18 }]} />

            {/* Secondary streets */}
            {[20, 50, 80].map((y, i) => (
              <View key={`sh-${i}`} style={[styles.hRoad, { top: `${y}%`, height: 1, backgroundColor: theme.textPrimary, opacity: 0.08 }]} />
            ))}
            {[15, 45, 55, 85].map((x, i) => (
              <View key={`sv-${i}`} style={[styles.vRoad, { left: `${x}%`, width: 1, backgroundColor: theme.textPrimary, opacity: 0.08 }]} />
            ))}

            {/* Buildings */}
            {[
              { t: '40%', l: '10%', w: '15%', h: '20%' },
              { t: '15%', l: '35%', w: '12%', h: '15%' },
              { t: '70%', l: '75%', w: '18%', h: '18%' },
              { t: '20%', l: '80%', w: '10%', h: '25%' },
              { t: '55%', l: '5%',  w: '8%',  h: '12%' },
            ].map((b, i) => (
              <View key={`b-${i}`} style={{
                position: 'absolute',
                top: b.t as any, left: b.l as any, width: b.w as any, height: b.h as any,
                backgroundColor: theme.textSecondary + '28',
                borderColor: theme.textSecondary + '18',
                borderWidth: 1,
                borderRadius: 2,
              }} />
            ))}

            {/* Center pin */}
            <Animated.View style={[styles.pinContainer, pinStyle]}>
              <View style={[styles.pin, { backgroundColor: theme.statusGreen }]}>
                <View style={[styles.pinDot, { backgroundColor: theme.background }]} />
              </View>
              <View style={[styles.pinTail, { borderTopColor: theme.statusGreen }]} />
            </Animated.View>
          </Animated.View>

          {/* Foreground content */}
          <View style={styles.content} pointerEvents="none">
            <View style={styles.topRow}>
              <Animated.View style={iconOpacity}>
                <Text style={[styles.mapLabel, { color: theme.statusGreen }]}>MAP</Text>
              </Animated.View>
              <View style={[styles.liveBadge, { backgroundColor: theme.textPrimary + '12' }]}>
                <View style={[styles.liveDot, { backgroundColor: theme.statusGreen }]} />
                <Text style={[styles.liveText, { color: theme.textSecondary }]}>LIVE</Text>
              </View>
            </View>

            <View>
              <Text style={[styles.locationText, { color: theme.textPrimary }]}>{location}</Text>
              {isExpanded && (
                <Text style={[styles.coordsText, { color: theme.textSecondary }]}>{coordinates}</Text>
              )}
              <View style={[styles.underline, { backgroundColor: theme.statusGreen, opacity: isExpanded ? 1 : 0.4, width: isExpanded ? '60%' : '30%' }]} />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {!isExpanded && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>Tap to expand</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    ...StyleSheet.absoluteFill as any,
    padding: 14,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mapLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  locationText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  coordsText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  underline: {
    height: 1,
    marginTop: 6,
  },
  hint: {
    fontFamily: typography.fonts.regular,
    fontSize: 10,
    marginTop: 6,
  },
  hRoad: {
    position: 'absolute',
    left: 0,
    width: '100%',
  },
  vRoad: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  pinContainer: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    marginLeft: -10,
    marginTop: -14,
    alignItems: 'center',
    zIndex: 20,
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
