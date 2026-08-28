import { useFonts, NotoSans_400Regular, NotoSans_500Medium, NotoSans_600SemiBold, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { I18nProvider } from './src/i18n';
import { ReplayProvider } from './src/replay/ReplayProvider';
import { ReplayNotifications } from './src/replay/ReplayNotifications';
import { StatusStrip } from './src/components/StatusStrip';
import { LiveDataFeedScreen } from './src/screens/LiveDataFeedScreen';
import { RecordingsScreen } from './src/screens/RecordingsScreen';
import { ConclusiveDataScreen } from './src/screens/ConclusiveDataScreen';
import { DDAVerificationScreen } from './src/screens/DDAVerificationScreen';
import { CustomTabBar } from './src/components/CustomTabBar';
import { ZenLoader } from './src/components/ZenLoader';
import { LoginScreen } from './src/screens/LoginScreen';
import { PaperProvider, MD3LightTheme, adaptNavigationTheme, configureFonts } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import Animated, { FadeOut, FadeIn } from 'react-native-reanimated';

const Tab = createBottomTabNavigator();



  const { LightTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
}) as any;

const AppNavigator = () => {
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  // Gate between the loader and the app: the operator signs in before any
  // survey data is on screen.
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Simulate complex initialization to show off the micro-interaction loader
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const paperTheme = {
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
    },
    fonts: configureFonts({ config: { fontFamily: 'NotoSans_400Regular' } })
  } as any;

  if (!isReady) {
    return <ZenLoader />;
  }

  if (!signedIn) {
    return <LoginScreen onSignIn={() => setSignedIn(true)} />;
  }

  return (
    <Animated.View entering={FadeIn.duration(800)} style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme as any}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusStrip />
          <ReplayNotifications />
          <NavigationContainer theme={LightTheme as any}>
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
                name="Recordings"
                component={RecordingsScreen}
              />
              <Tab.Screen 
                name="Reports" 
                component={ConclusiveDataScreen} 
              />
              <Tab.Screen 
                name="Audit" 
                component={DDAVerificationScreen} 
              />
            </Tab.Navigator>
          </NavigationContainer>
        </View>
      </PaperProvider>
    </Animated.View>
  );
};

export default function App() {
  let [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }
  
  const webShadow = Platform.OS === 'web' ? { boxShadow: "none" } : {};

  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
        <ThemeProvider>
          <ReplayProvider>
            <View style={Platform.OS === 'web' ? styles.webWrapper : styles.container}>
              <View style={[
                Platform.OS === 'web' ? styles.mobileFrame : styles.container,
                webShadow as any
              ]}>
                <AppNavigator />
              </View>
            </View>
          </ReplayProvider>
        </ThemeProvider>
        </I18nProvider>
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
