import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

type TelemetryTableProps = {
  title?: string;
  data: {
    label: string;
    value: string | number;
  }[];
};

const AnimatedRow = ({ row, index, isLast, theme }: { row: { label: string; value: string | number }; index: number; isLast: boolean; theme: any }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const delay = 200 + (index * 60);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.row,
        { borderBottomColor: theme.border },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {row.label}
      </Text>
      <Text style={[styles.value, { color: theme.textPrimary }]}>
        {row.value}
      </Text>
    </Animated.View>
  );
};

export const TelemetryTable = ({ title, data }: TelemetryTableProps) => {
  const { theme } = useTheme();

  const containerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(containerFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border, opacity: containerFade }]}>
      {title && (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerText, { color: theme.textPrimary }]}>{title}</Text>
        </View>
      )}
      {data.map((row, index) => (
        <AnimatedRow
          key={row.label}
          row={row}
          index={index}
          isLast={index === data.length - 1}
          theme={theme}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 4,
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  value: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    fontVariant: typography.tabularNums,
  }
});
