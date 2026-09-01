// Powered by OnSpace.AI
import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AppProvider } from '@/contexts/AppContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { PinScreen } from '@/components/feature/PinScreen';

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
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AppProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
