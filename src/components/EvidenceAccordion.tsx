import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';
import * as Icons from 'lucide-react-native';
import { ChevronDown, MapPin, Clock, Video, Camera, AlertTriangle, Download } from 'lucide-react-native';

interface EvidenceInstance {
  id: string;
  area: string;
  anomalyPercentage: number;
  anomalyType: string;
  timestamp: string;
  videoTimestamp: string;
  gpsCoordinates: string;
  zone: string;
  confidence: number;
  severity: string;
}

interface EvidenceCategoryData {
  category: string;
  iconName: string;
  type: string;
  totalArea: string;
  anomalyCount: number;
  instances: EvidenceInstance[];
}

interface Props {
  data: EvidenceCategoryData;
  index: number;
}

export const EvidenceAccordion: React.FC<Props> = ({ data, index }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  // Stagger entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const IconComponent = (Icons as any)[data.iconName] || Icons.CircleAlert;

  const isLethal = data.type === 'lethal';
  let accentColor = theme.accentTeal;
  if (['Human', 'Swings'].includes(data.category)) accentColor = theme.accentAmber;
  if (isLethal) accentColor = theme.accentRed;

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotateAnim, { toValue, duration: 250, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue, duration: 300, useNativeDriver: false }),
    ]).start();
    setExpanded(!expanded);
  };

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return theme.accentRed;
      case 'caution': return theme.accentAmber;
      default: return theme.statusGreen;
    }
  };

  return (
    <Animated.View style={[
      styles.container,
      { backgroundColor: theme.surface, borderColor: theme.border },
      isLethal && data.anomalyCount > 0 && { borderColor: theme.accentRed + '40' },
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      {/* Collapsed Header */}
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7} style={styles.header}>
        <View style={styles.headerLeft}>
          <IconComponent size={18} color={accentColor} />
          <View style={styles.headerInfo}>
            <Text style={[styles.categoryName, { color: theme.textPrimary }]}>{data.category}</Text>
            <Text style={[styles.totalArea, { color: theme.textSecondary }]}>{data.totalArea}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[
            styles.countBadge,
            { backgroundColor: data.anomalyCount > 0 ? accentColor + '15' : theme.surfaceLight },
          ]}>
            <Text style={[
              styles.countText,
              { color: data.anomalyCount > 0 ? accentColor : theme.textSecondary },
            ]}>
              {data.anomalyCount} {data.anomalyCount === 1 ? 'anomaly' : 'anomalies'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={(e) => { e.stopPropagation(); }}
            activeOpacity={0.6}
            style={[styles.categoryExportBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <Download size={12} color={theme.textPrimary} />
            <Text style={[styles.categoryExportText, { color: theme.textPrimary }]}>Export</Text>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <ChevronDown size={16} color={theme.textSecondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
          {data.instances.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No anomalies detected</Text>
          ) : (
            data.instances.map((instance, i) => (
              <View key={instance.id} style={[
                styles.instanceCard,
                { backgroundColor: theme.background, borderColor: theme.border },
                i < data.instances.length - 1 && { marginBottom: 8 },
              ]}>
                {/* Instance Header */}
                <View style={styles.instanceHeader}>
                  <View style={styles.instanceHeaderLeft}>
                    <AlertTriangle size={12} color={getSeverityColor(instance.severity)} />
                    <Text style={[styles.anomalyType, { color: theme.textPrimary }]}>
                      {instance.anomalyType}
                    </Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(instance.severity) + '15' }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(instance.severity) }]}>
                      {instance.severity}
                    </Text>
                  </View>
                </View>

                {/* Instance Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Area</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{instance.area}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Anomaly %</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{instance.anomalyPercentage}%</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Confidence</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{instance.confidence}%</Text>
                    </View>
                  </View>

                  <View style={[styles.metaRow, { borderTopColor: theme.border }]}>
                    <View style={styles.metaItem}>
                      <Clock size={11} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{instance.timestamp}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Video size={11} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{instance.videoTimestamp}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={11} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {instance.gpsCoordinates}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={11} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {instance.zone}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Evidence Placeholder */}
                <View style={[styles.evidenceRow, { borderTopColor: theme.border }]}>
                  <TouchableOpacity style={[styles.evidenceBtn, { backgroundColor: theme.surfaceLight }]}>
                    <Camera size={12} color={theme.textSecondary} />
                    <Text style={[styles.evidenceBtnText, { color: theme.textSecondary }]}>Screenshot</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.evidenceBtn, { backgroundColor: theme.surfaceLight }]}>
                    <Video size={12} color={theme.textSecondary} />
                    <Text style={[styles.evidenceBtnText, { color: theme.textSecondary }]}>Video Clip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerInfo: {
    gap: 1,
    flex: 1,
  },
  categoryName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
  },
  totalArea: {
    fontFamily: typography.fonts.regular,
    fontSize: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
  },
  categoryExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 4,
  },
  categoryExportText: {
    fontFamily: typography.fonts.medium,
    fontSize: 9,
  },
  expandedContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: 16,
  },
  instanceCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  instanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  instanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  anomalyType: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 9,
  },
  detailsGrid: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: 9,
    marginBottom: 1,
  },
  detailValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    fontVariant: ['tabular-nums'] as any,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: typography.fonts.regular,
    fontSize: 10,
  },
  evidenceRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  evidenceBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
  },
});
