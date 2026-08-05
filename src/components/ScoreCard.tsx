import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, typography } from '../theme';
import { Text } from 'react-native-paper';

type ScoreCardProps = {
  label: string;
  score: number;
  iconName: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
};

export const ScoreCard = ({ label, score, trend, changePercent }: ScoreCardProps) => {
  const { theme } = useTheme();

  const trendColor = changePercent > 0 ? theme.statusGreen : changePercent < 0 ? theme.accentRed : theme.textSecondary;

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      <Text style={[styles.score, { color: theme.textPrimary }]}>
        {score}%
      </Text>
      
      <View style={styles.metaContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.trend, { color: trendColor }]}>
          {changePercent > 0 ? '+' : ''}{changePercent}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '46%', // Give it breathing room in a 2-col grid
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, // Ultra-thin 1px divider
  },
  score: {
    fontFamily: typography.fonts.light, // Ultra thin number
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
    paddingRight: 8,
  },
  trend: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
  },
});
