import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export const typedFirebaseConfig: FirebaseAppletConfig = firebaseConfig;

export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(typedFirebaseConfig);
