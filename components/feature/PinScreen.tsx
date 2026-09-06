// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const CORRECT_PIN = '6666';

interface PinScreenProps {
  onSuccess: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleDigit(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === CORRECT_PIN) {
          onSuccess();
        } else {
          setError(true);
          setShake(true);
          Vibration.vibrate([0, 80, 60, 80]);
          setTimeout(() => { setPin(''); setError(false); setShake(false); }, 900);
        }
      }, 120);
    }
  }

  function handleDelete() {
    if (pin.length === 0) return;
    setPin(pin.slice(0, -1));
    setError(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoRing}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="palette" size={40} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.brandName}>Sayed Ezzat</Text>
          <Text style={styles.brandAr}>S.E Gallery</Text>
          <Text style={styles.brandSub}>فنان تشكيلي · Visual Artist</Text>
        </View>

        {/* Prompt */}
        <Text style={[styles.prompt, error && styles.promptError]}>
          {error ? 'رمز خاطئ، حاول مجدداً' : 'أدخل الرمز السري'}
        </Text>

        {/* Dots */}
        <View style={[styles.dotsRow, shake && styles.shakeRow]}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {KEYS.map((key, idx) => {
            if (key === '') return <View key={idx} style={styles.keyPlaceholder} />;
            if (key === 'del') {
              return (
                <Pressable
                  key="del"
                  onPress={handleDelete}
                  style={({ pressed }) => [styles.key, styles.keyDel, pressed && styles.keyPressed]}
                >
                  <MaterialIcons name="backspace-outlined" size={22} color={Colors.textSecondary} />
                </Pressable>
              );
            }
            return (
              <Pressable
                key={key}
                onPress={() => handleDigit(key)}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Text style={styles.keyText}>{key}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  brandSection: { alignItems: 'center', marginBottom: Spacing.xxxl + 8 },
  logoRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 28,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 2,
  },
  brandAr: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  brandSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  prompt: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.medium,
  },
  promptError: { color: Colors.error },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  shakeRow: { transform: [{ translateX: 6 }] },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDel: { backgroundColor: Colors.surface },
  keyPlaceholder: { width: 80, height: 80 },
  keyPressed: { opacity: 0.6, transform: [{ scale: 0.94 }] },
  keyText: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
