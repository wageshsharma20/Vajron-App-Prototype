import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import {
  Trees, Leaf, Sprout, Sparkles, Wrench, Droplets, Shield, TreePine,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react-native';
import { Card, Text } from 'react-native-paper';

const iconMap: Record<string, any> = {
  Trees, Leaf, Sprout, Sparkles, Wrench, Droplets, Shield, TreePine,
};

type ScoreCardProps = {
  label: string;
  score: number;
  iconName: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
};

export const ScoreCard = ({ label, score, iconName, trend, changePercent }: ScoreCardProps) => {
  const { theme } = useTheme();

  const IconComponent = iconMap[iconName] || Trees;

  const getScoreColor = (s: number) => {
    if (s >= 75) return theme.statusGreen;
    if (s >= 50) return theme.accentAmber;
    return theme.accentRed;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={11} color={theme.statusGreen} />;
    if (trend === 'down') return <TrendingDown size={11} color={theme.accentRed} />;
    return <Minus size={11} color={theme.textSecondary} />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return theme.statusGreen;
    if (trend === 'down') return theme.accentRed;
    return theme.textSecondary;
  };

  return (
    <Card 
      style={[styles.container, { backgroundColor: theme.surfaceLight, borderColor: theme.border }]} 
      mode="outlined"
      elevation={0 as any}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <IconComponent size={16} color={theme.textSecondary} />
          <View style={styles.trendBadge}>
            {getTrendIcon()}
            <Text style={[styles.trendText, { color: getTrendColor(), fontVariant: typography.tabularNums }]}>
              {changePercent > 0 ? '+' : ''}{changePercent}%
            </Text>
          </View>
        </View>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={[styles.score, { color: getScoreColor(score), fontVariant: typography.tabularNums }]}>{score}</Text>
          <Text variant="labelMedium" style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>{label}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontFamily: typography.fonts.medium,
    fontSize: 12,
  },
  content: {
    gap: 4,
  },
  score: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
  },
  label: {
    fontFamily: typography.fonts.medium,
  },
});
