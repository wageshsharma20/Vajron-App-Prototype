import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { Download, X } from 'lucide-react-native';
import { useTheme, typography } from '../theme';
import { InspectionAccordion } from '../components/InspectionAccordion';
import { mockChangeDetection } from '../data/mockData';
import { Text } from 'react-native-paper';
import { useLiveInspection } from '../replay/useLiveInspection';
import { useReplay } from '../replay/ReplayProvider';
import type { InspectionCategory } from '../types';

/** Which section explains each Changes-this-month row. Rows with no dedicated
 * section are absent and stay inert rather than opening something unrelated. */
const CHANGE_TO_CATEGORY: Record<string, string> = {
  'green-cover': 'plantation-green-cover',
  'new-plantation-survival': 'plantation-green-cover',
  'tree-canopy-growth': 'plantation-green-cover',
  'lawn-health': 'plantation-green-cover',
  'damaged-infrastructure': 'infrastructure',
  'pathway-length': 'infrastructure',
  'work-completion': 'infrastructure',
  encroachment: 'safety-security',
  'cleanliness-score': 'cleanliness',
  'irrigation-inventory': 'irrigation',
  'asset-inventory': 'asset-inventory',
  'gps-location': 'asset-inventory',
  'tree-geotagging': 'asset-inventory',
  'bench-count': 'asset-inventory',
  'dustbin-count': 'asset-inventory',
  'light-pole-count': 'asset-inventory',
  'play-equipment': 'asset-inventory',
};

// Maps the app's internal park id to the slug the report generator uses for
// both the whole-park workbook (public/reports/<file>.xlsx, unchanged) and the
// per-category exports (public/reports/categories/<slug>/<categoryId>.xlsx).
const PARK_REPORT_MAP: Record<string, { file: string; slug: string }> = {
  'sanjay-lake': { file: 'Sanjay_Lake_Park_AI_Detection_Report.xlsx', slug: 'sanjay-lake' },
  'lala-harydal': { file: 'Lala_Hardeval_AI_Detection_Report.xlsx', slug: 'lala-harydal' },
  'r-block-asaf-ali': { file: 'Asaf_Ali_AI_Detection_Report.xlsx', slug: 'r-block-asaf-ali' },
  'vasant-udyan': { file: 'Vasant_Udyan_AI_Detection_Report.xlsx', slug: 'vasant-udyan' },
  'vasant-vatika': { file: 'Vasant_Vatika_AI_Detection_Report.xlsx', slug: 'vasant-vatika' },
  'rohini-dda': { file: 'Rohini_AI_Detection_Report.xlsx', slug: 'rohini-dda' },
  'smriti-van-mayur-vihar': { file: 'Smriti_Van_AI_Detection_Report.xlsx', slug: 'smriti-van-mayur-vihar' },
};

