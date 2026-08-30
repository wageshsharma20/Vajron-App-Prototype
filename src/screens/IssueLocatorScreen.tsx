import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, Modal, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronDown, MapPin, X } from 'lucide-react-native';
import { useTheme, typography } from '../theme';
import { useI18n } from '../i18n';
import { PARKS } from '../data/parks';
import {
  anomaliesForPark,
  frameFor,
  formatAnomalyTime,
  type Anomaly,
} from '../data/anomalies';

/**
 * Where every issue the survey found actually is.
 *
 * Laid out like the Recordings tab: one card per park, in the same order, so
 * the two lists read as the same set of sites seen two ways. A card opens in
 * place rather than pushing to another screen — the findings belong to the park
 * they sit under, and keeping them there lets an officer compare two parks
 * without losing their place.
 *
 * Each finding carries the same wording the app raises as a notification during
 * playback, the still from the moment it was raised, and the map reference for
 * the spot — read it, see it, go stand in front of it.
 */
export const IssueLocatorScreen = () => {
  const { theme } = useTheme();
  const { translateAny, translateNumber } = useI18n();

  const [openParkId, setOpenParkId] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<Anomaly | null>(null);

  /**
   * Red for something to act on now, amber for something to plan for, and a
   * neutral grey for an observation — never blue, and never green, since none
   * of these are good news.
   */
  const severityColor = (type: Anomaly['type']) => {
    if (type === 'error') return theme.accentRed;
    if (type === 'warning') return theme.accentAmber;
    return theme.textSecondary;
  };

  const severityLabel = (type: Anomaly['type']) => {
    if (type === 'error') return 'NEEDS ATTENTION NOW';
    if (type === 'warning') return 'WORTH LOOKING AT';
    return 'FOR INFORMATION';
  };

  const openInMaps = (anomaly: Anomaly) => {
    // Core Linking rather than expo-linking: this only ever opens an external
    // https link, which core handles on both web and native, and the Expo
    // package is an extension of exactly this API.
    Linking.openURL(anomaly.mapUrl).catch(() => {
      // Nothing sensible to fall back to — the coordinates stay on screen, so
      // the reference is still usable even when no map app will take it.
    });
  };

  const renderFinding = (a: Anomaly) => {
    const frame = frameFor(a.id);
    return (
      <View key={a.id} style={[styles.finding, { borderTopColor: theme.border }]}>
        <View style={styles.findingMeta}>
          <Text style={[styles.severity, { color: severityColor(a.type) }]}>
            {translateAny(severityLabel(a.type))}
          </Text>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatAnomalyTime(a.time)}
          </Text>
        </View>

        <Text style={[styles.findingTitle, { color: theme.textPrimary }]}>
          {translateAny(a.title)}
        </Text>
        <Text style={[styles.findingMessage, { color: theme.textSecondary }]}>
          {translateAny(a.message)}
        </Text>

        {/* The still on the left, the map reference on the right. */}
        <View style={styles.evidenceRow}>
          {frame ? (
            <Pressable
              onPress={() => setZoomed(a)}
              accessibilityRole="imagebutton"
              accessibilityLabel={translateAny('Open the photo full screen')}
              style={({ pressed }) => [
                styles.thumbWrap,
                { borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Image source={frame} style={styles.thumb} resizeMode="cover" />
            </Pressable>
          ) : (
            <View
              style={[
                styles.thumbWrap,
                styles.thumbMissing,
                { borderColor: theme.border, backgroundColor: theme.surfaceLight },
              ]}
            >
              <Text style={[styles.thumbMissingText, { color: theme.textSecondary }]}>
                {translateAny('No photo')}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => openInMaps(a)}
            accessibilityRole="link"
            accessibilityLabel={translateAny('Open this location in Google Maps')}
            style={({ pressed }) => [
              styles.mapButton,
              { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MapPin size={18} color={theme.statusGreen} strokeWidth={1.6} />
            <Text style={[styles.mapButtonText, { color: theme.textSecondary }]}>
              {a.lat.toFixed(5)}, {a.lng.toFixed(5)}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {translateAny('VERIFICATION')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {translateAny('Automated Findings & Locations')}
          </Text>
        </View>

        {PARKS.map((p) => {
          const ready = p.status === 'ready';
          const findings = ready ? anomaliesForPark(p.id) : [];
          const isOpen = openParkId === p.id;

          return (
            <View
              key={p.id}
              style={[
                styles.card,
                {
                  borderColor: isOpen ? theme.accentAmber : theme.border,
                  backgroundColor: theme.surface,
                  opacity: ready ? 1 : 0.6,
                },
              ]}
            >
              <Pressable
                onPress={() => (ready ? setOpenParkId(isOpen ? null : p.id) : undefined)}
                disabled={!ready}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                style={styles.cardHeader}
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.parkName, { color: theme.textPrimary }]}>
                    {translateAny(p.name)}
                  </Text>
                  {/* Translated as a whole line, not pieced together: i18n
                      already carries the composed "<locality> · Surveyed <date>"
                      strings, and translating the parts separately would leave
                      the connector and word order in English. */}
                  <Text style={[styles.parkMeta, { color: theme.textSecondary }]}>
                    {translateAny(
                      ready
                        ? `${p.locality} · Surveyed ${p.surveyDate}`
                        : `${p.locality} · Survey scheduled`,
                    )}
                  </Text>
                  {ready && (
                    <Text style={[styles.parkZone, { color: theme.textSecondary }]}>
                      {translateNumber(findings.length)}{' '}
                      {translateAny(findings.length === 1 ? 'issue found' : 'issues found')}
                    </Text>
                  )}
                </View>

                {ready ? (
                  <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={18} color={theme.textSecondary} />
                  </View>
                ) : null}
              </Pressable>

              {isOpen && <View>{findings.map(renderFinding)}</View>}
            </View>
          );
        })}

        <Text style={[styles.footnote, { color: theme.textSecondary }]}>
          {translateAny(
            'Locations are approximate — read from satellite imagery, not recorded by the drone.',
          )}
        </Text>
      </ScrollView>

      {/* Full-screen photo */}
      <Modal
        visible={zoomed !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomed(null)}
      >
        <Pressable style={styles.zoomBackdrop} onPress={() => setZoomed(null)}>
          {zoomed && frameFor(zoomed.id) ? (
            <Image source={frameFor(zoomed.id)} style={styles.zoomImage} resizeMode="contain" />
          ) : null}

          <Pressable
            onPress={() => setZoomed(null)}
            accessibilityRole="button"
            accessibilityLabel={translateAny('Close')}
            style={styles.zoomClose}
            hitSlop={12}
          >
            <X size={26} color="#FFFFFF" strokeWidth={1.8} />
          </Pressable>

          {zoomed ? (
            <View style={styles.zoomCaption} pointerEvents="none">
              <Text style={styles.zoomTitle}>{translateAny(zoomed.title)}</Text>
              <Text style={styles.zoomMeta}>{translateAny(zoomed.message)}</Text>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
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
  card: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowMain: {
    flex: 1,
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
  finding: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  findingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  severity: {
    fontFamily: typography.fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  timestamp: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    fontVariant: typography.tabularNums,
  },
  findingTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    marginBottom: 3,
  },
  findingMessage: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    lineHeight: 21,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  thumbWrap: {
    width: 124,
    height: 72,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbMissing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMissingText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  mapButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    fontVariant: typography.tabularNums,
  },
  footnote: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    marginTop: 8,
  },
  zoomBackdrop: {
    flex: 1,
    // Solid, not a high-alpha black: at 0.92 the page behind still read through
    // clearly enough to compete with the photo, which defeats a viewer whose
    // whole job is to show one picture without distraction.
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '76%',
  },
  zoomClose: {
    position: 'absolute',
    top: 44,
    right: 20,
  },
  zoomCaption: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
  },
  zoomTitle: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.semiBold,
    fontSize: 17,
    marginBottom: 4,
  },
  zoomMeta: {
    color: '#D6D6D6',
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});
