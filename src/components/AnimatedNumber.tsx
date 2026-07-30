import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: TextStyle | TextStyle[];
  formatOptions?: Intl.NumberFormatOptions;
  suffix?: string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1200,
  style,
  formatOptions,
  suffix = '',
  numberOfLines,
  adjustsFontSizeToFit,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');
  const previousValue = useRef(0);

  useEffect(() => {
    // Start from the previous value and animate to the new one
    animatedValue.setValue(previousValue.current);

    const listener = animatedValue.addListener(({ value: v }) => {
      if (formatOptions) {
        setDisplayValue(v.toLocaleString(undefined, formatOptions));
      } else {
        // For integers, round. For decimals, keep 1 decimal.
        if (Number.isInteger(value)) {
          setDisplayValue(Math.round(v).toLocaleString());
        } else {
          setDisplayValue(v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
        }
      }
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // We need JS-driven for text updates
    }).start();

    previousValue.current = value;

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value]);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
    >
      {displayValue}{suffix}
    </Text>
  );
};
