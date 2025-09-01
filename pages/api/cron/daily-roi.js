// pages/api/cron/daily-roi.js
import admin from 'firebase-admin';
import dayjs from 'dayjs';

if (!admin.apps.length) {
  if (process.env.SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK Initialized successfully.');
  } else {
    console.warn('SERVICE_ACCOUNT_KEY not found. Initializing default Firebase app.');
    admin.initializeApp();
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log(`\n--- [${new Date().toISOString()}] Daily ROI API Triggered ---`);

  try {
    // Fetch all investment plans
    const plansSnapshot = await db.collection('investmentPlans').get();
    if (plansSnapshot.empty) {
      return res.status(500).json({ error: 'No investment plans found.' });
    }

    const investmentPlans = {};
    plansSnapshot.forEach(doc => {
      investmentPlans[doc.id] = doc.data();
    });

    // Fetch active users
    const usersSnapshot = await db.collection('users')
      .where('earningStatus', '==', 'active')
      .get();

    if (usersSnapshot.empty) {
      return res.status(200).json({ message: 'No active users to process.' });
    }

    const batch = db.batch();
    let usersProcessed = 0;
    let usersSkipped = 0;

    console.log(`Found ${usersSnapshot.docs.length} active users. Processing...`);

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userRef = doc.ref;

      const initialInvestmentAmount = userData.initialInvestmentAmount || 0;
      const investmentPlanId = userData.investmentPlanId;
      let currentROI = userData.currentROI || 0;
      let roiIncreaseDayCount = userData.roiIncreaseDayCount || 0;
      const lastROIUpdateTimestamp = userData.lastROIUpdateDate;
      const roiStartDateTimestamp = userData.roiStartDate;

      // Validation
      if (initialInvestmentAmount <= 0) {
        console.log(`  User ${doc.id}: initial investment <= 0. Skipping.`);
        usersSkipped++;
        continue;
      }
      if (!investmentPlanId) {
        console.log(`  User ${doc.id}: missing investmentPlanId. Skipping.`);
        usersSkipped++;
        continue;
      }

      const plan = investmentPlans[investmentPlanId];
      if (!plan || typeof plan.dailyROI !== 'number') {
        console.warn(`  User ${doc.id}: plan not found or dailyROI invalid. Skipping.`);
        usersSkipped++;
        continue;
      }

      const DAILY_ROI = plan.dailyROI;
      const MAX_ROI_DAYS = 7;

      const lastROIUpdateDate = lastROIUpdateTimestamp ? lastROIUpdateTimestamp.toDate() : null;
      const roiStartDate = roiStartDateTimestamp ? roiStartDateTimestamp.toDate() : null;

      const now = new Date();
      const lastUpdateCheckDate = lastROIUpdateDate || roiStartDate;

      if (!lastUpdateCheckDate) {
        console.log(`  User ${doc.id}: Missing lastROIUpdateDate or roiStartDate. Skipping.`);
        usersSkipped++;
        continue;
      }

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      if (now.getTime() - lastUpdateCheckDate.getTime() < ONE_DAY_MS - (5 * 60 * 1000)) {
        console.log(`  User ${doc.id}: Less than 24h since last update. Skipping.`);
        usersSkipped++;
        continue;
      }

      if (roiIncreaseDayCount >= MAX_ROI_DAYS) {
        if (userData.earningStatus !== 'completed') {
          batch.update(userRef, { earningStatus: 'completed' });
          usersProcessed++;
        }
        continue;
      }

      // ROI Calculation
      currentROI += DAILY_ROI;
      roiIncreaseDayCount++;
      const maxCumulativeROI = MAX_ROI_DAYS * DAILY_ROI;
      if (currentROI > maxCumulativeROI) currentROI = maxCumulativeROI;

      const newROIValue = initialInvestmentAmount * (currentROI / 100);

      const updateData = {
        currentROI: parseFloat(currentROI.toFixed(2)),
        currentROIValue: parseFloat(newROIValue.toFixed(2)),
        roiIncreaseDayCount,
        lastROIUpdateDate: now,
      };

      if (roiIncreaseDayCount >= MAX_ROI_DAYS) {
        updateData.earningStatus = 'completed';
        console.log(`  User ${doc.id}: 7-day cycle complete. Marked completed.`);
      }

      batch.update(userRef, updateData);
      usersProcessed++;
      console.log(`  User ${doc.id}: ROI updated. Day ${roiIncreaseDayCount}/${MAX_ROI_DAYS}, Plan: ${investmentPlanId}, Daily ROI: ${DAILY_ROI}%, Total ROI: ${currentROI.toFixed(2)}%, Value: $${newROIValue.toFixed(2)}.`);
    }

    if (usersProcessed > 0) await batch.commit();

    console.log(`\n--- Daily ROI API finished. Processed ${usersProcessed} users, skipped ${usersSkipped}. ---`);
    res.status(200).json({ message: `Processed ${usersProcessed} users, skipped ${usersSkipped}.` });

  } catch (error) {
    console.error('CRITICAL ERROR in ROI API:', error);
    res.status(500).json({ error: error.message });
  }
}
