import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { StatusStrip } from './src/components/StatusStrip';

import { LiveDataFeedScreen } from './src/screens/LiveDataFeedScreen';
import { LiveVideoFeedScreen } from './src/screens/LiveVideoFeedScreen';
import { ConclusiveDataScreen } from './src/screens/ConclusiveDataScreen';
import { typography } from './src/theme/typography';

const Tab = createMaterialTopTabNavigator();

const AppNavigator = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusStrip />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: theme.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            marginTop: 4,
            marginBottom: 4,
            marginHorizontal: 12,
          },
          tabBarIndicatorStyle: {
            backgroundColor: theme.accentTeal,
            height: 2.5,
            borderRadius: 2,
          },
          tabBarLabelStyle: {
            fontFamily: typography.fonts.semiBold,
            fontSize: typography.sizes.sm,
            textTransform: 'none',
          },
          tabBarActiveTintColor: theme.textPrimary,
          tabBarInactiveTintColor: theme.textSecondary,
        }}
      >
        <Tab.Screen name="Live Data Feed" component={LiveDataFeedScreen} />
        <Tab.Screen name="Live Video Feed" component={LiveVideoFeedScreen} />
        <Tab.Screen name="Conclusive Data" component={ConclusiveDataScreen} />
      </Tab.Navigator>
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const webShadow = Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(0,0,0,0.6)' } : {};

  if (!fontsLoaded) {
    return null; // Return empty or a loading screen while fonts load
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={Platform.OS === 'web' ? styles.webWrapper : styles.container}>
          <View style={[
            Platform.OS === 'web' ? styles.mobileFrame : styles.container, 
            webShadow as any
          ]}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </View>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    width: 393, // iPhone 15 width
    height: 852, // iPhone 15 height
    maxHeight: '100%',
    backgroundColor: '#121212',
    overflow: 'hidden',
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#333',
  }
});
