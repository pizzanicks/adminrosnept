import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import db from "../../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { userId, amount } = req.body;

    if (!userId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }

    try {
        const userRef = doc(db, 'USERS', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userSnap.data();
        const currentBalance = userData.walletBalance ?? 0;

        if (currentBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const newBalance = currentBalance - amount;

        const date = new Date();
        const formattedDate = date.toLocaleString('en-US', {
            timeZone: 'Africa/Lagos',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        await updateDoc(userRef, {
            walletBalance: newBalance,
            transactionHistory: arrayUnion({
                type: 'Debit',
                amount: amount,
                date: date.toISOString(),
                formattedDate: formattedDate,
                source: 'Admin Debit'
            })
        });

        return res.status(200).json({ message: 'User debited successfully' });
    } catch (error) {
        console.error('Error debiting user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
