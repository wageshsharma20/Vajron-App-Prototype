import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { useTheme, typography } from '../theme';

export const ZenLoader = ({ text = "INITIALIZING..." }: { text?: string }) => {
  const { theme } = useTheme();
  
  // Minimalist expanding line loader
  const scaleX = useSharedValue(0.01);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scaleX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.01, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleX: scaleX.value }],
      opacity: opacity.value,
    };
  });

  
  
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image 
        source={require('../../assets/images/dda-logo.png')} 
        style={styles.ddaLogo} 
        resizeMode="contain" 
      />
      <Animated.View style={[styles.line, { backgroundColor: theme.textPrimary }, lineStyle]} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>{text}</Text>
      <Image 
        source={require('../../assets/images/dda-greens-logo.png')} 
        style={styles.greensLogo} 
        resizeMode="contain" 
      />
    </View>
  );



};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill as any,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  line: {
    width: 200,
    height: StyleSheet.hairlineWidth,
    marginBottom: 32,
  },
  text: {
    fontFamily: typography.fonts.light,
    fontSize: 10,
    letterSpacing: 4,
  },
  
  
  ddaLogo: {
    width: 403,
    height: 115,
    marginBottom: 60,
  },
  greensLogo: {
    width: 72,
    height: 72,
    marginTop: 60,
  }
});
