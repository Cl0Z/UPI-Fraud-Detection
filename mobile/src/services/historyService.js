/**
 * Firestore History Service
 *
 * Functions to save and retrieve scan history per user.
 * Collection: scanHistory
 */

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const COLLECTION_NAME = 'scanHistory';

/**
 * Save a scan result to Firestore.
 *
 * @param {string} userId — Firebase Auth UID
 * @param {object} scanData — { merchantName, upiId, amount, prediction, riskScore, isFraud, topFeatures, explanation }
 */
export async function saveScan(userId, scanData) {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      merchantName: scanData.merchantName || 'Unknown',
      upiId:        scanData.upiId || '',
      amount:       scanData.amount || 0,
      prediction:   scanData.prediction || 'LEGITIMATE',
      riskScore:    scanData.riskScore || 0,
      isFraud:      scanData.isFraud || false,
      topFeatures:  scanData.topFeatures || [],
      explanation:  scanData.explanation || '',
      timestamp:    serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to save scan to Firestore:', error);
    // Non-critical — don't crash the app
  }
}

/**
 * Fetch all scans for a given user, newest first.
 *
 * @param {string} userId — Firebase Auth UID
 * @returns {Promise<Array>} — Array of scan objects
 */
export async function getUserScans(userId) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Convert Firestore Timestamp to JS Date string
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
  }));
}

/**
 * Report a past scan as fraud.
 * Updates isFraud to true and prediction to 'FRAUD' in Firestore.
 *
 * @param {string} docId — Firestore document ID
 */
export async function reportFraud(docId) {
  const docRef = doc(db, COLLECTION_NAME, docId);
  await updateDoc(docRef, {
    isFraud:    true,
    prediction: 'FRAUD',
  });
}

/**
 * Unmark a past scan as fraud — set it back to legitimate.
 *
 * @param {string} docId — Firestore document ID
 */
export async function markLegitimate(docId) {
  const docRef = doc(db, COLLECTION_NAME, docId);
  await updateDoc(docRef, {
    isFraud:    false,
    prediction: 'LEGITIMATE',
  });
}
