import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, typography } from '../theme';
import { useI18n } from '../i18n';
import { mockParkInfo } from '../data/mockData';
import { Text } from 'react-native-paper';

type Row = {
  id: string;
  property: string;
  value: string;
};

export const DroneInfoTable = () => {
  const { theme } = useTheme();
  const { translateAny, translateNumber } = useI18n();

  const rows: Row[] = [
    { id: '1', property: 'Height', value: mockParkInfo.altitude },
    { id: '2', property: 'Speed', value: mockParkInfo.speed },
    { id: '3', property: 'Direction', value: mockParkInfo.heading },
    { id: '4', property: 'Battery', value: `${mockParkInfo.battery}%` },
    { id: '5', property: 'Flight Time', value: mockParkInfo.flightTime },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>DRONE INFO</Text>
      
      <View style={[styles.container, { borderTopColor: theme.border }]}>
        {rows.map((row) => (
          <View 
            key={row.id} 
            style={[
              styles.row,
              { borderBottomColor: theme.border }
            ]}
          >
            <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>
              {row.property}
            </Text>
            <Text style={[styles.cellValue, { color: theme.textPrimary }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
    marginBottom: 32,
  },
  headerTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  cellValue: {
    fontFamily: typography.fonts.regular,
    fontSize: 15,
  },
});
