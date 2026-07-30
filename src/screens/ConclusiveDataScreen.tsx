import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { InspectionAccordion } from '../components/InspectionAccordion';
import { Divider } from '../components/Divider';
import mockInspection from '../data/mockInspection.json';
import mockChangeDetection from '../data/mockChangeDetection.json';
import { Searchbar, Button, Surface, Text } from 'react-native-paper';
import { InspectionCategory } from '../types';

const inspectionData = mockInspection as InspectionCategory[];

export const ConclusiveDataScreen = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const totalIssues = useMemo(() => inspectionData.reduce((sum, cat) => sum + cat.issueCount, 0), []);
  const totalCategories = inspectionData.length;

  const filteredData = useMemo(() => {
    return inspectionData.filter((cat) => {
      return cat.category.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text variant="titleMedium" style={[styles.title, { color: theme.textPrimary }]}>Inspection Report</Text>
          <Text variant="bodySmall" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {totalIssues} issues across {totalCategories} categories
          </Text>
        </View>
        <Button 
          mode="elevated" 
          icon={() => <Download size={16} color={theme.textPrimary} />}
          onPress={() => {}}
          textColor={theme.textPrimary}
          style={{ backgroundColor: theme.surface }}
        >
          Download
        </Button>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search categories..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchContainer, { backgroundColor: theme.surface }] as any}
        inputStyle={{ color: theme.textPrimary, fontFamily: typography.fonts.regular, fontSize: typography.sizes.sm } as any}
        iconColor={theme.textSecondary}
        placeholderTextColor={theme.textSecondary}
        elevation={0 as any}
      />

      {/* Inspection Accordions */}
      <View style={styles.accordionsContainer}>
        {filteredData.map((category, index) => (
          <InspectionAccordion key={category.id} data={category} index={index} />
        ))}
      </View>

      {/* Monthly Changes Section */}
      <View style={styles.changesSection}>
        <Divider>Monthly Changes (vs Last Survey)</Divider>
        
        <View style={styles.changesGrid}>
          {mockChangeDetection.map((change) => {
            const isImproved = change.trend === 'improved';
            const isDeclined = change.trend === 'declined';
            const badgeColor = isImproved ? theme.statusGreen : isDeclined ? theme.accentRed : theme.textSecondary;
            const Icon = isImproved ? TrendingUp : isDeclined ? TrendingDown : Minus;

            return (
              <Surface key={change.id} style={[styles.changeCard, { backgroundColor: theme.surface, borderColor: theme.border }] as any} elevation={1 as any}>
                <Text variant="labelLarge" style={[styles.changeMetric, { color: theme.textPrimary }]}>{change.metric}</Text>
                <View style={styles.changeValuesRow}>
                  <Text variant="bodyMedium" style={[styles.changeValues, { color: theme.textSecondary }]}>
                    {change.previousValue} → {change.currentValue}
                  </Text>
                  <View style={[styles.changeBadge, { backgroundColor: badgeColor + '20' }]}>
                    <Icon size={12} color={badgeColor} style={styles.badgeIcon} />
                    <Text style={[styles.badgeText, { color: badgeColor }]}>
                      {Math.abs(change.change)}{change.unit === '%' ? '%' : ''}
                    </Text>
                  </View>
                </View>
              </Surface>
            );
          })}
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.md,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
  },
  searchContainer: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  accordionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  changesSection: {
    marginTop: 8,
  },
  changesGrid: {
    gap: 12,
  },
  changeCard: {
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  changeMetric: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
  },
  changeValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeValues: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
  },
});
