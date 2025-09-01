// pages/api/cron/daily-roi.js

import admin from 'firebase-admin';

// --- Initialize Firebase Admin SDK ---
if (!admin.apps.length) {
  if (process.env.SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized using SERVICE_ACCOUNT_KEY.');
  } else {
    console.warn('SERVICE_ACCOUNT_KEY not found, using default credentials.');
    admin.initializeApp();
  }
}

const db = admin.firestore();

// --- ROI Processing Function ---
async function processDailyROI() {
  try {
    // 1. Fetch all investment plans
    const planSnapshot = await db.collection('investmentPlans').get();
    const plans = {};
    planSnapshot.docs.forEach(doc => {
      plans[doc.id] = doc.data();
    });

    if (!Object.keys(plans).length) {
      console.log('No investment plans found.');
      return [];
    }

    // 2. Fetch active users
    const userSnapshot = await db
      .collection('users')
      .where('earningStatus', '==', 'active')
      .get();

    if (userSnapshot.empty) {
      console.log('No active users to process.');
      return [];
    }

    const batch = db.batch();
    const userProgressSummary = [];

    for (const doc of userSnapshot.docs) {
      const user = doc.data();
      const userRef = db.collection('users').doc(doc.id);

      const planId = user.investmentPlanId;
      const plan = plans[planId];
      const initialInvestment = user.initialInvestmentAmount || 0;

      if (!plan || typeof plan.dailyROI !== 'number' || initialInvestment <= 0) continue;

      let currentROI = user.currentROI || 0;
      let roiDayCount = user.roiIncreaseDayCount || 0;

      // Skip if 7 days already completed
      if (roiDayCount >= 7) {
        if (user.earningStatus !== 'completed') {
          batch.update(userRef, { earningStatus: 'completed' });
        }
        userProgressSummary.push({
          userId: doc.id,
          planId,
          day: roiDayCount,
          roiPercentage: currentROI,
          status: 'completed',
        });
        continue;
      }

      // --- Calculate new ROI for today ---
      const newDayCount = roiDayCount + 1;
      const newROI = currentROI + plan.dailyROI;
      const maxROI = 7 * plan.dailyROI;
      const cappedROI = newROI > maxROI ? maxROI : newROI;
      const roiValue = initialInvestment * (cappedROI / 100);

      // Prepare batch update
      const updateData = {
        roiIncreaseDayCount: newDayCount,
        currentROI: parseFloat(cappedROI.toFixed(2)),
        currentROIValue: parseFloat(roiValue.toFixed(2)),
        lastROIUpdateDate: new Date(),
      };

      if (newDayCount >= 7) updateData.earningStatus = 'completed';

      batch.update(userRef, updateData);

      userProgressSummary.push({
        userId: doc.id,
        planId,
        day: newDayCount,
        roiPercentage: parseFloat(cappedROI.toFixed(2)),
        roiValue: parseFloat(roiValue.toFixed(2)),
        status: newDayCount >= 7 ? 'completed' : 'active',
      });
    }

    // Commit batch updates
    if (userProgressSummary.length) {
      await batch.commit();
    }

    console.log('Daily ROI processed successfully:', userProgressSummary);
    return userProgressSummary;
  } catch (error) {
    console.error('Error in daily ROI processing:', error);
    return [];
  }
}

// --- API Endpoint ---
export default async function handler(req, res) {
  const summary = await processDailyROI();
  res.status(200).json({
    message: 'Daily ROI processed successfully.',
    users: summary,
  });
}
