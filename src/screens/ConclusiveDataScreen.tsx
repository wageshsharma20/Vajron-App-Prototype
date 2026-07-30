import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { Download } from 'lucide-react-native';
import { EvidenceAccordion } from '../components/EvidenceAccordion';
import mockEvidenceLog from '../data/mockEvidenceLog.json';

export const ConclusiveDataScreen = () => {
  const { theme } = useTheme();

  const totalAnomalies = mockEvidenceLog.reduce((sum: number, cat: any) => sum + cat.anomalyCount, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Evidence Log</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {totalAnomalies} anomalies across {mockEvidenceLog.filter((c: any) => c.anomalyCount > 0).length} categories
            </Text>
          </View>
          <TouchableOpacity style={[styles.exportBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Download size={13} color={theme.textPrimary} />
            <Text style={[styles.exportText, { color: theme.textPrimary }]}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Accordions */}
        {mockEvidenceLog.map((category: any, index: number) => (
          <EvidenceAccordion key={category.category} data={category} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.md,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 10,
    marginTop: 1,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  exportText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
  },
});
