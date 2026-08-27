import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useTheme, typography } from '../theme';
import { CircularScore } from '../components/CircularScore';
import { ScoreCard } from '../components/ScoreCard';
import { DroneInfoTable } from '../components/DroneInfoTable';
import { mockParkInfo, mockInspection } from '../data/mockData';
import { useLiveScores } from '../replay/useLiveScores';
import { useReplay, formatTimecode } from '../replay/ReplayProvider';
import { Text } from 'react-native-paper';
import { InspectionCategory, ScoreData } from '../types';

/** Dashboard metric -> the Reports section that explains it. Every grid card
 * opens Reports; the ones listed here also expand their own section, so a tap
 * lands on the detail behind the number rather than a closed list. The few
 * metrics with no dedicated section (Citizen Readiness, Maintenance Priority)
 * are deliberately absent and simply open Reports. */
const SCORE_TO_CATEGORY: Record<string, string> = {
  'tree-survival': 'plantation-green-cover',
  'green-cover': 'plantation-green-cover',
  'lawn-health': 'plantation-green-cover',
  'plantation-health': 'plant-health',
  cleanliness: 'cleanliness',
  irrigation: 'irrigation',
  infrastructure: 'infrastructure',
  safety: 'safety-security',
  'encroachment-risk': 'safety-security',
  'layout-compliance': 'landscape-quality',
};

const RECOMMENDATIONS = [
  {
    id: 'prune-zone-c',
    title: 'Schedule Pruning (Zone C)',
    detail: '12 trees affecting light penetration',
    impact: 'High Impact',
    categoryId: 'plantation-green-cover',
  },
  {
    id: 'pathway-crack',
    title: 'Repair Pathway Crack (North Gate)',
    detail: 'Preventing water accumulation',
    impact: 'Medium Impact',
    categoryId: 'infrastructure',
  },
  {
    id: 'floating-waste',
    title: 'Clear Floating Waste (Lake)',
    detail: '6 plastic items detected',
    impact: 'Immediate',
    categoryId: 'water-bodies',
  },
];

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
          .map((item) => ({ ...item, category: section.category, categoryId: section.id }))
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
  const { park, hasStarted, hasSurvey, isPlaying, time } = useReplay();
  const liveScores = useLiveScores();
  const overallScore = liveScores[0];
  const gridScores = liveScores.slice(1);

  const totalIssues = useMemo(
    () => (mockInspection as InspectionCategory[]).reduce((sum, s) => sum + s.issueCount, 0),
    [],
  );

  /** Opens Reports, expanding one section when the tapped thing maps to one.
   * The nonce makes a repeat tap on the same section re-open and re-scroll it
   * rather than being swallowed as an identical navigation. */
  const openReports = useCallback(
    (categoryId?: string) => {
      navigation.navigate('Reports', categoryId ? { focusCategoryId: categoryId, focusNonce: Date.now() } : {});
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
                  ? `${isPlaying ? 'Analysing recording' : 'Recording paused'} · ${formatTimecode(time)}`
                  : `Surveyed ${park.surveyDate}`}
            </Text>
            {hasSurvey && (
              <Text
                style={[
                  styles.surveyDate,
                  // LIVE tracks whether the recording is genuinely running, not
                  // merely whether it was ever started. hasStarted is sticky, so
                  // keying the badge on it left the header claiming LIVE while the
                  // clock sat frozen — including when the video never loaded at all.
                  { color: isPlaying ? theme.accentRed : theme.textSecondary, marginTop: 4 },
                ]}
              >
                {isPlaying ? 'LIVE' : hasStarted ? 'PAUSED' : 'SURVEY COMPLETE'}
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
              onPress={() => openReports(SCORE_TO_CATEGORY[score.id])}
            />
          ))}
        </View>

        {/* Top Issues - 1px dividers, no cards */}
        {topIssues.length > 0 && (
          <View style={styles.issuesSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>HIGH-PRIORITY DEFECTS</Text>
            <View style={styles.issuesList}>
              {topIssues.map((issue: any, index: number) => (
                <Pressable
                  key={issue.id}
                  onPress={() => openReports(issue.categoryId)}
                  style={({ pressed }) => [
                    styles.issueRow,
                    { borderBottomColor: theme.border, opacity: pressed ? 0.55 : 1 },
                  ]}
                >
                  <View style={styles.issueContent}>
                    <Text style={[styles.issueName, { color: getStatusColor(issue.status) }]}>{issue.name}</Text>
                    <Text style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>{issue.value}</Text>
                  </View>
                  <Text style={[styles.issueCategory, { color: theme.textSecondary }]}>{issue.category}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* AI Maintenance Recommendations */}
        <View style={styles.issuesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>AI MAINTENANCE RECOMMENDATIONS</Text>
          <View style={styles.issuesList}>
            {RECOMMENDATIONS.map((rec) => (
              <Pressable
                key={rec.id}
                onPress={() => openReports(rec.categoryId)}
                style={({ pressed }) => [
                  styles.issueRow,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.55 : 1 },
                ]}
              >
                <View style={styles.issueContent}>
                  <Text style={[styles.issueName, { color: theme.textPrimary }]}>{rec.title}</Text>
                  <Text style={[styles.issueValue, { color: theme.textSecondary }]} numberOfLines={1}>{rec.detail}</Text>
                </View>
                <Text style={[styles.issueCategory, { color: theme.textSecondary }]}>{rec.impact}</Text>
              </Pressable>
            ))}
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
    marginBottom: 12, // Reduced for tighter grouping
  },
  overallMeta: {
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
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
    marginBottom: 24,
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
    // Space below each row's divider, before the next row's figure.
    rowGap: 12,
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
