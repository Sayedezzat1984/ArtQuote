// Powered by OnSpace.AI
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Radius } from '@/constants/theme';
import { isTablet } from '@/constants/responsive';
import { useLanguage } from '@/contexts/LanguageContext';

function LangToggle() {
  const { lang, toggleLang } = useLanguage();
  return (
    <Pressable
      onPress={toggleLang}
      style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.7 }]}
      hitSlop={8}
    >
      <Text style={styles.langBtnText}>{lang === 'ar' ? 'EN' : 'عر'}</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const tabBarHeight = isTablet ? 72 : 60;
  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + tabBarHeight, android: insets.bottom + tabBarHeight, default: tabBarHeight + 10 }),
    paddingTop: isTablet ? 10 : 8,
    paddingBottom: Platform.select({ ios: insets.bottom + (isTablet ? 12 : 8), android: insets.bottom + (isTablet ? 12 : 8), default: isTablet ? 12 : 8 }),
    paddingHorizontal: isTablet ? 24 : 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  };

  const headerOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: Colors.surface },
    headerTintColor: Colors.textPrimary,
    headerTitleStyle: { fontSize: isTablet ? FontSize.lg : FontSize.base, fontWeight: '700' as const, color: Colors.textPrimary },
    headerRight: () => <LangToggle />,
    headerRightContainerStyle: { paddingRight: 12 },
  };

  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarStyle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: isTablet ? 13 : 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: t('tabPortfolio'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="palette" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('tabCustomers'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: t('tabQuotes'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="description" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: t('tabMaterials'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="inventory-2" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: t('tabSuppliers'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manufacturing"
        options={{
          title: t('tabManufacturing'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="precision-manufacturing" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'الزوار',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="groups" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  langBtn: {
    minWidth: 40,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  langBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
