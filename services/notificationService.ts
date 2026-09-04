// Powered by OnSpace.AI — Push Notification Service
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ─── Configure how notifications appear when app is in foreground ─────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Request permissions + get Expo push token ────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  // Notifications only work on physical devices (not simulators)
  if (!Device.isDevice) return null;

  try {
    // Create Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('artworks', {
        name: 'الأعمال الفنية',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C9A84C',
        sound: 'default',
      });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    // Get Expo push token (requires projectId for EAS builds)
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch {
      // Fallback: device push token
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      return deviceToken.data as string;
    }
  } catch {
    return null;
  }
}

// ─── Schedule local notification for new artwork ──────────────────────────
export async function notifyNewArtwork(
  artworkTitle: string,
  count: number = 1,
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const title = count === 1
      ? 'عمل فني جديد في المعرض ✦'
      : `${count} أعمال فنية جديدة في المعرض ✦`;

    const body = count === 1
      ? `تم إضافة "${artworkTitle}" — افتح المعرض لمشاهدته`
      : `أعمال جديدة متاحة الآن — افتح المعرض لمشاهدتها`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { type: 'new_artwork', artworkTitle, count },
        ...(Platform.OS === 'android' ? { channelId: 'artworks' } : {}),
      },
      trigger: null, // Show immediately
    });
  } catch {
    // Silent failure — notifications are best-effort
  }
}

// ─── Cancel all pending notifications ─────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

// ─── Check if notifications are enabled ───────────────────────────────────
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
