import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width, height } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

/**
 * Parse a UPI URI into structured transaction data.
 * Example: upi://pay?pa=merchant@upi&pn=Merchant&am=500&cu=INR
 */
function parseUpiUri(uri) {
  if (!uri || !uri.toLowerCase().startsWith('upi://')) {
    return null;
  }
  try {
    const queryString = uri.split('?')[1];
    if (!queryString) return null;

    const params = {};
    queryString.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });

    return {
      upi_id:        params.pa || '',
      merchant_name: params.pn || 'Unknown',
      amount:        parseFloat(params.am) || 0,
      currency:      params.cu || 'INR',
    };
  } catch {
    return null;
  }
}

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Scanning line animation
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const translateY = scanLineAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  // Handle scanned barcode — navigate to detail screen for review
  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    const parsed = parseUpiUri(data);
    if (!parsed) {
      Alert.alert(
        'Invalid QR Code',
        'This does not appear to be a valid UPI QR code.',
        [{ text: 'Retry', onPress: () => setScanned(false) }]
      );
      return;
    }

    navigation.replace('TransactionDetail', {
      merchant: parsed.merchant_name,
      upiId:    parsed.upi_id,
      amount:   parsed.amount,
      currency: parsed.currency,
      rawUri:   data,
    });
  };

  // ─── Permission states ─────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionText}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="camera-outline" size={48} color={colors.onSurfaceVariant} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan UPI QR codes.{'\n'}No images are stored.
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.permButton}
          >
            <Text style={styles.permButtonText}>Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Camera view ───────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with cut-out */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan UPI QR</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scanner frame */}
        <View style={styles.scannerFrame}>
          {/* Corner accents */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Animated scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY }] },
            ]}
          />
        </View>

        {/* Instruction */}
        <View style={styles.instructionBox}>
          <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
          <Text style={styles.instructionText}>
            Position a UPI QR code within the frame
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },

  // ─── Permission ───────────────────────────────────
  permissionTitle: {
    ...typography.headlineSM,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.bodyMD,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  permButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: borderRadius.DEFAULT,
  },
  permButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },

  // ─── Camera overlay ───────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 19, 38, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 19, 38, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...typography.titleMD,
    color: '#fff',
  },

  // ─── Scanner frame ────────────────────────────────
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },

  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },

  // ─── Instruction ──────────────────────────────────
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing['2xl'],
    backgroundColor: 'rgba(11, 19, 38, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  instructionText: {
    ...typography.bodyMD,
    color: colors.onSurface,
  },
});
