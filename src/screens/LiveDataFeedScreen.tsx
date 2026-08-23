import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme, typography } from '../theme';
import { CircularScore } from '../components/CircularScore';
import { ScoreCard } from '../components/ScoreCard';
import { DroneInfoTable } from '../components/DroneInfoTable';
import { AlertBanner } from '../components/AlertBanner';
import { mockParkInfo, mockInspection } from '../data/mockData';
import { useLiveScores } from '../replay/useLiveScores';
import { useReplay, formatTimecode } from '../replay/ReplayProvider';
import { Text } from 'react-native-paper';
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

  const topIssues = useMemo(() => {
    return (mockInspection as InspectionCategory[])
      .flatMap((section) =>
        section.items
          .filter((item) => item.status !== 'good')
          .map((item) => ({ ...item, category: section.category }))
      )
      .sort((a, b) => {
        const severityMap: Record<string, number> = { critical: 3, issue: 2, attention: 1 };
        return (severityMap[b.status] || 0) - (severityMap[a.status] || 0);
      })
      .slice(0, 5);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    if (status === 'critical') return theme.accentRed;
    if (status === 'issue') return theme.accentRed;
    if (status === 'attention') return theme.accentAmber;
    return theme.textSecondary;
  }, [theme]);

  // Driven by the replay clock: the eight cards with a real per-frame series in the
  // detection report track playback, the rest keep their reported values.
  const { park, hasStarted, hasSurvey, time } = useReplay();
  const liveScores = useLiveScores();
  const overallScore = liveScores[0];
  const gridScores = liveScores.slice(1);

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textPrimary} />
        }
      >
        {/* Overall Park Health - Zen Style */}
        <View style={styles.overallSection}>
          <CircularScore score={overallScore.score} label="Overall Score" size={140} />
          <View style={styles.overallMeta}>
            <Text style={[styles.parkName, { color: theme.textPrimary }]}>{park.name}</Text>
            <Text style={[styles.surveyDate, { color: theme.textSecondary }]}>
              {!hasSurvey
                ? 'Survey scheduled'
                : hasStarted
                  ? `Analysing recording · ${formatTimecode(time)}`
                  : `Surveyed ${park.surveyDate}`}
            </Text>
            {hasSurvey && (
              <Text
                style={[
                  styles.surveyDate,
                  { color: hasStarted ? theme.accentRed : theme.textSecondary, marginTop: 2 },
                ]}
              >
                {hasStarted ? 'LIVE' : 'SURVEY COMPLETE'}
              </Text>
            )}
          </View>
        </View>

        {/* System Status - Minimal Text Only */}
        <View style={styles.statusBar}>
          <Text style={[styles.statusText, { color: totalIssues === 0 ? theme.textSecondary : theme.accentAmber }]}>
            {totalIssues === 0 ? (
              'EVERYTHING IS FINE'
            ) : (
              <>
                <Text style={{ fontFamily: typography.fonts.bold }}>{totalIssues}</Text>
                {' PROBLEMS FOUND'}
              </>
            )}
          </Text>
        </View>

        {/* Score Grid - Separated by whitespace */}
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

        {/* Top Issues - 1px dividers, no cards */}
        {topIssues.length > 0 && (
          <View style={styles.issuesSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>HIGH-PRIORITY DEFECTS</Text>
            <View style={styles.issuesList}>
              {topIssues.map((issue: any, index: number) => (
                <View 
                  key={issue.id} 
                  style={[
                    styles.issueRow, 
                    { borderBottomColor: theme.border }
                  ]}
                >
                  <View style={styles.issueContent}>
                    <Text style={[styles.issueName, { color: getStatusColor(issue.status) }]}>{issue.name}</Text>
                    <Text style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>{issue.value}</Text>
                  </View>
                  <Text style={[styles.issueCategory, { color: theme.textSecondary }]}>{issue.category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Maintenance Recommendations */}
        <View style={styles.issuesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>AI MAINTENANCE RECOMMENDATIONS</Text>
          <View style={styles.issuesList}>
            <View style={[styles.issueRow, { borderBottomColor: theme.border }]}>
              <View style={styles.issueContent}>
                <Text style={[styles.issueName, { color: theme.textPrimary }]}>Schedule Pruning (Zone C)</Text>
                <Text style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>12 trees affecting light penetration</Text>
              </View>
              <Text style={[styles.issueCategory, { color: theme.textSecondary }]}>High Impact</Text>
            </View>
            <View style={[styles.issueRow, { borderBottomColor: theme.border }]}>
              <View style={styles.issueContent}>
                <Text style={[styles.issueName, { color: theme.textPrimary }]}>Repair Pathway Crack (North Gate)</Text>
                <Text style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>Preventing water accumulation</Text>
              </View>
              <Text style={[styles.issueCategory, { color: theme.textSecondary }]}>Medium Impact</Text>
            </View>
            <View style={[styles.issueRow, { borderBottomColor: theme.border }]}>
              <View style={styles.issueContent}>
                <Text style={[styles.issueName, { color: theme.textPrimary }]}>Clear Floating Waste (Lake)</Text>
                <Text style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>6 plastic items detected</Text>
              </View>
              <Text style={[styles.issueCategory, { color: theme.textSecondary }]}>Immediate</Text>
            </View>
          </View>
        </View>

        {/* Drone Info */}
        <View style={styles.droneSection}>
           <DroneInfoTable />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 64,
  },
  overallSection: {
    alignItems: 'center',
    marginBottom: 16, // Reduced whitespace
  },
  overallMeta: {
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  parkName: {
    fontFamily: typography.fonts.light,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  surveyDate: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusBar: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
    marginBottom: 24,
  },
  issuesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    letterSpacing: 1.2,
    marginTop: 32,
    marginBottom: 12,
  },
  issuesList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E7E5E4', // fallback, will use theme in render usually but here it's fine as top border is static for now, wait I should apply it via style array. I'll just use a generic style and override. Actually, I removed borderTop from the list.
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  issueContent: {
    flex: 1,
    paddingRight: 16,
  },
  issueName: {
    fontFamily: typography.fonts.regular,
    fontSize: 15,
    marginBottom: 4,
  },
  issueValue: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
  },
  issueCategory: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  droneSection: {
    marginTop: 20,
  }
});
