import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { Download } from 'lucide-react-native';
import { useTheme, typography } from '../theme';
import { InspectionAccordion } from '../components/InspectionAccordion';
import { mockChangeDetection } from '../data/mockData';
import { Text } from 'react-native-paper';
import { useLiveInspection } from '../replay/useLiveInspection';
import { useReplay } from '../replay/ReplayProvider';

export const ConclusiveDataScreen = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<Record<string, string>>({});

  // Every category tracks the drone recording: items update from the detector and
  // category issue counts recompute as the survey plays on the Camera tab.
  const { park, hasStarted, hasSurvey } = useReplay();
  const inspectionData = useLiveInspection();

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

  
  const handleDownload = async () => {
    const map: Record<string, string> = {
      'sanjay-lake': 'Sanjay_Lake_Park_AI_Detection_Report.xlsx',
      'lala-harydal': 'Lala_Hardeval_AI_Detection_Report.xlsx',
      'r-block-asaf-ali': 'Asaf_Ali_AI_Detection_Report.xlsx',
      'vasant-udyan': 'Vasant_Udyan_AI_Detection_Report.xlsx',
      'vasant-vatika': 'Vasant_Vatika_AI_Detection_Report.xlsx',
      'rohini-dda': 'Rohini_AI_Detection_Report.xlsx',
      'smriti-van-mayur-vihar': 'Smriti_Van_AI_Detection_Report.xlsx'
    };
    const filename = map[park.id];
    if (!filename) return;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(`/reports/${filename}`, '_blank');
      }
    } else {
      try {
        const url = `https://github.com/wageshsharma20/Vajron-App-Prototype/releases/download/survey-media/${filename}`;
        const fileUri = FileSystem.documentDirectory + filename;
        const { uri } = await FileSystem.downloadAsync(url, fileUri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Download Complete', 'File saved to ' + uri);
        }
      } catch (e) {
        Alert.alert('Download Error', 'Failed to download report.');
      }
    }
  };

  const filteredData = useMemo(() => {
    return inspectionData.filter((cat) => {
      return cat.category.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, inspectionData]);

  return (
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
          <InspectionAccordion key={category.id} data={category} index={index} />
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
