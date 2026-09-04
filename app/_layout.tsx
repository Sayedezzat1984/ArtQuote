// Powered by OnSpace.AI
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';
import { VisitorProvider } from '@/contexts/VisitorContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';

// ─── Root notification listener setup ───────────────────────────────────
function useNotificationListener() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(_response => {
      // Navigate to gallery on tap — router handles it via deep link
    });
    return () => sub.remove();
  }, []);
}

// ─── Inner navigator: only switches the Stack, providers never remount ────
function AppNavigator() {
  useNotificationListener();
  const { appMode } = useAuth();

  if (appMode === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (appMode === 'admin') {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  // Public gallery — default for client / unauthenticated
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(guest)" />
    </Stack>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────
// IMPORTANT: AppProvider, LanguageProvider, and VisitorProvider are placed
// OUTSIDE AppNavigator so they initialize ONCE at app start and are NEVER
// remounted when appMode changes (admin ↔ client). This guarantees Firestore
// listeners and artwork state are always available before any screen renders.
export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppProvider>
              <VisitorProvider>
                <AppNavigator />
              </VisitorProvider>
            </AppProvider>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
