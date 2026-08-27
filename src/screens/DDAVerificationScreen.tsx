import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, typography } from '../theme';
import { Text } from 'react-native-paper';
import { MapPin, ShieldCheck, HardHat, TrendingUp, AlertCircle, Building2 } from 'lucide-react-native';

const mockDDAData = {
  hierarchy: {
    division: "South Zone",
    subDivision: "SD-4",
    park: "Sanjay Van"
  },
  scores: {
    division: 78,
    subDivision: 82,
    park: 72
  },
  contractor: {
    name: "GreenEarth Maintenance Ltd.",
    status: "compliant",
    verificationScore: 88,
    lastAudit: "2025-08-01"
  },
  sanctionedWorks: [
    {
      id: 1,
      task: "Pathway Resurfacing (North Gate)",
      sanctioned: true,
      aiVerified: true,
      geoTagged: true,
      status: "completed"
    },
    {
      id: 2,
      task: "Canopy Pruning (Zone C)",
      sanctioned: true,
      aiVerified: false,
      geoTagged: false,
      status: "unexecuted" // Unexecuted maintenance items identification
    },
    {
      id: 3,
      task: "Lake Bank Clearing",
      sanctioned: true,
      aiVerified: true,
      geoTagged: true,
      status: "completed"
    }
  ]
};

/** Which Reports section covers each sanctioned work, so the audit row leads to
 * the evidence behind its verdict. */
const WORK_TO_CATEGORY: Record<number, string> = {
  1: 'infrastructure',
  2: 'plantation-green-cover',
  3: 'water-bodies',
};

export const DDAVerificationScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [images, setImages] = useState<Record<string, string>>({});

  const pickImage = async (key: string) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImages(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>DDA VERIFICATION</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Automated Compliance & Audit
        </Text>
      </View>

      {/* Division Hierarchy Scorecard */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HIERARCHY SCORECARD</Text>
        <View style={styles.hierarchyGrid}>
          <View style={[styles.hierarchyCard, { borderRightColor: theme.border, borderRightWidth: 1 }]}>
            <Text style={[styles.hierarchyValue, { color: theme.textPrimary }]}>{mockDDAData.scores.division}</Text>
            <Text style={[styles.hierarchyLabel, { color: theme.textSecondary }]}>Division</Text>
            <Text style={[styles.hierarchyName, { color: theme.textSecondary }]}>{mockDDAData.hierarchy.division}</Text>
          </View>
          <View style={[styles.hierarchyCard, { borderRightColor: theme.border, borderRightWidth: 1 }]}>
            <Text style={[styles.hierarchyValue, { color: theme.textPrimary }]}>{mockDDAData.scores.subDivision}</Text>
            <Text style={[styles.hierarchyLabel, { color: theme.textSecondary }]}>Sub-Div</Text>
            <Text style={[styles.hierarchyName, { color: theme.textSecondary }]}>{mockDDAData.hierarchy.subDivision}</Text>
          </View>
          <View style={styles.hierarchyCard}>
            <Text style={[styles.hierarchyValue, { color: theme.textPrimary }]}>{mockDDAData.scores.park}</Text>
            <Text style={[styles.hierarchyLabel, { color: theme.textSecondary }]}>Park</Text>
            <Text style={[styles.hierarchyName, { color: theme.textSecondary }]}>{mockDDAData.hierarchy.park}</Text>
          </View>
        </View>
      </View>

      {/* Contractor Performance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CONTRACTOR VERIFICATION</Text>
        <View style={[styles.contractorCard, { borderColor: theme.border }]}>
          <View style={styles.contractorHeader}>
            <HardHat size={20} color={theme.textPrimary} strokeWidth={1.5} />
            <Text style={[styles.contractorName, { color: theme.textPrimary }]}>{mockDDAData.contractor.name}</Text>
          </View>
          <View style={styles.contractorMetrics}>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{mockDDAData.contractor.verificationScore}%</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>AI Verified SLA</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.statusGreen }]}>COMPLIANT</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Status</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sanctioned Works Verification */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SANCTIONED WORKS vs DRONE IMAGERY</Text>
        
        {mockDDAData.sanctionedWorks.map((work) => (
          <View key={work.id} style={[styles.workRow, { borderBottomColor: theme.border }]}>
            <Pressable
              onPress={() => {
                const target = WORK_TO_CATEGORY[work.id];
                if (target) navigation.navigate('Reports', { focusCategoryId: target, focusNonce: Date.now() });
              }}
              style={({ pressed }) => [styles.workHeader, { opacity: pressed ? 0.55 : 1 }]}
            >
              <Text style={[styles.workName, { color: theme.textPrimary }]}>{work.task}</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: work.status === 'completed' ? theme.surfaceLight : theme.accentRed + '20' }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: work.status === 'completed' ? theme.statusGreen : theme.accentRed }
                ]}>
                  {work.status === 'unexecuted' ? 'UNEXECUTED' : 'VERIFIED'}
                </Text>
              </View>
            </Pressable>
            
            <View style={styles.verificationTags}>
              <View style={styles.tag}>
                <MapPin size={12} color={work.geoTagged ? theme.statusGreen : theme.accentRed} />
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>Geo-Tagged</Text>
              </View>
              <View style={styles.tag}>
                <ShieldCheck size={12} color={work.aiVerified ? theme.statusGreen : theme.accentRed} />
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>AI Confirmed</Text>
              </View>
            </View>

            {/* Per-item Image Comparison */}
            <View style={styles.miniImagesRow}>
              <TouchableOpacity onPress={() => pickImage(`${work.id}_before`)} style={[styles.miniImagePlaceholder, { backgroundColor: theme.surfaceLight }]}>
                {images[`${work.id}_before`] ? (
                  <Image source={{ uri: images[`${work.id}_before`] }} style={styles.pickedMiniImage} />
                ) : (
                  <Text style={[styles.miniPlaceholderText, { color: theme.textSecondary }]}>PLAN</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickImage(`${work.id}_after`)} style={[styles.miniImagePlaceholder, { backgroundColor: theme.surfaceLight }]}>
                {images[`${work.id}_after`] ? (
                  <Image source={{ uri: images[`${work.id}_after`] }} style={styles.pickedMiniImage} />
                ) : (
                  <Text style={[styles.miniPlaceholderText, { color: theme.statusGreen }]}>DRONE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  screenTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
  },
  hierarchyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hierarchyCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  hierarchyValue: {
    fontFamily: typography.fonts.medium,
    fontSize: 28,
    marginBottom: 4,
  },
  hierarchyLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 2,
  },
  hierarchyName: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
  },
  contractorCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  contractorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contractorName: {
    fontFamily: typography.fonts.medium,
    fontSize: 16,
  },
  contractorMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 1,
  },
  workRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  workHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workName: {
    fontFamily: typography.fonts.medium,
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: typography.fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  verificationTags: {
    flexDirection: 'row',
    gap: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontFamily: typography.fonts.regular,
    fontSize: 12,
  },
  miniImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  miniImagePlaceholder: {
    height: 60,
    width: 60,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  miniPlaceholderText: {
    fontFamily: typography.fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  pickedMiniImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  }
});
