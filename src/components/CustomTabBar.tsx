import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [dimensions, setDimensions] = useState<{ x: number; width: number }[]>([]);
  
  const cursorLeft = useSharedValue(0);
  const cursorWidth = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);

  useEffect(() => {
    if (dimensions.length === state.routes.length) {
      const activeDim = dimensions[state.index];
      if (activeDim) {
        cursorLeft.value = withTiming(activeDim.x, { duration: 250 });
        cursorWidth.value = withTiming(activeDim.width, { duration: 250 });
        cursorOpacity.value = withTiming(1, { duration: 150 });
      }
    }
  }, [state.index, dimensions]);

  const cursorStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: cursorLeft.value,
      width: cursorWidth.value,
      opacity: cursorOpacity.value,
      top: 0,
      bottom: 0,
      // Cursor is inverted to the background
      backgroundColor: theme.textPrimary, 
      borderRadius: 16,
      zIndex: 0,
    };
  }, [theme.textPrimary]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: theme.background }]}>
      <View style={[
        styles.borderWrapper,
        { backgroundColor: theme.border }
      ]}>
        <View style={[
          styles.pillContainer, 
          { backgroundColor: theme.surface }
        ]}>
          <Animated.View style={cursorStyle} />
        
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLayout = (e: LayoutChangeEvent) => {
            const { x, width } = e.nativeEvent.layout;
            setDimensions(prev => {
              const newDim = [...prev];
              newDim[index] = { x, width };
              return newDim;
            });
          };

          // Simulate mix-blend-difference by inverting text color when active
          const textColor = isFocused 
            ? (isDark ? '#000000' : '#ffffff')
            : (isDark ? '#ffffff' : '#000000');

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLayout={onLayout}
              style={[styles.tab, { width: `${100 / state.routes.length}%` }]}
              activeOpacity={1}
            >
              <Text style={[
                styles.tabText, 
                { color: textColor }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 8,
  },
  borderWrapper: {
    width: '100%',
    padding: 2,
    borderRadius: 18,
  },
  pillContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 8,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  tabText: {
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    textAlign: 'center',
  }
});
