import { doc, updateDoc, getDoc } from "firebase/firestore";
import db from "../../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const investmentRef = doc(db, 'INVESTMENT', userId);
        const investmentSnap = await getDoc(investmentRef);

        if (!investmentSnap.exists()) {
            return res.status(404).json({ message: 'Investment record not found' });
        }

        const date = new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
            timeZone: 'Africa/Lagos',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        await updateDoc(investmentRef, {
            'activePlan.startDate': date.toISOString(),
            'activePlan.endDate': null, // You might need to adjust this based on your logic
            'activePlan.daysCompleted': 0,
            'activePlan.lastPayoutDate': date.toISOString(),
            'activePlan.isActive': true,
        });

        return res.status(200).json({ message: 'Investment plan restarted successfully' });
    } catch (error) {
        console.error('Error restarting investment plan:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
