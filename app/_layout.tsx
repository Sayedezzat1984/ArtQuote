// Powered by OnSpace.AI
import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AdminLoginScreen } from '@/components/feature/AdminLoginScreen';
import { Colors } from '@/constants/theme';

// ─── Inner layout: consumes AuthContext ───────────────────────────────────
function AppShell() {
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
    // Guest / Visitor mode — artworks gallery only
    return (
      <LanguageProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(guest)" />
          </Stack>
        </AppProvider>
      </LanguageProvider>
    );
  }

  // appMode === 'admin' — full app
  return (
    <LanguageProvider>
      <AppProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
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
