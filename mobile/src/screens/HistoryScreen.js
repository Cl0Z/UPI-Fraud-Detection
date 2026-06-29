import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebaseConfig';
import { getUserScans, reportFraud, markLegitimate } from '../services/historyService';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

function ScanCard({ item, onReport, onUnmark }) {
  const [expanded, setExpanded] = useState(false);
  const isFraud = item.isFraud;
  const hasExplanation = (item.topFeatures && item.topFeatures.length > 0) || item.explanation;
  const date    = item.timestamp
    ? new Date(item.timestamp).toLocaleDateString('en-IN', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
      })
    : '—';
  const time = item.timestamp
    ? new Date(item.timestamp).toLocaleTimeString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={styles.card}>
      {/* Left accent */}
      <View style={[styles.cardAccent, {
        backgroundColor: isFraud ? colors.error : colors.tertiary,
      }]} />

      <View style={styles.cardContent}>
        {/* Top row: merchant + badge */}
        <View style={styles.cardTopRow}>
          <Text style={styles.merchantName} numberOfLines={1}>
            {item.merchantName || 'Unknown'}
          </Text>
          <View style={[styles.badge, {
            backgroundColor: isFraud ? colors.errorContainer : colors.tertiaryContainer,
          }]}>
            <Text style={[styles.badgeText, {
              color: isFraud ? colors.onErrorContainer : colors.tertiary,
            }]}>
              {isFraud ? 'FRAUD' : 'SAFE'}
            </Text>
          </View>
        </View>

        {/* Details row */}
        <View style={styles.cardDetailsRow}>
          <View style={styles.detailChip}>
            <Ionicons name="wallet-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={styles.detailChipText}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.detailChip}>
            <Ionicons name="speedometer-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={styles.detailChipText}>{Math.round((item.riskScore || 0) * 100)}% risk</Text>
          </View>
        </View>

        {/* Bottom row: UPI ID + date */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.upiIdText} numberOfLines={1}>
            {item.upiId || '—'}
          </Text>
          <Text style={styles.dateText}>
            {date}{time ? ` • ${time}` : ''}
          </Text>
        </View>

        {/* Expand/collapse for explanation */}
        {hasExplanation && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={styles.expandBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary}
            />
            <Text style={styles.expandBtnText}>
              {expanded ? 'Hide details' : 'Why this was flagged'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Expanded explanation section */}
        {expanded && (
          <View style={styles.expandedSection}>
            {item.topFeatures && item.topFeatures.length > 0 ? (
              <View style={styles.expandedFeaturesList}>
                {item.topFeatures.map((feature, idx) => (
                  <View key={idx} style={styles.expandedFeatureRow}>
                    <View style={[styles.expandedFeatureDot, {
                      backgroundColor: isFraud ? colors.error : colors.tertiary,
                    }]} />
                    <Text style={styles.expandedFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {item.explanation ? (
              <Text style={styles.expandedExplanation}>{item.explanation}</Text>
            ) : (
              <Text style={styles.expandedExplanation}>Explanation not available for this scan.</Text>
            )}
          </View>
        )}

        {/* Report / Unmark button */}
        {!isFraud ? (
          <TouchableOpacity
            onPress={() => onReport(item.id, item.merchantName)}
            style={styles.reportBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={14} color={colors.error} />
            <Text style={styles.reportBtnText}>Report as Fraud</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onUnmark(item.id, item.merchantName)}
            style={styles.safeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.tertiary} />
            <Text style={styles.safeBtnText}>Mark as Safe</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={56} color={colors.surfaceContainerHigh} />
      <Text style={styles.emptyTitle}>No Scans Yet</Text>
      <Text style={styles.emptyBody}>
        Start scanning UPI QR codes to see{'\n'}your history here.
      </Text>
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const [scans, setScans]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const data = await getUserScans(userId);
      setScans(data);
    } catch (err) {
      console.error('Failed to fetch scan history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchScans();
  };

  const handleReport = (docId, merchantName) => {
    Alert.alert(
      'Report as Fraud',
      `Are you sure you want to report the transaction with "${merchantName || 'Unknown'}" as fraudulent?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportFraud(docId);
              // Optimistic update — flip it locally so the UI updates instantly
              setScans((prev) =>
                prev.map((s) =>
                  s.id === docId
                    ? { ...s, isFraud: true, prediction: 'FRAUD' }
                    : s
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to report. Please try again.');
              console.error('Report fraud failed:', err);
            }
          },
        },
      ]
    );
  };

  const handleUnmark = (docId, merchantName) => {
    Alert.alert(
      'Mark as Safe',
      `Are you sure you want to mark the transaction with "${merchantName || 'Unknown'}" as legitimate?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Safe',
          onPress: async () => {
            try {
              await markLegitimate(docId);
              setScans((prev) =>
                prev.map((s) =>
                  s.id === docId
                    ? { ...s, isFraud: false, prediction: 'LEGITIMATE' }
                    : s
                )
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to update. Please try again.');
              console.error('Mark legitimate failed:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats bar */}
      {scans.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{scans.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.tertiary }]}>
              {scans.filter(s => !s.isFraud).length}
            </Text>
            <Text style={styles.statLabel}>SAFE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.error }]}>
              {scans.filter(s => s.isFraud).length}
            </Text>
            <Text style={styles.statLabel}>FRAUD</Text>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ScanCard item={item} onReport={handleReport} onUnmark={handleUnmark} />}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={scans.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
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

  // ─── Stats bar ────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    ...shadows.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: colors.onSurface,
  },
  statLabel: {
    ...typography.labelSM,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.outlineVariant,
  },

  // ─── List ─────────────────────────────────────────
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Card ─────────────────────────────────────────
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.soft,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  merchantName: {
    ...typography.titleMD,
    fontSize: 15,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailChipText: {
    ...typography.bodySM,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upiIdText: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
    flex: 1,
    marginRight: spacing.sm,
  },
  dateText: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
  },

  // ─── Expand / Explanation ─────────────────────────
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    gap: 5,
  },
  expandBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
  },
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  expandedFeaturesList: {
    marginBottom: spacing.sm,
  },
  expandedFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: spacing.sm,
  },
  expandedFeatureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  expandedFeatureText: {
    ...typography.bodySM,
    color: colors.onSurface,
  },
  expandedExplanation: {
    ...typography.bodySM,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: spacing.xs,
  },

  // ─── Report button ────────────────────────────────
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.DEFAULT,
    backgroundColor: 'rgba(147, 0, 10, 0.15)',
    gap: 6,
  },
  reportBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.error,
  },
  safeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.DEFAULT,
    backgroundColor: 'rgba(0, 56, 34, 0.25)',
    gap: 6,
  },
  safeBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.tertiary,
  },

  // ─── Empty state ──────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.headlineSM,
    marginTop: spacing.lg,
  },
  emptyBody: {
    ...typography.bodyMD,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
