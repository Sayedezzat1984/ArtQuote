// Powered by OnSpace.AI
import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';
import { VisitorProvider } from '@/contexts/VisitorContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AdminLoginScreen } from '@/components/feature/AdminLoginScreen';
import { Colors } from '@/constants/theme';

// ─── Root notification listener setup ───────────────────────────────────
function useNotificationListener() {
  useEffect(() => {
    // Handle notification response (tapped from background/closed)
    const sub = Notifications.addNotificationResponseReceivedListener(_response => {
      // Navigate to gallery on tap — router handles it via deep link
    });
    return () => sub.remove();
  }, []);
}

// ─── Inner layout: consumes AuthContext ───────────────────────────────────
function AppShell() {
  useNotificationListener();
  const { appMode } = useAuth();

  if (appMode === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (appMode === 'unauthenticated') {
    return <AdminLoginScreen />;
  }

  if (appMode === 'client') {
    // Guest / Visitor mode — artworks gallery only with visitor registration
    return (
      <LanguageProvider>
        <AppProvider>
          <VisitorProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(guest)" />
            </Stack>
          </VisitorProvider>
        </AppProvider>
      </LanguageProvider>
    );
  }

  // appMode === 'admin' — full app
  return (
    <LanguageProvider>
      <AppProvider>
        <VisitorProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </VisitorProvider>
      </AppProvider>
    </LanguageProvider>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell />
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
