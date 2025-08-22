import { adminDb, admin } from "@/lib/firebase-admin";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, amount } = req.body;

  // Validate request
  if (!userId || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  const userRef = adminDb.collection('USERS').doc(userId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const prevWalletBalance = userData.walletBalance || 0;
      const prevAccountBalance = userData.accountBalance || 0;
      
      // Check if user has sufficient funds in both balances
      if (amount > prevWalletBalance) {
        throw new Error('Insufficient wallet balance');
      }
      
      if (amount > prevAccountBalance) {
        throw new Error('Insufficient account balance');
      }
      
      // Subtract from both wallet and account balance
      const newWalletBalance = prevWalletBalance - amount;
      const newAccountBalance = prevAccountBalance - amount;

      const transactionEntry = {
        type: 'Debit',
        amount: amount,
        date: new Date().toISOString(),
        description: 'Admin debit',
        adminId: 'system' // Optional: track who performed the action
      };

      // Update user document
      transaction.update(userRef, {
        walletBalance: newWalletBalance,
        accountBalance: newAccountBalance,
        transactionHistory: admin.firestore.FieldValue.arrayUnion(transactionEntry),
        updatedAt: new Date().toISOString()
      });
    });

    res.status(200).json({ 
      success: true, 
      message: 'User debited successfully' 
    });
  } catch (err) {
    console.error('Debit error:', err);
    
    // Provide more specific error messages
    if (err.message.includes('Insufficient')) {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ 
      error: err.message || 'Failed to debit user' 
    });
  }
}