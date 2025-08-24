import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req, res) {
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
    console.error('Error in depositRequests API:', error);
    res.status(500).json({ error: 'Failed to fetch deposit requests: ' + error.message });
  }
}