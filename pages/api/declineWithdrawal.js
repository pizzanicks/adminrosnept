import { doc, runTransaction, increment } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { selectedReq } = req.body;
    const { id, userId, amount } = selectedReq;

    console.log("Declining withdrawal request:", selectedReq);

    await runTransaction(db, async (transaction) => {
      // References
      const withdrawRef = doc(db, "WITHDRAWREQUEST", id);
      const historyRef = doc(db, "HISTORY", userId, "history", id);
      const investmentRef = doc(db, "INVESTMENT", userId);
      const allHistoryRef = doc(db, "ALLHISTORY", id);

      // Get docs
      const withdrawSnap = await transaction.get(withdrawRef);
      if (!withdrawSnap.exists()) {
        throw new Error("Withdrawal request not found.");
      }

      const historySnap = await transaction.get(historyRef);
      const investmentSnap = await transaction.get(investmentRef);
      const allHistorySnap = await transaction.get(allHistoryRef);

      // 1. Update WITHDRAWREQUEST status to declined
      transaction.update(withdrawRef, { status: "declined" });

      // 2. Update HISTORY if exists
      if (historySnap.exists()) {
        transaction.update(historyRef, { status: "declined" });
      }

      // 3. Return funds to wallet in INVESTMENT
      if (investmentSnap.exists()) {
        transaction.update(investmentRef, {
          walletBal: increment(amount),
        });
      } else {
        // fallback if INVESTMENT record doesn't exist
        transaction.set(investmentRef, {
          walletBal: amount,
          totalDeposit: 0,
        });
      }

      // 4. Update ALLHISTORY if exists
      if (allHistorySnap.exists()) {
        transaction.update(allHistoryRef, { status: "declined" });
      }
    });

    return res.status(200).json({ message: "Withdrawal declined and funds returned." });

  } catch (error) {
    console.error("Withdrawal decline failed:", error);
    return res.status(500).json({ message: "Failed to decline withdrawal.", error: error.message });
  }
}
