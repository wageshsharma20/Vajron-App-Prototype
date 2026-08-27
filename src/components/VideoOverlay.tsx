import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography } from '../theme';

interface BoundingBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  type: 'live' | 'ghost';
  category: 'issue' | 'neutral';
}

export const VideoOverlay: React.FC<{ boxes: BoundingBoxProps[] }> = ({ boxes }) => {
  const { theme } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Draw the boxes */}
      {boxes.map((box, index) => {
        let color = theme.accentTeal;
        if (box.category === 'issue') color = theme.accentRed;

        const isGhost = box.type === 'ghost';
        
        return (
          <View
            key={`box-${index}`}
            style={[
              styles.boundingBox,
              {
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                borderColor: color,
                borderStyle: isGhost ? 'dashed' : 'solid',
                backgroundColor: isGhost ? 'transparent' : color + '12',
                opacity: isGhost ? 0.6 : 1,
              }
            ]}
          />
        );
      })}

      {/* Draw the labels (outside boxes so they don't get constrained and wrap) */}
      {boxes.map((box, index) => {
        let color = theme.accentTeal;
        if (box.category === 'issue') color = theme.accentRed;

        const isGhost = box.type === 'ghost';
        
        return (
          <View
            key={`label-${index}`}
            style={[
              styles.labelContainer,
              {
                left: `${box.x}%`,
                top: `${box.y}%`,
                transform: [{ translateY: -24 }, { translateX: -2 }],
                backgroundColor: 'rgba(0,0,0,0.65)'
              }
            ]}
          >
            <View style={[styles.labelDot, { backgroundColor: color }]} />
            <Text style={styles.labelText} numberOfLines={1}>
              {isGhost ? 'PREDICTED' : `${box.label.toUpperCase()} ${box.confidence}%`}
            </Text>
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
    borderRadius: 4,
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    gap: 5,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xs,
    fontVariant: typography.tabularNums,
  }
});
