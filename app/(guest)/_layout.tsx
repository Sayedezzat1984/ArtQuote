// Powered by OnSpace.AI
import { Stack } from 'expo-router';

export default function GuestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
    </Stack>
  );
}
