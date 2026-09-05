// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { useVisitor } from '@/contexts/VisitorContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isRegistered, isLoadingVisitor } = useVisitor();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoadingVisitor) return;
    const inRegister = segments.includes('register' as any);
    const inWelcome  = segments.includes('welcome' as any);
    const inGallery  = segments.includes('index' as any) || (!inRegister && !inWelcome);
    if (!isRegistered && !inRegister) {
      router.replace('/(guest)/register');
    } else if (isRegistered && inRegister) {
      // After registration → welcome screen
      router.replace('/(guest)/welcome');
    }
    // welcome and gallery: no forced redirect — user navigates freely
  }, [isRegistered, isLoadingVisitor, segments]);

  if (isLoadingVisitor) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function GuestLayout() {
  return (
    <GuestGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="register" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="index"   options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="[id]"    options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </GuestGuard>
  );
}
