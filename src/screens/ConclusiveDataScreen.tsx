import React, { useState, useMemo } from 'react';
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

export const ConclusiveDataScreen = () => {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
      <View style={styles.accordionsContainer}>
        {filteredData.map((category, index) => (
          <InspectionAccordion key={category.id} data={category} index={index} onDownload={setFormatFor} />
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

            return (
              <View key={change.id} style={[styles.changeRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.changeMetric, { color: theme.textPrimary }]}>{change.metric}</Text>
                <View style={styles.changeValuesRow}>
                  <Text style={[styles.changeValues, { color: theme.textSecondary }]}>
                    {change.previousValue} → {change.currentValue}
                  </Text>
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {sign}{change.change}{change.unit === '%' ? '%' : ''}
                  </Text>
                </View>
              </View>
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
