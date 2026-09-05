// Powered by OnSpace.AI — Guest Welcome Screen
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useVisitor } from '@/contexts/VisitorContext';
import { isTablet } from '@/constants/responsive';

const { width: SW, height: SH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentVisitor } = useVisitor();

  // Animations
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(24)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(30)).current;
  const shimmer     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1,   useNativeDriver: true, damping: 12, stiffness: 100 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity,  { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(btnY,        { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Shimmer loop on button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0,    useNativeDriver: true }),
        Animated.delay(2200),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmer.interpolate({
    inputRange:  [0, 1],
    outputRange: [-SW * 0.6, SW * 0.6],
  });

  return (
    <View style={styles.root}>
      {/* Full-screen golden gradient background */}
      <LinearGradient
        colors={['#0d0d0f', '#1a1408', '#2b1f00', '#1a1408', '#0d0d0f']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Radial glow behind logo */}
      <View style={styles.glow} />

      {/* Decorative top dots */}
      <View style={[styles.decorRow, { top: insets.top + 20 }]}>
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.decorDot,
              { opacity: 0.15 + i * 0.1, width: 4 + i * 2, height: 4 + i * 2, borderRadius: 3 + i },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.inner}>

          {/* Top exit button */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={styles.exitBtn}
              hitSlop={12}
            >
              <MaterialIcons name="arrow-back-ios" size={14} color={Colors.primary + 'AA'} />
              <Text style={styles.exitText}>رجوع</Text>
            </Pressable>
          </View>

          {/* Logo */}
          <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoRing2} />
            <View style={styles.logoRing1} />
            <View style={styles.logoCircle}>
              <Image
                source={require('@/assets/images/gallery_logo.png')}
                style={styles.logoImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          </Animated.View>

          {/* Text block */}
          <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
            {/* Gold divider */}
            <View style={styles.divider} />
            <Text style={styles.artistName}>سيد عزت</Text>
            <Text style={styles.galleryTitle}>معرض الأعمال الفنية</Text>
            <View style={styles.divider} />
            {/* Tagline */}
            <Text style={styles.tagline}>
              {currentVisitor?.name
                ? `أهلاً وسهلاً، ${currentVisitor.name}`
                : 'اكتشف تحف فنية استثنائية'}
            </Text>
            <View style={styles.starRow}>
              {['star', 'star', 'star', 'star', 'star'].map((_, i) => (
                <MaterialIcons key={i} name="star" size={12} color={Colors.primary} style={{ opacity: 0.7 }} />
              ))}
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View style={[styles.btnWrap, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}>
            <Pressable
              onPress={() => router.replace('/(guest)/')}
              style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            >
              {/* Shimmer overlay */}
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              />
              <LinearGradient
                colors={[Colors.primary + 'FF', '#FFD96A', Colors.primary + 'FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <MaterialIcons name="photo-library" size={22} color="#0d0d0f" />
                <Text style={styles.ctaText}>استعرض الأعمال</Text>
                <MaterialIcons name="arrow-back-ios" size={16} color="#0d0d0f" style={{ transform: [{ rotate: '180deg' }] }} />
              </LinearGradient>
            </Pressable>

            {/* Sub hint */}
            <Text style={styles.ctaHint}>اضغط لدخول المعرض الآن</Text>
          </Animated.View>

          {/* Bottom decorative strip */}
          <View style={styles.bottomStrip}>
            <View style={styles.stripLine} />
            <View style={styles.stripDiamond}>
              <MaterialIcons name="diamond" size={10} color={Colors.primary + '60'} />
            </View>
            <View style={styles.stripLine} />
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const LOGO_SIZE = isTablet ? 180 : 150;
const RING1_SIZE = LOGO_SIZE + 32;
const RING2_SIZE = LOGO_SIZE + 68;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d0f',
  },
  glow: {
    position: 'absolute',
    top: SH * 0.18,
    alignSelf: 'center',
    width: SW * 0.85,
    height: SW * 0.85,
    borderRadius: SW * 0.425,
    backgroundColor: Colors.primary,
    opacity: 0.07,
    // soft blur via nested shadow trick
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 80,
  },
  decorRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  decorDot: {
    backgroundColor: Colors.primary,
  },
  safe: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // Top bar
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  exitText: {
    fontSize: FontSize.xs,
    color: Colors.primary + 'AA',
    fontWeight: FontWeight.medium,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isTablet ? Spacing.xxl : Spacing.xl,
  },
  logoRing2: {
    position: 'absolute',
    width: RING2_SIZE,
    height: RING2_SIZE,
    borderRadius: RING2_SIZE / 2,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  logoRing1: {
    position: 'absolute',
    width: RING1_SIZE,
    height: RING1_SIZE,
    borderRadius: RING1_SIZE / 2,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#1a1408',
    borderWidth: 2,
    borderColor: Colors.primary + '70',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  // Text block
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  divider: {
    width: 60,
    height: 1.5,
    backgroundColor: Colors.primary,
    opacity: 0.5,
    marginVertical: isTablet ? 16 : 12,
    borderRadius: 1,
  },
  artistName: {
    fontSize: isTablet ? 48 : 38,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: Colors.primary + '60',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  galleryTitle: {
    fontSize: isTablet ? FontSize.xl : FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: '#C8A84B',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.85,
  },
  tagline: {
    fontSize: isTablet ? FontSize.base : FontSize.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
  },

  // CTA
  btnWrap: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: isTablet ? Spacing.xxl : Spacing.lg,
  },
  ctaBtn: {
    width: '90%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: isTablet ? 20 : 17,
    paddingHorizontal: 28,
  },
  ctaText: {
    fontSize: isTablet ? FontSize.xl : FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: '#0d0d0f',
    letterSpacing: 0.5,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 1,
  },
  ctaHint: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },

  // Bottom strip
  bottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '60%',
    paddingBottom: 8,
  },
  stripLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  stripDiamond: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
