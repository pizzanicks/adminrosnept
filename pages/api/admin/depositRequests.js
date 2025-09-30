import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin'; // Import the main admin SDK for FieldValue

export default async function handler(req, res) {
  // --- FIX START: Handle POST request for Credit/Debit ---
  if (req.method === 'POST') {
    const { userId, amount, operation, notes } = req.body;

    if (!userId || !amount || (operation !== 'credit' && operation !== 'debit')) {
      return res.status(400).json({ error: 'Missing required fields (userId, amount, operation) or invalid operation.' });
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const amountChange = operation === 'credit' ? amountValue : -amountValue;

    try {
      // Use a Firestore Transaction for atomicity to ensure data consistency
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('User not found.');
        }

        const currentBalance = userDoc.data().balance || 0;
        const newBalance = currentBalance + amountChange;

        if (operation === 'debit' && newBalance < 0) {
          throw new Error('Debit amount exceeds current balance.');
        }

        // 1. Update the user's balance
        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Log the transaction (optional but highly recommended)
        const logRef = userRef.collection('transactions').doc();
        transaction.set(logRef, {
          type: operation,
          amount: amountValue,
          previousBalance: currentBalance,
          newBalance: newBalance,
          notes: notes || `Admin ${operation}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // Successful transaction
      return res.status(200).json({ success: true, message: `User ${userId} successfully ${operation}ed with ${amountValue}.` });

    } catch (error) {
      console.error(`Error during ${operation} operation:`, error);
      // Return specific error message for transaction failures
      return res.status(500).json({ error: `Failed to ${operation} user: ` + error.message });
    }
  }
  // --- FIX END: Handle POST request for Credit/Debit ---


  // --- Original GET request logic (Fetching deposit requests) ---
  if (req.method === 'GET') {
    try {
      const snapshot = await adminDb.collectionGroup('depositRequests').get();
      const depositRequests = snapshot.docs.map(doc => {
        // Extract userId from document path: users/{userId}/depositRequests/{docId}
        const pathParts = doc.ref.path.split('/');
        const userId = pathParts[1]; // This gets the userId from the path
        
        const data = doc.data();
        
        // Convert Firestore Timestamp to ISO string for serialization
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        
        return {
          id: doc.id,
          userId: userId,
          ...data
        };
      });
      
      res.status(200).json(depositRequests);
    } catch (error) {
      console.error('Error in depositRequests API (GET):', error);
      res.status(500).json({ error: 'Failed to fetch deposit requests: ' + error.message });
    }
    return;
  }
  
  // Handle other HTTP methods
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}