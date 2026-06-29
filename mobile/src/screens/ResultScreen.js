import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebaseConfig';
import { saveScan } from '../services/historyService';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Semi-circular risk gauge component.
 */
function RiskGauge({ probability }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: probability,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [probability]);

  const rotation = animValue.interpolate({
    inputRange:  [0, 1],
    outputRange: ['-90deg', '90deg'],
  });

  // Colour transitions: green → amber → red
  const gaugeColor =
    probability < 0.3 ? colors.tertiary :
    probability < 0.7 ? colors.secondary :
    colors.error;

  return (
    <View style={styles.gaugeContainer}>
      {/* Track (semi-circle background) */}
      <View style={styles.gaugeTrack}>
        {/* Fill indicator (animated needle) */}
        <Animated.View
          style={[
            styles.gaugeNeedle,
            { transform: [{ rotate: rotation }], backgroundColor: gaugeColor },
          ]}
        />
        {/* Center circle */}
        <View style={styles.gaugeCenterDot} />
      </View>

      {/* Score label below */}
      <Text style={[styles.gaugeScore, { color: gaugeColor }]}>
        {Math.round(probability * 100)}%
      </Text>
      <Text style={styles.gaugeLabel}>RISK SCORE</Text>
    </View>
  );
}

export default function ResultScreen({ route, navigation }) {
  const {
    prediction  = 'LEGITIMATE',
    probability = 0,
    risk        = 'LOW',
    merchant    = 'Unknown',
    upiId       = '',
    amount      = 0,
    topFeatures = [],
    explanation = '',
  } = route.params || {};

  const isFraud = prediction === 'FRAUD';

  // Entry animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Save scan result to Firestore (non-blocking)
    const userId = auth.currentUser?.uid;
    if (userId) {
      saveScan(userId, {
        merchantName: merchant,
        upiId,
        amount,
        prediction,
        riskScore: probability,
        isFraud,
        topFeatures,
        explanation,
      });
    }
  }, []);

  const statusColor = isFraud ? colors.error : colors.tertiary;
  const statusBg    = isFraud ? colors.errorContainer : colors.tertiaryContainer;
  const statusIcon  = isFraud ? 'warning' : 'shield-checkmark';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Ionicons name={statusIcon} size={28} color={statusColor} />
          </View>

          {/* Headline */}
          <Text style={[styles.headline, { color: statusColor }]}>
            {isFraud ? 'Fraud Detected' : 'Transaction Safe'}
          </Text>
          <Text style={styles.subtitle}>
            {isFraud
              ? 'This transaction shows high-risk patterns.\nDo not proceed with this payment.'
              : 'This transaction appears to be legitimate.\nYou may proceed with caution.'}
          </Text>

          {/* Risk gauge */}
          <RiskGauge probability={probability} />

          {/* ─── XAI Explanation Card ─────────────────────── */}
          {isFraud && topFeatures.length > 0 ? (
            <View style={[styles.explanationCard, {
              borderLeftColor: colors.error,
            }]}>
              {/* Section header */}
              <View style={styles.explanationHeader}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.explanationTitle, { color: colors.error }]}>
                  Why this looks suspicious
                </Text>
              </View>

              {/* Top features list (show top 3) */}
              <View style={styles.featuresList}>
                {topFeatures.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.featureDot, {
                      backgroundColor: colors.error,
                    }]} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Explanation paragraph */}
              {explanation ? (
                <Text style={styles.explanationBody}>{explanation}</Text>
              ) : null}
            </View>
          ) : !isFraud ? (
            <View style={[styles.explanationCard, {
              borderLeftColor: colors.tertiary,
            }]}>
              <View style={styles.explanationHeader}>
                <Ionicons name="checkmark-circle" size={18} color={colors.tertiary} />
                <Text style={[styles.explanationTitle, { color: colors.tertiary }]}>
                  This transaction is legit
                </Text>
              </View>
            </View>
          ) : null}

          {/* Transaction details card */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>TRANSACTION DETAILS</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MERCHANT</Text>
              <Text style={styles.detailValue}>{merchant}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>UPI ID</Text>
              <Text style={styles.detailValue}>{upiId || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>AMOUNT</Text>
              <Text style={styles.detailValue}>₹{amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>RISK LEVEL</Text>
              <View style={[styles.riskPill, {
                backgroundColor: isFraud ? colors.errorContainer : colors.tertiaryContainer,
              }]}>
                <Text style={[styles.riskPillText, {
                  color: isFraud ? colors.onErrorContainer : colors.tertiary,
                }]}>
                  {risk}
                </Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>VERDICT</Text>
              <Text style={[styles.detailValue, { color: statusColor, fontFamily: 'Inter_600SemiBold' }]}>
                {prediction}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Home')}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.ctaText}>Scan Another QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex:  1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['4xl'],
  },

  // ─── Status badge ─────────────────────────────────
  statusBadge: {
    width:  64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },

  // ─── Typography ───────────────────────────────────
  headline: {
    ...typography.headlineLG,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  // ─── Risk gauge ───────────────────────────────────
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  gaugeTrack: {
    width:  140,
    height: 70,
    borderTopLeftRadius:  70,
    borderTopRightRadius: 70,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  gaugeNeedle: {
    position: 'absolute',
    bottom:   0,
    width:    3,
    height:   60,
    borderRadius: 2,
    transformOrigin: 'bottom center',
  },
  gaugeCenterDot: {
    width:  12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 2,
    borderColor: colors.onSurfaceVariant,
    marginBottom: -6,
  },
  gaugeScore: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   28,
    marginTop:  spacing.sm,
  },
  gaugeLabel: {
    ...typography.labelSM,
    marginTop: 2,
  },

  // ─── XAI Explanation card ─────────────────────────
  explanationCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 3,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  explanationTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  featuresList: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: spacing.md,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    ...typography.bodyMD,
    color: colors.onSurface,
  },
  explanationBody: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // ─── Details card ─────────────────────────────────
  detailsCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.soft,
  },
  detailsTitle: {
    ...typography.labelSM,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  detailLabel: {
    ...typography.labelSM,
  },
  detailValue: {
    ...typography.bodyMD,
    color: colors.onSurface,
  },
  riskPill: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs,
    borderRadius:      borderRadius.sm,
  },
  riskPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize:   12,
    letterSpacing: 0.5,
  },

  // ─── CTA ──────────────────────────────────────────
  ctaWrapper: {
    width: '100%',
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
});
