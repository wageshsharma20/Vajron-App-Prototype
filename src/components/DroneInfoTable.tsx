import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { MapPin, ChevronRight, Navigation } from 'lucide-react-native';
import mockParkInfo from '../data/mockParkInfo.json';
import { DataTable, Text, Surface, TouchableRipple } from 'react-native-paper';

type Row = {
  id: string;
  property: string;
  value: string;
  isLocation?: boolean;
};

export const DroneInfoTable = () => {
  const { theme } = useTheme();

  const rows: Row[] = [
    { id: '1', property: 'Altitude', value: mockParkInfo.altitude },
    { id: '2', property: 'Speed', value: mockParkInfo.speed },
    { id: '3', property: 'Heading', value: mockParkInfo.heading },
    { id: '4', property: 'Battery', value: `${mockParkInfo.battery}%` },
    { id: '5', property: 'Flight Time', value: mockParkInfo.flightTime },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Navigation size={18} color={theme.textPrimary} />
        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.textPrimary }]}>Active Drone Status</Text>
      </View>
      <Surface style={[styles.container, { backgroundColor: theme.surface }]} elevation={1}>
        <DataTable>
          <DataTable.Header style={{ borderBottomColor: theme.border }}>
            <DataTable.Title textStyle={styles.thText}>Property</DataTable.Title>
            <DataTable.Title numeric textStyle={styles.thText}>Value</DataTable.Title>
          </DataTable.Header>

          {rows.map((row, index) => (
            <DataTable.Row 
              key={row.id} 
              style={[
                { borderBottomColor: theme.border },
                index % 2 !== 0 && { backgroundColor: theme.surfaceLight }
              ]}
            >
              <DataTable.Cell textStyle={[styles.cellLabel, { color: theme.textPrimary }]}>
                {row.property}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {row.isLocation ? (
                  <TouchableRipple onPress={() => {}} style={[styles.locationBtn, { backgroundColor: theme.statusGreen + '1A' }]}>
                    <View style={styles.cellValueContainer}>
                      <MapPin size={12} color={theme.statusGreen} />
                      <Text style={[styles.locationText, { color: theme.statusGreen }]}>Track</Text>
                      <ChevronRight size={12} color={theme.statusGreen} />
                    </View>
                  </TouchableRipple>
                ) : row.property === 'Battery' ? (
                  <View style={{ borderRadius: 12, backgroundColor: theme.statusGreen + '20', paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={[styles.cellValue, { color: theme.statusGreen }]}>
                      {row.value}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.cellValue, { color: theme.textSecondary }]}>
                    {row.value}
                  </Text>
                )}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
  },
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  thText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
  },
  cellLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  cellValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cellValue: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
  },
  locationBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
    marginLeft: 2,
  },
});
