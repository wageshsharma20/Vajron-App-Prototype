import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { CircularScore } from '../components/CircularScore';
import { ScoreCard } from '../components/ScoreCard';
import { DroneInfoTable } from '../components/DroneInfoTable';
import { AlertBanner } from '../components/AlertBanner';
import mockParkInfo from '../data/mockParkInfo.json';
import mockScores from '../data/mockScores.json';
import mockInspection from '../data/mockInspection.json';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react-native';
import { Card, Text } from 'react-native-paper';
import { InspectionCategory, ScoreData } from '../types';

export const LiveDataFeedScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Memoize heavy calculations for top issues
  const topIssues = useMemo(() => {
    return (mockInspection as InspectionCategory[])
      .flatMap((section) =>
        section.items
          .filter((item) => item.status === 'issue')
          .map((item) => ({ ...item, category: section.category }))
      )
      .slice(0, 5);
  }, []);

  const overallScore = (mockScores as ScoreData[])[0];
  const gridScores = (mockScores as ScoreData[]).slice(1);

  // System status and alerts
  const { totalIssues, alertSection } = useMemo(() => {
    const inspectionData = mockInspection as InspectionCategory[];
    const critical = inspectionData.filter((s) => s.status === 'critical');
    const high = inspectionData.filter((s) => s.issueCount >= 3);
    return {
      totalIssues: inspectionData.reduce((sum, s) => sum + s.issueCount, 0),
      alertSection: critical.length > 0 ? critical[0] : (high.length > 0 ? high[0] : null)
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {alertSection && (
        <AlertBanner 
          message={`${alertSection.issueCount} issues found — ${alertSection.category}`}
        />
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textSecondary} />
        }
      >
        {/* Overall Park Health */}
        <Card style={[styles.overallSection, { backgroundColor: theme.surface, borderColor: theme.border }] as any} mode="outlined" elevation={0 as any}>
          <Card.Content style={styles.overallSectionContent}>
            <CircularScore score={overallScore.score} label="Overall Park Health" size={160} />
            <View style={styles.overallMeta}>
              <Text variant="titleMedium" style={[styles.parkName, { color: theme.textPrimary }]}>{mockParkInfo.parkName}</Text>
              <Text variant="bodyMedium" style={[styles.parkLocation, { color: theme.textSecondary }]}>{mockParkInfo.location}</Text>
              <Text variant="bodySmall" style={[styles.surveyDate, { color: theme.textSecondary }]}>
                Survey: {mockParkInfo.surveyDate} at {mockParkInfo.surveyTime}
              </Text>
              <Text variant="bodySmall" style={[styles.areaInfo, { color: theme.textSecondary }]}>
                {mockParkInfo.areaCovered} of {mockParkInfo.totalArea} covered
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* System Status */}
        <View style={[styles.statusBar, { backgroundColor: totalIssues === 0 ? theme.statusGreen + '10' : theme.accentAmber + '10' }]}>
          {totalIssues === 0 ? (
            <CheckCircle size={14} color={theme.statusGreen} />
          ) : (
            <AlertTriangle size={14} color={theme.accentAmber} />
          )}
          <Text style={[styles.statusText, { color: totalIssues === 0 ? theme.statusGreen : theme.accentAmber }]}>
            {totalIssues === 0 ? 'All systems normal' : `${totalIssues} issues need attention`}
          </Text>
        </View>

        {/* Score Grid */}
        <View style={styles.scoreGrid}>
          {gridScores.map((score: any) => (
            <ScoreCard
              key={score.id}
              label={score.label}
              score={score.score}
              iconName={score.icon}
              trend={score.trend}
              changePercent={score.changePercent}
            />
          ))}
        </View>

        {/* Top Issues */}
        {topIssues.length > 0 && (
          <Card style={[styles.issuesSection, { backgroundColor: theme.surface, borderColor: theme.border }] as any} mode="outlined" elevation={0 as any}>
            <Card.Title title="Priority Issues" titleStyle={[styles.sectionTitle, { color: theme.textPrimary }]} />
            <Card.Content style={styles.issuesCardContent}>
              {topIssues.map((issue: any, index: number) => (
                <View 
                  key={issue.id} 
                  style={[
                    styles.issueRow, 
                    index < topIssues.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }
                  ]}
                >
                  <XCircle size={14} color={theme.accentRed} />
                  <View style={styles.issueContent}>
                    <Text variant="bodyMedium" style={[styles.issueName, { color: theme.textPrimary }]}>{issue.name}</Text>
                    <Text variant="bodySmall" style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>{issue.value}</Text>
                  </View>
                  <Text variant="labelSmall" style={[styles.issueCategory, { color: theme.textSecondary }]}>{issue.category.split(' ')[0]}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Drone Info */}
        <DroneInfoTable />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
    gap: 12,
  },
  overallSection: {
    borderRadius: 8,
  },
  overallSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  overallMeta: {
    flex: 1,
    gap: 3,
  },
  parkName: {
    fontFamily: typography.fonts.bold,
  },
  parkLocation: {
    fontFamily: typography.fonts.regular,
  },
  surveyDate: {
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },
  areaInfo: {
    fontFamily: typography.fonts.regular,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  issuesSection: {
    borderRadius: 8,
  },
  issuesCardContent: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semiBold,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  issueContent: {
    flex: 1,
  },
  issueName: {
    fontFamily: typography.fonts.medium,
  },
  issueValue: {
    fontFamily: typography.fonts.regular,
    marginTop: 1,
  },
  issueCategory: {
    fontFamily: typography.fonts.regular,
  },
});
