// pages/api/cron/daily-roi-322jadsfdfde3333jdhff.js
import { adminDb, admin } from '@/lib/firebase-admin';

export default async function handler(req, res) {
  try {
    // ✅ Secret key check for security
    const cronSecret = process.env.CRON_SECRET;
    if (req.query.secret !== cronSecret) {
      console.log("❌ Unauthorized request.");
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log("🚀 Starting Daily ROI Processing...");

    const plansSnapshot = await adminDb.collection('PLANS').get();
    if (plansSnapshot.empty) {
      console.log("⚠️ No plans found.");
      return res.status(200).json({ message: "No plans found", users: [] });
    }

    let updatedUsers = [];
    const batch = adminDb.batch();

    for (const planDoc of plansSnapshot.docs) {
      const planData = planDoc.data();
      const durationDays = planData.durationDays || 7; // default 7 days

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

        // Auto-stop ROI if cycle completed
        if (daysCompleted >= durationDays) {
          batch.update(userDoc.ref, { roiActive: false, earningStatus: 'completed' });
          console.log(`⏹️ ROI stopped for user ${userId} (completed ${daysCompleted} days)`);
          continue;
        }

        // Calculate ROI using currentPlanROIPercentage
        const roiPercent = userData.currentPlanROIPercentage || planData.roiPercent || 0;
        const roi = (roiPercent / 100) * (userData.investmentAmount || 0);
        const newBalance = (userData.walletBalance || 0) + roi;

        // Update wallet and ROI tracking
        batch.update(userDoc.ref, {
          walletBalance: newBalance,
          lastROIPayout: admin.firestore.FieldValue.serverTimestamp(),
          roiDaysCompleted: daysCompleted + 1,
          roiActive: daysCompleted + 1 < durationDays,
          earningStatus: daysCompleted + 1 < durationDays ? 'running' : 'completed',
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
