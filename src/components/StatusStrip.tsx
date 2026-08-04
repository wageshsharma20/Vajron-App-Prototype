import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, BatteryMedium, MapPin, Sun, Moon } from 'lucide-react-native';
import { useTheme, typography } from '../theme';
import { mockParkInfo } from '../data/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const StatusStrip = () => {
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Math.max(insets.top, 10), borderBottomColor: theme.border + '60' }]}>
      <View style={[styles.left, { flexShrink: 1 }]}>

        <View style={styles.item}>
          <Wifi size={13} color={theme.statusGreen} />
        </View>
        <View style={styles.item}>
          <BatteryMedium size={13} color={theme.statusGreen} />
          <Text style={[styles.text, { color: theme.textSecondary }]}>{mockParkInfo.battery}%</Text>
        </View>
        <View style={[styles.item, { flexShrink: 1 }]}>
          <MapPin size={13} color={theme.textSecondary} />
          <Text 
            style={[styles.text, { color: theme.textSecondary, flexShrink: 1 }]}
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {mockParkInfo.parkName}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, { color: theme.textPrimary }]}>{formatTime(time)}</Text>
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
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  text: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  time: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    fontVariant: typography.tabularNums,
  },
  toggle: {
    padding: 4,
  }
});
