import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req, res) {
  try {
    const snapshot = await adminDb.collectionGroup('depositRequests').get();
    const depositRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.ref.parent.parent.id,
      ...doc.data()
    }));
    res.status(200).json(depositRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deposit requests' });
  }
}