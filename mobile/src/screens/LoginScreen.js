import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');

    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged in App.js will handle navigation automatically
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="shield-checkmark" size={36} color={colors.onSurface} />
          </LinearGradient>
          <Text style={styles.appName}>UPI Shield</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Error message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={styles.inputLabel}>EMAIL</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              placeholder="you@example.com"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="••••••••"
              placeholderTextColor={colors.onSurfaceVariant}
              secureTextEntry={!showPw}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Login</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Text style={styles.switchLink}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },

  // ─── Header ────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.ambient,
  },
  appName: {
    ...typography.headlineLG,
    fontSize: 30,
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },

  // ─── Form card ─────────────────────────────────────
  formCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.soft,
  },

  // ─── Error ─────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: borderRadius.DEFAULT,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySM,
    color: colors.onErrorContainer,
    flex: 1,
  },

  // ─── Inputs ────────────────────────────────────────
  inputLabel: {
    ...typography.labelSM,
    color: colors.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : 0,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    paddingVertical: spacing.md,
  },

  // ─── CTA ──────────────────────────────────────────
  ctaWrapper: {
    marginTop: spacing.xl,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: borderRadius.DEFAULT,
    ...shadows.ambient,
  },
  ctaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#fff',
  },

  // ─── Switch ────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  switchText: {
    ...typography.bodyMD,
    color: colors.onSurfaceVariant,
  },
  switchLink: {
    ...typography.bodyMD,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
