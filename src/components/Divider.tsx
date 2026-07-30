import React from 'react';
import { View, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/ThemeContext';
import { Divider as PaperDivider, Text as PaperText } from 'react-native-paper';

interface DividerProps {
  children?: React.ReactNode;
}

export const Divider = ({ children }: DividerProps) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.lineWrapper}>
        <PaperDivider style={{ backgroundColor: theme.border }} />
      </View>
      {children && (
        <PaperText variant="labelMedium" style={[styles.text, { color: theme.textSecondary }]}>
          {children}
        </PaperText>
      )}
      <View style={styles.lineWrapper}>
        <PaperDivider style={{ backgroundColor: theme.border }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  lineWrapper: {
    flex: 1,
    opacity: 0.5, // Subtle divider line
  },
  text: {
    marginHorizontal: 16,
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  }
});
