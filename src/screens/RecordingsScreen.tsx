/**
 * Recordings tab — pick a park, then play its survey recording.
 *
 * Selecting a park switches the whole app to that park's survey: the Dashboard
 * scores and Reports findings all read from the same selection. Sanjay Lake's
 * survey is two clips played back to back (the four-clip park survey, then the
 * works-zone clip) so it appears as one continuous recording. Only parks with a
 * processed survey can be opened; the rest are listed as scheduled.
 */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight, Play, Clock, ArrowLeft } from 'lucide-react-native';
import { useTheme, typography } from '../theme';
import { useI18n } from '../i18n';
import { useReplay } from '../replay/ReplayProvider';
import { PARKS } from '../data/parks';
import { RecordingPlayerScreen } from './RecordingPlayerScreen';

export const RecordingsScreen = () => {
  const { theme } = useTheme();
  const { translateAny } = useI18n();
  const { park, selectPark } = useReplay();
  const [openParkId, setOpenParkId] = useState<string | null>(null);

  if (openParkId) {
    return <RecordingPlayerScreen onBack={() => setOpenParkId(null)} />;
  }

  const open = (id: string) => {
    if (id !== park.id) selectPark(id);
    setOpenParkId(id);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{translateAny("Recordings")}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{translateAny("Choose a park to view its drone survey")}</Text>
      </View>

      {PARKS.map((p) => {
        const ready = p.status === 'ready';
        const isCurrent = p.id === park.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => (ready ? open(p.id) : undefined)}
            disabled={!ready}
            style={[
              styles.row,
              {
                borderColor: isCurrent ? theme.accentAmber : theme.border,
                backgroundColor: theme.surface,
                opacity: ready ? 1 : 0.6,
              },
            ]}
          >
            <View style={styles.rowMain}>
              <Text style={[styles.parkName, { color: theme.textPrimary }]}>{translateAny(p.name)}</Text>
              <Text style={[styles.parkMeta, { color: theme.textSecondary }]}>
                {ready ? `${p.locality} · Surveyed ${p.surveyDate}` : `${p.locality} · Survey scheduled`}
              </Text>
              {ready && p.zone && (
                <Text style={[styles.parkZone, { color: theme.textSecondary }]} numberOfLines={1}>
                  {translateAny(p.zone)}
                </Text>
              )}
            </View>

            {ready ? (
              <View style={styles.rowEnd}>
                {isCurrent && (
                  <Text style={[styles.currentTag, { color: theme.accentAmber }]}>{translateAny("SELECTED")}</Text>
                )}
                <Play size={18} color={theme.textPrimary} />
                <ChevronRight size={18} color={theme.textSecondary} />
              </View>
            ) : (
              <View style={styles.rowEnd}>
                <Clock size={16} color={theme.textSecondary} />
              </View>
            )}
          </Pressable>
        );
      })}

      <Text style={[styles.footnote, { color: theme.textSecondary }]}>
        Scheduled sites have no processed survey yet. Scores and findings appear once a flight has
        been flown and analysed.
      </Text>
    </ScrollView>
  );
};

/** Back control reused by the player screen. */
export const BackToList = ({ onPress }: { onPress: () => void }) => {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.backBtn} hitSlop={10}>
      <ArrowLeft size={20} color={theme.textPrimary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 10,
  },
  header: {
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  row: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowMain: {
    flex: 1,
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parkName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
  },
  parkMeta: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    marginTop: 3,
  },
  parkZone: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    opacity: 0.8,
  },
  currentTag: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  footnote: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
