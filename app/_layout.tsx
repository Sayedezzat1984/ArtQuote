// Powered by OnSpace.AI
import { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PinScreen } from '@/components/feature/PinScreen';
import { useApp } from '@/hooks/useApp';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

// ── Loading gate: shows overlay while AppProvider initializes ────────────────
function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { loading } = useApp();

  return (
    <View style={{ flex: 1 }}>
      {children}
      {loading ? (
        <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, ls.container]}>
          <Text style={ls.brand}>Sayed Ezzat</Text>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          <Text style={ls.sub}>جاري تحميل البيانات...</Text>
        </View>
      ) : null}
    </View>
  );
}

const ls = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});

export default function RootLayout() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return (
      <AlertProvider>
        <SafeAreaProvider>
          <PinScreen onSuccess={() => setAuthenticated(true)} />
        </SafeAreaProvider>
      </AlertProvider>
    );
  }

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <LanguageProvider>
          <AppProvider>
            <AppLoadingGate>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AppLoadingGate>
          </AppProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
