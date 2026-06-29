import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebaseConfig';

// Auth screens
import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// App screens
import HomeScreen              from './src/screens/HomeScreen';
import ScannerScreen           from './src/screens/ScannerScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import ResultScreen            from './src/screens/ResultScreen';
import HistoryScreen           from './src/screens/HistoryScreen';

import { colors } from './src/theme';

const AuthStack = createStackNavigator();
const AppStack  = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.surface },
        animationEnabled: true,
      }}
    >
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.surface },
        animationEnabled: true,
      }}
    >
      <AppStack.Screen name="Home"              component={HomeScreen} />
      <AppStack.Screen name="Scanner"           component={ScannerScreen} />
      <AppStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <AppStack.Screen name="Result"            component={ResultScreen} />
      <AppStack.Screen name="History"           component={HistoryScreen} />
    </AppStack.Navigator>
  );
}

export default function App() {
  const [user, setUser]               = useState(null);
  const [authReady, setAuthReady]     = useState(false);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded || !authReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
