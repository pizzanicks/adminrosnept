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
      
      // Add to both wallet and account balance
      const newWalletBalance = prevWalletBalance + amount;
      const newAccountBalance = prevAccountBalance + amount;

      const transactionEntry = {
        type: 'Credit',
        amount: amount,
        date: new Date().toISOString(),
        description: 'Admin credit',
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
      message: 'User credited successfully' 
    });
  } catch (err) {
    console.error('Credit error:', err);
    res.status(500).json({ 
      error: err.message || 'Failed to credit user' 
    });
  }
}