import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // Pulse animation for shield icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (err) {
              console.error('Logout failed:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Top action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate('History')}
          style={styles.actionBtn}
        >
          <Ionicons name="time-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.actionBtn}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Hero area */}
      <View style={styles.hero}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shieldCircle}
          >
            <Ionicons name="shield-checkmark" size={56} color={colors.onSurface} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.headline}>UPI Shield</Text>
        <Text style={styles.subtitle}>
          Scan any UPI QR code to instantly detect{'\n'}potential fraud before you pay.
        </Text>
      </View>

      {/* Info cards */}
      <View style={styles.cardsRow}>
        <View style={styles.infoCard}>
          <Ionicons name="flash" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Real-Time</Text>
          <Text style={styles.cardBody}>ML-powered analysis in under a second</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed" size={22} color={colors.tertiary} />
          <Text style={styles.cardTitle}>Private</Text>
          <Text style={styles.cardBody}>No payment executed</Text>
        </View>
      </View>

      {/* CTA buttons */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Scanner')}
        style={styles.ctaWrapper}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          <Ionicons name="scan" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.ctaText}>Scan QR Code</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('History')}
        style={styles.historyBtnWrapper}
      >
        <View style={styles.historyBtn}>
          <Ionicons name="time-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.historyBtnText}>View Scan History</Text>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Powered by ML • Not a payment app
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  // ─── Action bar ───────────────────────────────────
  actionBar: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Hero ─────────────────────────────────────────
  hero: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  shieldGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    top: 5,
  },
  shieldCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.ambient,
  },
  headline: {
    ...typography.headlineLG,
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },

  // ─── Info cards ───────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.soft,
  },
  cardTitle: {
    ...typography.titleMD,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  cardBody: {
    ...typography.bodySM,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // ─── CTA ──────────────────────────────────────────
  ctaWrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.DEFAULT,
    ...shadows.ambient,
  },
  ctaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: '#fff',
  },

  // ─── History button ───────────────────────────────
  historyBtnWrapper: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    borderColor: 'rgba(67, 70, 84, 0.15)',
  },
  historyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.primary,
  },

  // ─── Footer ───────────────────────────────────────
  footer: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
    position: 'absolute',
    bottom: 32,
  },
});
