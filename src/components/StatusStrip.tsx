import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, BatteryMedium, MapPin, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import mockTelemetry from '../data/mockTelemetry.json';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const StatusStrip = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 10), borderBottomColor: theme.border }]}>
      <View style={[styles.left, { flexShrink: 1 }]}>
        <View style={styles.item}>
          <Wifi size={14} color={theme.statusGreen} />
        </View>
        <View style={styles.item}>
          <BatteryMedium size={14} color={theme.statusGreen} />
          <Text style={[styles.text, { color: theme.textSecondary }]}>{mockTelemetry.battery}%</Text>
        </View>
        <View style={[styles.item, { flexShrink: 1 }]}>
          <MapPin size={14} color={theme.textSecondary} />
          <Text 
            style={[styles.text, { color: theme.textSecondary, flexShrink: 1 }]}
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {mockTelemetry.siteName}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, { color: theme.textPrimary }]}>{formatTime(time)}</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.toggle}>
          {isDark ? (
            <Sun size={16} color={theme.textSecondary} />
          ) : (
            <Moon size={16} color={theme.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  time: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    fontVariant: typography.tabularNums,
  },
  toggle: {
    padding: 4,
  }
});
