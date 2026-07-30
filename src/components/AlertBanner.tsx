import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { TriangleAlert, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

interface AlertBannerProps {
  message: string;
  onPress: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, onPress }) => {
  const { theme } = useTheme();

  // Slide-in from top + fade animation
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
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.container, { backgroundColor: theme.accentRed }]}>
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <TriangleAlert size={14} color={theme.accentRed} />
          </View>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 17,
  }
});
