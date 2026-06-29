import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { predictFraud } from '../api';

/**
 * Build the full 17-feature payload for the ML backend.
 */
function buildPayload(amount) {
  const now = new Date();
  return {
    amount:                    amount,
    Amount_vs_User_Avg_Ratio:  1.0,
    Transaction_Frequency_24h: 1,
    Days_Since_Last_Txn:       1,
    Failed_PIN_Attempts:       0,
    Hour:                      now.getHours(),
    Is_New_Beneficiary:        1,
    Is_New_Device:             0,
    Is_First_Time_User:        0,
    Is_QR_Transaction:         1,
    Location_Mismatch:         0,
    Is_Weekend:                (now.getDay() === 0 || now.getDay() === 6) ? 1 : 0,
    UPI_App:                   'PhonePe',
    Transaction_Type:          'Merchant_Payment',
    Transaction_Status:        'Success',
    Transaction_State:         'Maharashtra',
    Device_OS:                 'Android',
  };
}

function DetailRow({ label, value, icon }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={18} color={colors.primary} style={{ marginRight: 10 }} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

export default function TransactionDetailScreen({ route, navigation }) {
  const {
    merchant = 'Unknown',
    upiId    = '',
    amount   = 0,
    currency = 'INR',
    rawUri   = '',
  } = route.params || {};

  const needsAmount = !amount || amount <= 0;
  const [editedAmount, setEditedAmount] = useState(
    needsAmount ? '' : String(amount)
  );
  const [loading, setLoading] = useState(false);

  const finalAmount = parseFloat(editedAmount) || 0;
  const isValid     = finalAmount > 0;

  const handleAnalyze = async () => {
    if (!isValid) {
      Alert.alert('Amount Required', 'Please enter a valid transaction amount.');
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload(finalAmount);
      const result  = await predictFraud(payload);

      navigation.replace('Result', {
        prediction:   result.prediction,
        probability:  result.probability,
        risk:         result.risk,
        topFeatures:  result.top_features || [],
        explanation:  result.explanation || '',
        merchant,
        upiId,
        amount: finalAmount,
      });
    } catch (err) {
      Alert.alert(
        'Analysis Failed',
        err.message || 'Could not reach the fraud detection server.',
        [{ text: 'OK' }]
      );
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

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Transaction Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header badge */}
        <View style={styles.headerBadge}>
          <Ionicons name="qr-code" size={24} color={colors.primary} />
        </View>
        <Text style={styles.headline}>QR Scanned</Text>
        <Text style={styles.subtitle}>
          Review the details extracted from the QR code
        </Text>

        {/* Details card */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>PARSED INFORMATION</Text>
          <DetailRow icon="person-outline" label="Merchant" value={merchant} />
          <DetailRow icon="card-outline" label="UPI ID" value={upiId} />
          <DetailRow icon="cash-outline" label="Currency" value={currency} />

          {/* Amount row — editable if missing */}
          {needsAmount ? (
            <View style={styles.amountInputSection}>
              <View style={styles.detailLeft}>
                <Ionicons name="wallet-outline" size={18} color={colors.secondary} style={{ marginRight: 10 }} />
                <Text style={[styles.detailLabel, { color: colors.secondary }]}>
                  Amount
                </Text>
              </View>
              <Text style={styles.amountMissing}>
                Not found in QR — enter manually
              </Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={editedAmount}
                  onChangeText={setEditedAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
            </View>
          ) : (
            <DetailRow
              icon="wallet-outline"
              label="Amount"
              value={`₹${parseFloat(amount).toLocaleString('en-IN')}`}
            />
          )}
        </View>

        {/* QR raw data (collapsed) */}
        {rawUri ? (
          <View style={styles.rawCard}>
            <Text style={styles.sectionLabel}>RAW QR DATA</Text>
            <Text style={styles.rawText} numberOfLines={3}>
              {rawUri}
            </Text>
          </View>
        ) : null}

        {/* Analyze button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAnalyze}
          disabled={loading || !isValid}
          style={[styles.ctaWrapper, (!isValid && !loading) && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
            ) : (
              <Ionicons name="shield-checkmark" size={20} color="#fff" style={{ marginRight: 10 }} />
            )}
            <Text style={styles.ctaText}>
              {loading ? 'Analyzing…' : 'Analyze for Fraud'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Rescan link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Scanner')}
          style={styles.rescanButton}
        >
          <Ionicons name="scan-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.rescanText}>Scan a different QR</Text>
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

  // ─── Top bar ──────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...typography.titleMD,
  },

  // ─── Content ──────────────────────────────────────
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  headerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  headline: {
    ...typography.headlineMD,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },

  // ─── Details card ─────────────────────────────────
  detailsCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  sectionLabel: {
    ...typography.labelSM,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.labelSM,
    color: colors.onSurfaceVariant,
  },
  detailValue: {
    ...typography.bodyMD,
    color: colors.onSurface,
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '55%',
  },

  // ─── Amount input ─────────────────────────────────
  amountInputSection: {
    paddingVertical: spacing.md,
  },
  amountMissing: {
    ...typography.bodySM,
    color: colors.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(76, 214, 255, 0.25)',
  },
  currencyPrefix: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    color: colors.onSurface,
    padding: 0,
  },

  // ─── Raw QR ───────────────────────────────────────
  rawCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.soft,
  },
  rawText: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
    fontFamily: 'Inter_400Regular',
  },

  // ─── CTA ──────────────────────────────────────────
  ctaWrapper: {
    width: '100%',
    marginBottom: spacing.lg,
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
    fontSize: 16,
    color: '#fff',
  },

  // ─── Rescan ───────────────────────────────────────
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rescanText: {
    ...typography.bodyMD,
    color: colors.primary,
  },
});
