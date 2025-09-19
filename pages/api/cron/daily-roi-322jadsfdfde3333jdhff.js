// pages/api/cron/daily-roi-322jadsfdfde3333jdhff.js
import { adminDb, admin } from '@/lib/firebase-admin';

export default async function handler(req, res) {
  try {
    // Security check: ensure correct secret key
    const { secret } = req.query;
    if (!secret || secret !== process.env.CRON_SECRET) {
      console.log("❌ Unauthorized request. Invalid or missing secret.");
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log("🔐 Authorized request. Running processDailyROI...");
    console.log("🚀 Starting Daily ROI Processing...");

    const plansSnapshot = await adminDb.collection('PLANS').get();
    if (plansSnapshot.empty) {
      console.log("⚠️ No investment plans found.");
      return res.status(200).json({ message: "No plans found", users: [] });
    }

    let updatedUsers = [];
    const batch = adminDb.batch();

    for (const planDoc of plansSnapshot.docs) {
      const planData = planDoc.data();
      const durationDays = planData.durationDays || 7; // default to 7 days

      const usersSnapshot = await adminDb
        .collection('USERS')
        .where('planId', '==', planDoc.id)
        .get();

      if (usersSnapshot.empty) continue;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skip if no investment or plan already stopped
        if (!userData.investmentAmount || userData.roiActive === false) continue;

        const daysCompleted = userData.roiDaysCompleted || 0;

        // Auto stop ROI if cycle is completed
        if (daysCompleted >= durationDays) {
          batch.update(userDoc.ref, { roiActive: false });
          console.log(`⏹️ ROI stopped for user ${userId} (completed ${daysCompleted} days)`);
          continue;
        }

        // Calculate ROI
        const roiPercent = userData.currentPlanROIPercentage || planData.roiPercent || 0;
        const roi = (roiPercent / 100) * (userData.investmentAmount || 0);
        const newBalance = (userData.walletBalance || 0) + roi;

        // Update wallet and ROI tracking
        batch.update(userDoc.ref, {
          walletBalance: newBalance,
          lastROIPayout: admin.firestore.FieldValue.serverTimestamp(),
          roiDaysCompleted: daysCompleted + 1,
          roiActive: daysCompleted + 1 < durationDays,
        });

        // Log ROI payout
        const logRef = userDoc.ref.collection('roiLogs').doc();
        batch.set(logRef, {
          amount: roi,
          roiPercent,
          planId: planDoc.id,
          dayNumber: daysCompleted + 1,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        updatedUsers.push({
          userId,
          oldBalance: userData.walletBalance || 0,
          roi,
          newBalance,
          day: daysCompleted + 1,
          active: daysCompleted + 1 < durationDays,
        });
      }
    }

    await batch.commit();

    console.log("🎉 Daily ROI processing complete.");
    return res.status(200).json({
      message: "Daily ROI processed successfully ✅",
      users: updatedUsers,
    });

  } catch (error) {
    console.error("❌ Error processing Daily ROI:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
