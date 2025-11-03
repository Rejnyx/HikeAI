import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import {
  useFonts,
  NationalPark_400Regular,
  NationalPark_600SemiBold,
  NationalPark_700Bold,
} from '@expo-google-fonts/national-park';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  // Load National Park font
  const [fontsLoaded] = useFonts({
    NationalPark_400Regular,
    NationalPark_600SemiBold,
    NationalPark_700Bold,
  });

  // Show loading screen while fonts load
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1F1E' }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <MainNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
      <Toast />
    </GestureHandlerRootView>
  );
}
