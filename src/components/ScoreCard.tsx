import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography } from '../theme';
import { Text } from 'react-native-paper';

type ScoreCardProps = {
  label: string;
  score: number;
  iconName: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  /** Opens this metric's section in Reports. Omitted -> the card is inert, which
   * is correct for the few metrics that have no Reports section behind them. */
  onPress?: () => void;
  };

export const ScoreCard = ({ label, score, trend, changePercent, onPress }: ScoreCardProps) => {
  const { theme } = useTheme();

  const trendColor = changePercent > 0 ? theme.statusGreen : changePercent < 0 ? theme.accentRed : theme.textSecondary;

  const body = (
    <>
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
    </>
  );

  // A plain View when there is nowhere to go, so the card never offers a press
  // it cannot honour.
  if (!onPress) {
    return <View style={[styles.container, { borderBottomColor: theme.border }]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderBottomColor: theme.border, opacity: pressed ? 0.55 : 1 },
      ]}
    >
      {body}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '46%', // Give it breathing room in a 2-col grid
    paddingBottom: 10, // Gap between the label and the divider under it

    borderBottomWidth: StyleSheet.hairlineWidth, // Ultra-thin 1px divider
  },
  score: {
    fontFamily: typography.fonts.light, // Ultra thin number
    fontSize: 26,
    lineHeight: 30,
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
