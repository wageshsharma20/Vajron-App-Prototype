import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

type CircularScoreProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export const CircularScore = ({ score, size = 180, strokeWidth = 14, label }: CircularScoreProps) => {
  const { theme } = useTheme();
  
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2; // We use center for Y, and draw the arc in the top half

  // Arc path: starts at left (cx - radius, cy), sweeps to right (cx + radius, cy)
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const arcLength = Math.PI * radius;
  
  // Progress mapped to arc length
  const progressLength = (score / 100) * arcLength;
  const dashoffset = arcLength - progressLength;

  const getColor = (s: number) => {
    if (s >= 75) return theme.statusGreen;
    if (s >= 50) return theme.accentAmber;
    return theme.accentRed;
  };

  const color = getColor(score);
  
  // A true gauge chart needs half the height, plus stroke width padding
  const height = size / 2 + strokeWidth;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: height, alignItems: 'center' }}>
        <Svg width={size} height={height}>
          {/* Background Arc */}
          <Path
            d={arcPath}
            stroke={theme.border}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {/* Foreground Progress Arc */}
          <Path
            d={arcPath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength}`}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
          />
        </Svg>
        {/* Score text positioned inside the arch */}
        <View style={styles.scoreOverlay}>
          <Text style={[styles.scoreText, { color: theme.textPrimary, fontSize: size * 0.25 }]}>{score}</Text>
          <Text style={[styles.outOf, { color: theme.textSecondary }]}>/100</Text>
        </View>
      </View>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 4,
  },
  scoreText: {
    fontFamily: typography.fonts.bold,
    fontVariant: ['tabular-nums'],
  },
  outOf: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    marginTop: -2,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    marginTop: 8,
  },
});
