import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { useTheme, typography } from '../theme';
import { useI18n } from '../i18n';

// Create animated SVG path
const AnimatedPath = Animated.createAnimatedComponent(Path);

type CircularScoreProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export const CircularScore = ({ score, size = 200, strokeWidth = 12, label }: CircularScoreProps) => {
  const { theme } = useTheme();
  const { translateNumber, translateAny } = useI18n();
  
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2; 

  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const arcLength = Math.PI * radius;
  
  const progressLength = (score / 100) * arcLength;
  const targetDashoffset = arcLength - progressLength;

  // Zen: single accent color
  const color = theme.accentTeal;
  
  // The stroke uses butt caps, so at the two endpoints it stops exactly at cy
  // instead of extending half a stroke below it — the arc's real height is
  // size/2. The old `size / 2 + strokeWidth` left a strokeWidth-tall band of
  // dead space under the arc, which pushed the number down out of the arc's
  // opening and made the gauge read as lopsided.
  const height = size / 2;

  const animatedOffset = useSharedValue(arcLength);

  useEffect(() => {
    animatedOffset.value = withDelay(300, withTiming(targetDashoffset, {
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }));
  }, [targetDashoffset]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: animatedOffset.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: height, alignItems: 'center' }}>
        <Svg width={size} height={height}>
          <Path
            d={arcPath}
            stroke={theme.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedPath
            d={arcPath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength}`}
            animatedProps={animatedProps}
          />
        </Svg>
        <View style={styles.scoreOverlay}>
          <Text style={[styles.scoreText, { color: theme.textPrimary, fontSize: size * 0.28 }]}>{translateNumber(score)}%</Text>
        </View>
      </View>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{translateAny(String(label))}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scoreOverlay: {
    // Fills the arc and sits the number on the baseline that joins the two arc
    // ends, so it reads as nested inside the arc rather than hanging below it.
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scoreText: {
    fontFamily: typography.fonts.regular, // Zen signature
    letterSpacing: -2,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 32, // Large gap (Ma)
  },
});
