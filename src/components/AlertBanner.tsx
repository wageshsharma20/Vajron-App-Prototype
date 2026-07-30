import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';
import { TriangleAlert, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

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
      <Surface style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border + '40' }]} elevation={2 as any}>
        <TouchableRipple onPress={onPress} style={{ flex: 1, flexDirection: 'row' }} rippleColor="rgba(255, 59, 48, .12)">
          <>
            <View style={styles.redStripe} />
            <View style={styles.content}>
              <View style={styles.left}>
                <View style={[styles.iconWrap, { backgroundColor: theme.accentRed + '15' }]}>
                  <TriangleAlert size={14} color={theme.accentRed} />
                </View>
                <Text style={[styles.message, { color: theme.textPrimary }]} numberOfLines={2}>{message}</Text>
              </View>
              <View style={[styles.viewBtn, { backgroundColor: theme.accentRed + '12' }]}>
                <Text style={[styles.viewBtnText, { color: theme.accentRed }]}>View</Text>
                <ChevronRight size={14} color={theme.accentRed} />
              </View>
            </View>
          </>
        </TouchableRipple>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  redStripe: {
    width: 4,
    backgroundColor: '#FF3B30',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: 18,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 2,
  },
  viewBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
  },
});
