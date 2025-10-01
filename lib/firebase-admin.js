// lib/firebase-admin.js
import admin from 'firebase-admin';
import { Buffer } from 'buffer'; // Needed for Base64 decoding

if (!admin.apps.length) {
  // --- START BASE64 DECODING LOGIC ---
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!base64Key) {
    throw new Error(
      '❌ FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set. ' +
      'Please set the Base64-encoded Service Account Key in your Vercel project.'
    );
  }

  try {
    // 1. Decode the Base64 string back to the original JSON
    const serviceAccountJsonString = Buffer.from(base64Key, 'base64').toString('utf8');

    // 2. Parse into object
    const serviceAccount = JSON.parse(serviceAccountJsonString);

    // 3. Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
    });

    console.log("✅ Firebase Admin initialized successfully with Base64 key");
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    throw new Error(
      "Failed to decode or parse Firebase Service Account Key. Check the Base64 value for errors."
    );
  }
  // --- END BASE64 DECODING LOGIC ---
}

// Keep your existing exports
const adminDb = admin.firestore();
export { admin, adminDb };
