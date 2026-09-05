// Powered by OnSpace.AI
import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';
import { VisitorProvider } from '@/contexts/VisitorContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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

  // Both unauthenticated and client modes show the guest stack
  // (visitor login is the dominant start screen; admin accessed via tiny lock icon)
  if (appMode === 'unauthenticated' || appMode === 'client') {
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
