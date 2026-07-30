import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { TelemetryTable } from '../components/TelemetryTable';
import { PercentageCard } from '../components/PercentageCard';
import { AlertBanner } from '../components/AlertBanner';
import mockTelemetry from '../data/mockTelemetry.json';
import mockDetections from '../data/mockDetections.json';

export const LiveDataFeedScreen = ({ navigation }: any) => {
  const { theme } = useTheme();

  // Find if there is an active threat
  const activeThreat = mockDetections.find((d: any) => ['Knife', 'Handgun'].includes(d.category) && d.value > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {activeThreat && (
        <AlertBanner 
          message={`THREAT DETECTED — ${activeThreat.category} near Human — Zone A`}
          onPress={() => navigation.navigate('Live Video Feed')}
        />
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Telemetry Hero */}
        <TelemetryTable 
          title="Drone Telemetry"
          data={[
            { label: "Altitude", value: mockTelemetry.altitude },
            { label: "Ground Speed", value: mockTelemetry.groundSpeed },
            { label: "Heading", value: mockTelemetry.heading },
            { label: "Battery", value: `${mockTelemetry.battery}%` },
            { label: "Flight Time", value: mockTelemetry.flightTime },
            { label: "GPS", value: mockTelemetry.gps },
            { label: "Signal", value: `${mockTelemetry.signalStrength}%` }
          ]} 
        />

        {/* Detections Grid */}
        <View style={styles.detectionsGrid}>
          {mockDetections.map((item, index) => (
            <PercentageCard 
              key={item.id} 
              category={item.category} 
              value={item.value}
              unit={item.unit}
              iconName={item.iconName}
              index={index}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  detectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  }
});
