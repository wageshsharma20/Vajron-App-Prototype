import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';
import {
  Trees,
  Leaf,
  Droplets,
  Sparkles,
  Wrench,
  ShieldCheck,
  Waves,
  Palette,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import { InspectionCategory } from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface InspectionAccordionProps {
  data: InspectionCategory;
  index: number;
}

const iconMap: Record<string, any> = {
  Trees,
  Leaf,
  Droplets,
  Sparkles,
  Wrench,
  ShieldCheck,
  Waves,
  Palette,
};

export const InspectionAccordion: React.FC<InspectionAccordionProps> = ({ data, index }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [index, fadeAnim]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const IconComponent = iconMap[data.iconName] || Wrench;

  let badgeColor = theme.statusGreen;
  let badgeText = 'All clear';
  
  if (data.issueCount > 0) {
    badgeColor = data.status === 'critical' ? theme.accentRed : theme.accentAmber;
    badgeText = `${data.issueCount} issue${data.issueCount > 1 ? 's' : ''}`;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Surface
        style={[
          styles.container,
          { 
            backgroundColor: theme.surfaceLight,
            borderColor: expanded ? badgeColor : theme.border,
          }
        ]}
      >
        <TouchableRipple
          onPress={toggleExpand}
          style={styles.header}
          rippleColor="rgba(0, 0, 0, .32)"
        >
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: badgeColor + '15' }]}>
                <IconComponent size={20} color={badgeColor} />
              </View>
              <Text style={[styles.categoryName, { color: theme.textPrimary, fontFamily: typography.fonts.semiBold }]}>
                {data.category}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {data.issueCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: badgeColor + '15', borderColor: badgeColor + '40', borderWidth: 1 }]}>
                  <Text style={[styles.badgeText, { color: badgeColor }]}>
                    {badgeText}
                  </Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: badgeColor + '10' }]}>
                  <Text style={[styles.badgeText, { color: badgeColor }]}>
                    {badgeText}
                  </Text>
                </View>
              )}
              {expanded ? (
                <ChevronUp size={20} color={theme.textSecondary} style={{ marginLeft: 8 }} />
              ) : (
                <ChevronDown size={20} color={theme.textSecondary} style={{ marginLeft: 8 }} />
              )}
            </View>
          </View>
        </TouchableRipple>

        {expanded && (
          <View style={styles.content}>
            {data.items.map((item, idx) => {
              const isLast = idx === data.items.length - 1;
              let StatusIcon = CheckCircle;
              let statusColor = theme.statusGreen;
              
              if (item.status === 'attention') {
                StatusIcon = AlertTriangle;
                statusColor = theme.accentAmber;
              } else if (item.status === 'issue') {
                StatusIcon = XCircle;
                statusColor = theme.accentRed;
              }

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <StatusIcon size={16} color={statusColor} />
                    <Text
                      style={[
                        styles.itemName,
                        { color: theme.textPrimary, fontFamily: typography.fonts.medium },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.itemValue,
                      { color: theme.textSecondary, fontFamily: typography.fonts.regular },
                    ]}
                    numberOfLines={2}
                  >
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    overflow: 'hidden',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: typography.sizes.base,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.sm,
  },
  itemValue: {
    fontSize: typography.sizes.sm,
    flex: 1,
    textAlign: 'right',
  },
});
