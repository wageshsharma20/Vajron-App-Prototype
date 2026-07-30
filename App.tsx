import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { StatusStrip } from './src/components/StatusStrip';
import { LiveDataFeedScreen } from './src/screens/LiveDataFeedScreen';
import { LiveVideoFeedScreen } from './src/screens/LiveVideoFeedScreen';
import { ConclusiveDataScreen } from './src/screens/ConclusiveDataScreen';
import { typography } from './src/theme/typography';
import { CustomTabBar } from './src/components/CustomTabBar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
}) as any;

const AppNavigator = () => {
  const { theme, isDark } = useTheme();

  const paperTheme = isDark ? {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: theme.accentTeal,
      background: theme.background,
      surface: theme.surface,
      error: theme.accentRed,
      elevation: {
        ...MD3DarkTheme.colors.elevation,
        level1: theme.surfaceLight,
      }
    }
  } : {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: theme.accentTeal,
      background: theme.background,
      surface: theme.surface,
      error: theme.accentRed,
      elevation: {
        ...MD3LightTheme.colors.elevation,
        level1: theme.surfaceLight,
      }
    }
  } as any;

  return (
    <PaperProvider theme={paperTheme as any}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusStrip />
        <NavigationContainer theme={(isDark ? DarkTheme : LightTheme) as any}>
          <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              tabBarIconStyle: { display: 'none' }
            }}
          >
            <Tab.Screen 
              name="Dashboard" 
              component={LiveDataFeedScreen} 
            />
            <Tab.Screen 
              name="Camera" 
              component={LiveVideoFeedScreen} 
            />
            <Tab.Screen 
              name="Reports" 
              component={ConclusiveDataScreen} 
            />
          </Tab.Navigator>
        </NavigationContainer>
      </View>
    </PaperProvider>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  const webShadow = Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(0,0,0,0.6)' } : {};

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <View style={Platform.OS === 'web' ? styles.webWrapper : styles.container}>
            <View style={[
              Platform.OS === 'web' ? styles.mobileFrame : styles.container, 
              webShadow as any
            ]}>
              <AppNavigator />
            </View>
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
    width: 393,
    height: 852,
    maxHeight: '100%',
    backgroundColor: '#0D0D0D',
    overflow: 'hidden',
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#333',
  }
});
