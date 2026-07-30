import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import * as Icons from 'lucide-react-native';
import { AnimatedNumber } from './AnimatedNumber';

interface PercentageCardProps {
  category: string;
  value: number;
  unit: string;
  iconName: string;
  index?: number;
}

export const PercentageCard: React.FC<PercentageCardProps> = ({ category, value, unit, iconName, index = 0 }) => {
  const { theme } = useTheme();
  const IconComponent = (Icons as any)[iconName] || Icons.CircleAlert;

  // Staggered entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const delay = index * 70;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  // Pulse for threats
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isLethal = ['Knife', 'Handgun'].includes(category);
  const isAlert = isLethal && value > 0;

  useEffect(() => {
    if (isAlert) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isAlert]);

  let activeColor = theme.accentTeal;
  if (['Human', 'Swings'].includes(category)) activeColor = theme.accentAmber;
  if (isLethal) activeColor = theme.accentRed;

  return (
    <Animated.View style={[
      styles.container,
      { backgroundColor: theme.surface, borderColor: theme.border },
      isAlert && { borderColor: theme.accentRed, backgroundColor: theme.accentRed + '15' },
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      <View style={styles.header}>
        <IconComponent size={20} color={activeColor} />
        {isAlert && (
          <Animated.View style={[styles.pulseDot, { backgroundColor: theme.accentRed, opacity: pulseAnim }]} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.valueRow}>
          <AnimatedNumber
            value={value}
            duration={1000 + (index * 100)}
            style={[styles.value, { color: theme.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
          {!!unit && unit !== '%' && (
            <Text style={[styles.unit, { color: theme.textSecondary }]}>{unit}</Text>
          )}
        </View>
        <Text style={[styles.category, { color: theme.textSecondary }]} numberOfLines={1}>{category}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '31%',
    margin: '1%',
    justifyContent: 'space-between',
    minHeight: 105,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    marginTop: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.lg,
    fontVariant: typography.tabularNums,
  },
  unit: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
  },
  category: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  }
});
