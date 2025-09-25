import { adminDb, admin } from "../../lib/firebase-admin"; // Path updated to reflect new file location

export default async function handler(req, res) {
  try {
    console.log("🔐 Daily ROI cron started...");

    // --- Security check ---
    const vercelHeader = req.headers["x-vercel-cron"] || req.headers["vercel-cron"];
    const isVercelCron = typeof vercelHeader === "string" && ["1", "true"].includes(vercelHeader.toLowerCase());
    const isLocal = process.env.NODE_ENV === "development";

    if (!(isVercelCron || isLocal)) {
      console.log("❌ Unauthorized request.");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // --- Fetch all investments with active plans ---
    const investmentsSnap = await adminDb.collection("INVESTMENT").where("hasActivePlan", "==", true).get();
    console.log(`👥 Total active investments found: ${investmentsSnap.size}`);

    if (investmentsSnap.empty) {
      return res.status(200).json({ message: "No active investments found", usersUpdated: 0 });
    }

    const batch = adminDb.batch();
    const updatedUsers = [];
    const skippedUsers = [];

    for (const investmentDoc of investmentsSnap.docs) {
      const userId = investmentDoc.id;
      const investmentData = investmentDoc.data();

      // ✅ Check if active plan exists and is valid
      if (!investmentData.activePlan || !investmentData.activePlan.isActive) {
        skippedUsers.push(userId);
        continue;
      }

      const activePlan = investmentData.activePlan;
      const daysCompleted = activePlan.daysCompleted || 0;
      const duration = activePlan.durationDays || 7;

      // ⏸️ Skip paused plans
      if (activePlan.status === 'paused') {
        console.log(`⏸️ Skipping paused plan for ${userId}`);
        skippedUsers.push(userId);
        continue;
      }

      // ⏹️ Stop investment if already finished
      if (daysCompleted >= duration) {
        batch.update(investmentDoc.ref, {
          "activePlan.isActive": false,
          "activePlan.status": "completed",
          hasActivePlan: false,
          // Return locked balance to wallet
          walletBal: (investmentData.walletBal || 0) + (investmentData.lockedBal || 0),
          lockedBal: 0,
          planCompletedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`🏁 Plan completed for ${userId} after ${duration} days`);
        skippedUsers.push(userId);
        continue;
      }

      // 💰 Calculate ROI based on plan's specific ROI percentage
      const roiPercent = activePlan.roiPercent || 0.04;
      const investmentAmount = activePlan.amount || investmentData.lockedBal || 0;
      const roi = roiPercent * investmentAmount;
      
      const newWalletBalance = (investmentData.walletBal || 0) + roi;

      // ✅ Update investment data
      batch.update(investmentDoc.ref, {
        walletBal: newWalletBalance,
        totalEarned: (investmentData.totalEarned || 0) + roi,
        "activePlan.daysCompleted": daysCompleted + 1,
        "activePlan.isActive": daysCompleted + 1 < duration,
        "activePlan.status": daysCompleted + 1 < duration ? "active" : "completed",
        hasActivePlan: daysCompleted + 1 < duration,
        lastRoiPaidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString(),
      });

      // 📑 Log ROI payout under subcollection
      const logRef = investmentDoc.ref.collection("roiLogs").doc();
      batch.set(logRef, {
        amount: roi,
        roiPercent: roiPercent * 100, // Store as percentage for display
        planName: activePlan.planName,
        dayNumber: daysCompleted + 1,
        totalDays: duration,
        investmentAmount: investmentAmount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      updatedUsers.push({
        userId,
        roi,
        newBalance: newWalletBalance,
        day: daysCompleted + 1,
        totalDays: duration,
        planName: activePlan.planName,
        roiPercentage: roiPercent * 100
      });

      console.log(`✅ ROI credited for ${userId}: +$${roi} (${roiPercent * 100}% of $${investmentAmount}) - Day ${daysCompleted + 1}/${duration}`);
    }

    // --- Commit updates ---
    if (updatedUsers.length > 0) {
      await batch.commit();
      console.log(`📦 Batch committed. Users updated: ${updatedUsers.length}`);
    } else {
      console.log("⚠️ No users updated in this run.");
    }

    // --- Save cron log ---
    await adminDb.collection("CRON_LOGS").add({
      executedAt: admin.firestore.FieldValue.serverTimestamp(),
      message: "Daily ROI processed",
      usersUpdated: updatedUsers.length,
      skippedUsers: skippedUsers.length,
    });

    return res.status(200).json({
      message: "Daily ROI processed successfully",
      usersUpdated: updatedUsers.length,
      updatedUsers,
      skippedUsers,
    });
  } catch (err) {
    console.error("❌ Error in cron:", err);
    await adminDb.collection("CRON_LOGS").add({
      executedAt: admin.firestore.FieldValue.serverTimestamp(),
      message: "Error processing daily ROI",
      error: err.message || String(err),
    });
    return res.status(500).json({ message: "Internal Server Error", error: err.message || String(err) });
  }
}
