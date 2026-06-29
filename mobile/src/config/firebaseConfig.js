/**
 * Firebase Configuration
 *
 * Initializes Firebase Auth and Firestore using the Firebase JS SDK.
 * Credentials are extracted from google-services.json.
 */

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            'AIzaSyDblDViLsFH9PtWSUBBFL7cx6RUUN-sf2g',
  authDomain:        'upi-fraud-detection-7e4c8.firebaseapp.com',
  projectId:         'upi-fraud-detection-7e4c8',
  storageBucket:     'upi-fraud-detection-7e4c8.firebasestorage.app',
  messagingSenderId: '840837393681',
  appId:             '1:840837393681:android:b2999bbdcbe2346460f0b0',
};

const app = initializeApp(firebaseConfig);

// Use AsyncStorage for auth persistence (keeps user logged in across app restarts)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