export const ConclusiveDataScreen = ({ route }: any) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<Record<string, string>>({});

  // Every category tracks the drone recording: items update from the detector and
  // category issue counts recompute as the survey plays on the Camera tab.
  const { park, hasStarted, hasSurvey } = useReplay();
  const inspectionData = useLiveInspection();
  // The category whose download icon was tapped — drives the format sheet.
  // Null means the sheet is closed.
  const [formatFor, setFormatFor] = useState<InspectionCategory | null>(null);

  // Two ways a section gets focused: a deep link from the Dashboard (route
  // params) and a tap on a Changes-this-month row further down this same screen
  // (local state). Both stamp a nonce, so the most recent one simply wins and a
  // repeat tap still re-opens and re-scrolls rather than being seen as no change.
  const [localFocus, setLocalFocus] = useState<{ id: string; nonce: number } | null>(null);
  const routeFocus = route?.params?.focusCategoryId
    ? { id: route.params.focusCategoryId as string, nonce: (route.params.focusNonce as number) ?? 0 }
    : null;
  const activeFocus =
    localFocus && routeFocus ? (localFocus.nonce > routeFocus.nonce ? localFocus : routeFocus) : localFocus ?? routeFocus;
  const focusCategoryId: string | undefined = activeFocus?.id;
  const focusNonce: number | undefined = activeFocus?.nonce;

  /** Opens a section from elsewhere on this screen. */
  const focusCategory = useCallback((id: string) => {
    setLocalFocus({ id, nonce: Date.now() });
  }, []);
  const scrollRef = useRef<ScrollView>(null);
  // Each row's measured height, plus the list's own offset inside the ScrollView.
  // A row's position is derived by summing the heights above it rather than
  // trusting a reported y — see the note on onLayoutOffset in InspectionAccordion.
  const rowHeights = useRef<Record<string, number>>({});
  const listOffset = useRef(0);
  // Row order as currently rendered (the search box can filter rows out).
  const orderRef = useRef<string[]>([]);

  // Set while a deep link is waiting to be scrolled to. Scrolling is driven by
  // the target row's own onLayout rather than a timer: the row moves as other
  // sections collapse, and its layout callback is the only moment its final
  // position is actually known.
  const pendingFocus = useRef<string | null>(null);

  /** Scrolls the named category to the top of the list, from current heights. */
  const scrollToCategory = useCallback(
    (id: string) => {
      const node = scrollRef.current as any;
      if (!node?.scrollTo) return;
      const idx = orderRef.current.indexOf(id);
      if (idx < 0) return;
      const above = orderRef.current
        .slice(0, idx)
        .reduce((sum, rowId) => sum + (rowHeights.current[rowId] ?? 0), 0);
      const top = Math.max(0, listOffset.current + above - 8);

      if (Platform.OS === 'web') {
        // On web the ScrollView is a DOM node, and its scrollTo() is a no-op in
        // some engines (verified here: every argument form left scrollTop at 0)
        // while assigning scrollTop always works. Jumping rather than animating
        // also suits a list that has just reflowed.
        const el = (node.getScrollableNode?.() ?? node) as HTMLElement;
        if (el && typeof el.scrollTop === 'number') el.scrollTop = top;
        return;
      }
      node.scrollTo({ y: top, animated: true });
    },
    [],
  );

  const rememberOffset = useCallback(
    (id: string, height: number) => {
      rowHeights.current[id] = height;
      // A height change means the list reflowed, so anything queued to be
      // brought into view needs its position recomputed from the new heights.
      if (pendingFocus.current) scrollToCategory(pendingFocus.current);
    },
    [scrollToCategory],
  );

  useEffect(() => {
    if (!focusCategoryId) return;
    pendingFocus.current = focusCategoryId;

    // Rows shift while the previously-open section collapses, so one scroll is
    // not enough: re-apply it as the list settles. Each pass uses the freshest
    // reported offset, and onLayout corrects it in between, so the position
    // converges instead of depending on a single lucky moment.
    // The collapse animation runs for 300ms and React may batch the resulting
    // height reports after that, so corrections have to outlast it — an earlier
    // 600ms window closed while a stale expanded height was still in the sum and
    // left the list overshot by exactly that row's height.
    const passes = [0, 150, 350, 600, 900].map((delay) =>
      setTimeout(() => scrollToCategory(focusCategoryId), delay),
    );
    // Stop steering afterwards, so ordinary scrolling is never fought.
    const release = setTimeout(() => { pendingFocus.current = null; }, 1100);

    return () => { passes.forEach(clearTimeout); clearTimeout(release); };
  }, [focusCategoryId, focusNonce, scrollToCategory]);

  const pickImage = async (key: string) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  const totalIssues = useMemo(() => inspectionData.reduce((sum, cat) => sum + cat.issueCount, 0), [inspectionData]);
  const totalCategories = inspectionData.length;

  
  /** Downloads or shares a report file: web opens it as a same-origin static
   * asset; native pulls it from the GitHub release and hands it to the share
   * sheet, since that's the only way to get a file off-device on iOS/Android. */
  const downloadReportFile = async (webPath: string, nativeUrl: string, filename: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(webPath, '_blank');
      }
      return;
    }
    try {
      const destFile = new FileSystem.File(FileSystem.Paths.document, filename);
      const downloadedFile = await FileSystem.File.downloadFileAsync(nativeUrl, destFile, { idempotent: true });
      const uri = downloadedFile.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Download Complete', 'File saved to ' + uri);
      }
    } catch (e) {
      Alert.alert('Download Error', 'Failed to download report.');
    }
  };

  const handleDownload = async () => {
    const entry = PARK_REPORT_MAP[park.id];
    if (!entry) return;
    await downloadReportFile(
      `/reports/${entry.file}`,
      `https://github.com/wageshsharma20/Vajron-App-Prototype/releases/download/survey-media/${entry.file}`,
      entry.file,
    );
  };

  /** Per-category export in the chosen format — the same 9-category report the
   * DTU-styled generator produces from the park's source Excel, written as both
   * a workbook and a PDF (tools/generate-category-reports.js). */
  const downloadCategory = async (category: InspectionCategory, ext: 'xlsx' | 'pdf') => {
    const entry = PARK_REPORT_MAP[park.id];
    if (!entry) return;
    // The release is a flat namespace, so native assets carry the park slug in
    // the filename where the web path carries it as a directory.
    const filename = `${entry.slug}-${category.id}.${ext}`;
    await downloadReportFile(
      `/reports/categories/${entry.slug}/${category.id}.${ext}`,
      `https://github.com/wageshsharma20/Vajron-App-Prototype/releases/download/survey-media/${filename}`,
      filename,
    );
  };

  const handleCategoryFormat = async (ext: 'xlsx' | 'pdf') => {
    const category = formatFor;
    setFormatFor(null);
    if (category) await downloadCategory(category, ext);
  };

  const filteredData = useMemo(() => {
    return inspectionData.filter((cat) => {
      return cat.category.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, inspectionData]);

  orderRef.current = filteredData.map((cat) => cat.id);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      // Fires once the list has finished reflowing after a section opened or
      // closed — the first moment every row height is final. Timers alone were
      // landing on stale heights and overshooting by exactly the height of the
      // section that was still collapsing.
      onContentSizeChange={() => {
        if (pendingFocus.current) scrollToCategory(pendingFocus.current);
      }}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Past Data</Text>
        <Pressable style={styles.downloadBtn} onPress={handleDownload}>
          <Download size={24} color={theme.textPrimary} strokeWidth={1} />
        </Pressable>
      </View>
      {/* Full width, outside the title row: the button only needs to line up with
          the heading, and the longer park names need every pixel to stay on one line. */}
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {park.name}
        {hasSurvey ? (hasStarted ? ' · analysing recording' : ` · surveyed ${park.surveyDate}`) : ' · survey scheduled'}
      </Text>

      {/* Zen Search Bar (Bottom border only) */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border }]}>
        <TextInput
          placeholder="Search..."
          placeholderTextColor={theme.textSecondary}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          selectionColor={theme.accentTeal}
        />
      </View>

      {/* Inspection Accordions */}
      <View
        style={styles.accordionsContainer}
        onLayout={(e) => { listOffset.current = e.nativeEvent.layout.y; }}
      >
        {filteredData.map((category, index) => (
          <InspectionAccordion
            key={category.id}
            data={category}
            index={index}
            onDownload={setFormatFor}
            autoExpand={focusCategoryId ? category.id === focusCategoryId : undefined}
            focusNonce={focusNonce}
            onLayoutOffset={rememberOffset}
          />
        ))}
      </View>

      {/* Monthly Changes Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CHANGES THIS MONTH</Text>
        
        <View style={[styles.changesGrid, { borderTopColor: theme.border }]}>
          {mockChangeDetection.map((change) => {
            const isImproved = change.trend === 'improved';
            const isDeclined = change.trend === 'declined';
            const statusColor = isImproved ? theme.statusGreen : isDeclined ? theme.accentRed : theme.textSecondary;
            const sign = change.change > 0 ? '+' : '';

            const target = CHANGE_TO_CATEGORY[change.id];
            const inner = (
              <>
                <Text style={[styles.changeMetric, { color: theme.textPrimary }]}>{change.metric}</Text>
                <View style={styles.changeValuesRow}>
                  <Text style={[styles.changeValues, { color: theme.textSecondary }]}>
                    {change.previousValue} → {change.currentValue}
                  </Text>
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {sign}{change.change}{change.unit === '%' ? '%' : ''}
                  </Text>
                </View>
              </>
            );

            if (!target) {
              return (
                <View key={change.id} style={[styles.changeRow, { borderBottomColor: theme.border }]}>
                  {inner}
                </View>
              );
            }
            return (
              <Pressable
                key={change.id}
                onPress={() => focusCategory(target)}
                style={({ pressed }) => [
                  styles.changeRow,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.55 : 1 },
                ]}
              >
                {inner}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Before & After Comparison Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>VISUAL EVIDENCE (BEFORE & AFTER)</Text>
        
        {/* Item 1 */}
        <View style={styles.comparisonCard}>
          <Text style={[styles.comparisonSubtitle, { color: theme.textPrimary }]}>North Gate Pathway Crack Repair</Text>
          <View style={styles.imagesRow}>
            <View style={[styles.imageWrapper, { backgroundColor: theme.surfaceLight }]}>
              <TouchableOpacity onPress={() => pickImage('repair_before')} style={styles.imagePlaceholder}>
                {images['repair_before'] ? (
                  <Image source={{ uri: images['repair_before'] }} style={styles.pickedImage} />
                ) : (
                  <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>BEFORE</Text>
                )}
              </TouchableOpacity>
              <Text style={[styles.imageLabel, { color: theme.textSecondary }]}>July 15, 2025</Text>
            </View>
            <View style={[styles.imageWrapper, { backgroundColor: theme.surfaceLight }]}>
              <TouchableOpacity onPress={() => pickImage('repair_after')} style={[styles.imagePlaceholder, { borderColor: theme.statusGreen, borderWidth: 1 }]}>
                {images['repair_after'] ? (
                  <Image source={{ uri: images['repair_after'] }} style={styles.pickedImage} />
                ) : (
                  <Text style={[styles.placeholderText, { color: theme.statusGreen }]}>AFTER</Text>
                )}
              </TouchableOpacity>
              <Text style={[styles.imageLabel, { color: theme.textSecondary }]}>Aug 04, 2025</Text>
            </View>
          </View>
        </View>

        {/* Item 2 */}
        <View style={styles.comparisonCard}>
          <Text style={[styles.comparisonSubtitle, { color: theme.textPrimary }]}>Lake Bank Vegetation Clearance</Text>
          <View style={styles.imagesRow}>
            <View style={[styles.imageWrapper, { backgroundColor: theme.surfaceLight }]}>
              <TouchableOpacity onPress={() => pickImage('lake_before')} style={styles.imagePlaceholder}>
                {images['lake_before'] ? (
                  <Image source={{ uri: images['lake_before'] }} style={styles.pickedImage} />
                ) : (
                  <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>BEFORE</Text>
                )}
              </TouchableOpacity>
              <Text style={[styles.imageLabel, { color: theme.textSecondary }]}>July 15, 2025</Text>
            </View>
            <View style={[styles.imageWrapper, { backgroundColor: theme.surfaceLight }]}>
              <TouchableOpacity onPress={() => pickImage('lake_after')} style={[styles.imagePlaceholder, { borderColor: theme.statusGreen, borderWidth: 1 }]}>
                {images['lake_after'] ? (
                  <Image source={{ uri: images['lake_after'] }} style={styles.pickedImage} />
                ) : (
                  <Text style={[styles.placeholderText, { color: theme.statusGreen }]}>AFTER</Text>
                )}
              </TouchableOpacity>
              <Text style={[styles.imageLabel, { color: theme.textSecondary }]}>Aug 04, 2025</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>

    {/* Format picker — one download icon per row, both formats reachable. */}
    {formatFor && (
      <Pressable style={styles.sheetOverlay} onPress={() => setFormatFor(null)}>
        <Pressable style={[styles.sheetContent, { backgroundColor: theme.surfaceLight }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>DOWNLOAD</Text>
            <Pressable onPress={() => setFormatFor(null)} hitSlop={8}>
              <X size={22} color={theme.textPrimary} strokeWidth={1} />
            </Pressable>
          </View>
          <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>{formatFor.category}</Text>
          {([['xlsx', 'EXCEL', 'Spreadsheet (.xlsx)'], ['pdf', 'PDF', 'Document (.pdf)']] as const).map(([ext, label, hint]) => (
            <Pressable
              key={ext}
              style={[styles.formatRow, { borderBottomColor: theme.border }]}
              onPress={() => handleCategoryFormat(ext)}
            >
              <Text style={[styles.formatLabel, { color: theme.textPrimary }]}>{label}</Text>
              <Text style={[styles.formatHint, { color: theme.textSecondary }]}>{hint}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: typography.fonts.light,
    fontSize: 20,
    letterSpacing: 2,
  },
  sheetSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  formatRow: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formatLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
    letterSpacing: 1,
  },
  formatHint: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fonts.light,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    // Tightened from 1.5: at 1.5 the tracking alone added ~57 px to this string,
    // which pushed "…22 May 2026" onto a second line once the row stopped
    // overflowing. This keeps the park name and survey date on one line.
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 24,
  },
  downloadBtn: {
    padding: 8,
    // Aligns the icon with the 16 px content padding used across the screen.
    marginRight: 0,
  },
  searchContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  searchInput: {
    fontFamily: typography.fonts.regular,
    fontSize: 16,
    letterSpacing: 1,
  },
  accordionsContainer: {
    marginBottom: 32,
  },
  changesSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    letterSpacing: 1.2,
    marginBottom: 24,
  },
  changesGrid: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  changeMetric: {
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    flex: 1,
    paddingRight: 16,
  },
  changeValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeValues: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
  },
  badgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: 16,
    minWidth: 40,
    textAlign: 'right',
  },
  section: {
    marginBottom: 32,
  },
  comparisonCard: {
    marginBottom: 24,
  },
  comparisonSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 8,
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#E5E7EB', // slightly darker grey for image box
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    letterSpacing: 2,
  },
  imageLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  }
});
