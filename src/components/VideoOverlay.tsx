import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

interface BoundingBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  type: 'live' | 'ghost';
  category: 'weapon' | 'human' | 'neutral';
}

export const VideoOverlay: React.FC<{ boxes: BoundingBoxProps[] }> = ({ boxes }) => {
  const { theme } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {boxes.map((box, index) => {
        let color = theme.accentTeal;
        if (box.category === 'human') color = theme.accentAmber;
        if (box.category === 'weapon') color = theme.accentRed;

        const isGhost = box.type === 'ghost';
        
        return (
          <View
            key={index}
            style={[
              styles.boundingBox,
              {
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                borderColor: color,
                borderStyle: isGhost ? 'dashed' : 'solid',
                backgroundColor: isGhost ? 'transparent' : color + '15',
                opacity: isGhost ? 0.7 : 1,
              }
            ]}
          >
            <View style={[styles.labelContainer, { backgroundColor: color }]}>
              <Text style={styles.labelText}>
                {isGhost ? 'GHOST TRACK — predicted' : `${box.label.toUpperCase()} ${box.confidence}%`}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
  },
  labelContainer: {
    position: 'absolute',
    top: -22,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
  },
  labelText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
    fontVariant: typography.tabularNums,
  }
});
