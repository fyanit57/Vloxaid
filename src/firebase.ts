import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Simple boolean to check if we are using the placeholder configuration
export const isPlaceholderConfig = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === 'placeholder_key_until_firebase_setup_is_run' ||
  firebaseConfig.apiKey.includes('placeholder');

let firebaseApp;
let firebaseAuth;
let firebaseDb;

try {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  
  // Initialize Firestore with databaseId if specified, or default
  firebaseDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');
  firebaseAuth = getAuth(firebaseApp);
} catch (error) {
  console.warn('Firebase initialization error, entering offline fallback mode:', error);
  // Fail-safe placeholders
  firebaseApp = null;
  firebaseAuth = null;
  firebaseDb = null;
}

export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firebaseDb;

// Error structures as per guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export let onQuotaExceededCallback: ((errorMsg: string) => void) | null = null;
export function setOnQuotaExceeded(callback: (errorMsg: string) => void) {
  onQuotaExceededCallback = callback;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const isQuota = errorMsg.toLowerCase().includes('quota') || errorMsg.includes('Quota exceeded');

  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  
  if (isQuota) {
    if (onQuotaExceededCallback) {
      onQuotaExceededCallback(errorMsg);
    }
    return; // Prevent throwing and crashing the application
  }

  throw new Error(JSON.stringify(errInfo));
}

// Validation function as requested in skill
export async function testConnection() {
  if (isPlaceholderConfig || !db) {
    console.log("Firebase is running in placeholder mode. Real-time features will fallback to local storage.");
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client appears to be offline.");
    } else {
      console.log("Firebase connected or accessible, verification complete:", error);
    }
    return false;
  }
}

// Self-executable start
testConnection();
