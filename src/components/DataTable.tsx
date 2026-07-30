import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { Download, ChevronDown } from 'lucide-react-native';
import mockConclusiveData from '../data/mockConclusiveData.json';

export const DataTable = () => {
  const { theme } = useTheme();

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return theme.accentRed;
      case 'caution': return theme.accentAmber;
      case 'normal': return theme.statusGreen;
      default: return theme.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return theme.accentRed;
      case 'resolved': return theme.statusGreen;
      case 'false positive': return theme.textSecondary;
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Evidence Log</Text>
        <TouchableOpacity style={[styles.exportBtn, { borderColor: theme.border }]}>
          <Download size={14} color={theme.textPrimary} />
          <Text style={[styles.exportText, { color: theme.textPrimary }]}>EXPORT</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal bounces={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerCell, { color: theme.textSecondary, width: 120 }]}>CATEGORY</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, width: 180 }]}>ZONE / GPS</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, width: 100 }]}>CONFIDENCE</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, width: 100 }]}>SEVERITY</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, width: 120 }]}>STATUS</Text>
          </View>
          
          {/* Rows */}
          {mockConclusiveData.map((row) => (
            <TouchableOpacity key={row.id} style={[styles.row, { borderBottomColor: theme.border }]}>
              <Text style={[styles.cell, { color: theme.textPrimary, width: 120 }]}>
                {row.category.toUpperCase()}
              </Text>
              <Text style={[styles.cell, { color: theme.textPrimary, width: 180 }]} numberOfLines={1}>
                {row.zone}
              </Text>
              <Text style={[styles.cell, { color: theme.textPrimary, width: 100, fontVariant: typography.tabularNums }]}>
                {row.confidence}%
              </Text>
              <View style={[styles.cellContainer, { width: 100 }]}>
                <Text style={[styles.badge, { backgroundColor: getSeverityColor(row.severity) + '20', color: getSeverityColor(row.severity), borderColor: getSeverityColor(row.severity) }]}>
                  {row.severity.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.cellContainer, { width: 120 }]}>
                <Text style={[styles.badge, { backgroundColor: getStatusColor(row.status) + '20', color: getStatusColor(row.status), borderColor: getStatusColor(row.status) }]}>
                  {row.status.toUpperCase()}
                </Text>
              </View>
              <ChevronDown size={16} color={theme.textSecondary} style={styles.expandIcon} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  exportText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  table: {
    minWidth: 800,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  cell: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
  },
  cellContainer: {
    justifyContent: 'center',
  },
  badge: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  expandIcon: {
    marginLeft: 'auto',
  }
});
