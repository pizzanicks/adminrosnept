import { adminDb, admin } from "@/lib/firebase-admin";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const userRef = adminDb.collection('USERS').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User not found');

      const userData = userDoc.data();
      const prevWalletBalance = userData.walletBalance || 0;
      const investedBalance = userData.investedBalance || 0;
      const pendingDeposits = userData.pendingDeposits || 0;
      const pendingWithdrawals = userData.pendingWithdrawals || 0;
      
      const newWalletBalance = prevWalletBalance + amount;
      const newAccountBalance = newWalletBalance + investedBalance + pendingDeposits - pendingWithdrawals;

      const transactionEntry = {
        type: 'Credit',
        amount: amount,
        date: new Date().toISOString(),
        description: 'Admin credit'
      };

      transaction.update(userRef, {
        walletBalance: newWalletBalance,
        accountBalance: newAccountBalance,
        transactionHistory: admin.firestore.FieldValue.arrayUnion(transactionEntry),
        updatedAt: new Date().toISOString()
      });
    });

    return res.status(200).json({ success: true, message: 'User credited successfully' });
  } catch (err) {
    console.error('Credit error:', err);
    return res.status(500).json({ error: err.message || 'Failed to credit user' });
  }
}