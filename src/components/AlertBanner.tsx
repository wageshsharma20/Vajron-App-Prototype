import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { TriangleAlert, ChevronRight } from 'lucide-react-native';
import { useTheme, typography } from '../theme';

interface AlertBannerProps {
  message: string;
  onPress?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, onPress }) => {
  const { theme } = useTheme();

  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable onPress={onPress} style={[styles.container, { borderBottomColor: theme.border }]}>
        <View style={styles.left}>
          <TriangleAlert size={14} color={theme.accentTeal} />
          <Text style={[styles.message, { color: theme.textPrimary }]} numberOfLines={2}>{message}</Text>
        </View>
        <ChevronRight size={14} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 24,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  message: {
    fontFamily: typography.fonts.medium,
    fontSize: 15,
    letterSpacing: 0.5,
    flex: 1,
  },
});
