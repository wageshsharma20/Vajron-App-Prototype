import React, { useEffect, useId, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { useTheme, typography } from '../theme';
import { useI18n } from '../i18n';

// Create animated SVG path
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Picks the arc colour for a score by walking the theme's green ramp: pale at
 * the bottom of the range, deep forest at the top. Interpolating in plain RGB is
 * enough here because the ramp's own stops carry the shape of the curve. */
const colorForScore = (ramp: string[], score: number) => {
  if (!ramp.length) return '#000000';
  if (ramp.length === 1) return ramp[0];

  const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const clamped = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));

  const seg = (clamped / 100) * (ramp.length - 1);
  const i = Math.min(Math.floor(seg), ramp.length - 2);
  const f = seg - i;

  const a = toRgb(ramp[i]);
  const b = toRgb(ramp[i + 1]);
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return '#' + mix.map((v) => v.toString(16).padStart(2, '0')).join('');
};

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

  // The arc is painted with a gradient rather than one flat tone, so it deepens
  // as it sweeps: pale where it starts, darkest where a full score would end.
  // Because the gradient is anchored to the whole arc and progress only reveals
  // part of it, a low score stops while the colour is still light and a high one
  // carries through to the deep end — the "more progress, darker green" reading
  // falls out of the geometry instead of being applied as a separate step.
  //
  // A LinearGradient runs along x, but the arc's angle does not: a point at arc
  // progress t sits at x = cx - r*cos(pi*t), which bunches up near both ends. The
  // stops are therefore placed at that same cosine, so colour tracks the angle
  // swept rather than the horizontal distance covered.
  const gradientId = `score-ramp-${useId()}`;
  const stops = useMemo(() => {
    const STEPS = 12;
    return Array.from({ length: STEPS + 1 }, (_, i) => {
      const t = i / STEPS;
      return {
        offset: (1 - Math.cos(Math.PI * t)) / 2,
        color: colorForScore(theme.scoreRamp, t * 100),
      };
    });
  }, [theme.scoreRamp]);
  
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
          <Defs>
            <LinearGradient
              id={gradientId}
              x1={cx - radius}
              y1={0}
              x2={cx + radius}
              y2={0}
              gradientUnits="userSpaceOnUse"
            >
              {stops.map((s) => (
                <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Path
            d={arcPath}
            stroke={theme.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedPath
            d={arcPath}
            stroke={`url(#${gradientId})`}
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
    bottom: -5, // Nudged past the baseline so the number sits optically centred
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
