import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req, res) {
  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial data
  try {
    const snapshot = await adminDb.collectionGroup('depositRequests').get();
    const depositRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.ref.parent.parent.id,
      ...doc.data()
    }));
    
    res.write(`data: ${JSON.stringify(depositRequests)}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: 'Failed to fetch requests' })}\n\n`);
  }

  // Set up real-time listener
  const unsubscribe = adminDb.collectionGroup('depositRequests')
    .onSnapshot((snapshot) => {
      const depositRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.ref.parent.parent.id,
        ...doc.data()
      }));
      
      // Send update to client
      res.write(`data: ${JSON.stringify(depositRequests)}\n\n`);
    });

  // Clean up on connection close
  req.on('close', () => {
    unsubscribe();
    res.end();
  });
}