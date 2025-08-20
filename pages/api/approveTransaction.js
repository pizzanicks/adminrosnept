import { doc, runTransaction, increment } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { selectedReq } = req.body;
    const { id, userId, amount } = selectedReq;

    console.log("dataa:", selectedReq);
    console.log("idd:", id);
    console.log("user id:", userId);
    console.log("amount:", amount);

    await runTransaction(db, async (transaction) => {
      // ✅ Fixed: subcollection should be "depositRequests"
      const depositRef = doc(db, "DEPOSITREQUEST", userId, "depositRequests", id);
      const historyRef = doc(db, "HISTORY", userId, "history", id);
      const investmentRef = doc(db, "INVESTMENT", userId);
      const allHistoryRef = doc(db, "ALLHISTORY", id);

      // Get docs
      const depositSnap = await transaction.get(depositRef);
      if (!depositSnap.exists()) {
        throw new Error("Deposit request not found.");
      }

      const historySnap = await transaction.get(historyRef);
      const investmentSnap = await transaction.get(investmentRef);
      const allHistorySnap = await transaction.get(allHistoryRef);

      // 1. Update DEPOSITREQ status to completed
      transaction.update(depositRef, { status: "completed" });

      // 2. Update HISTORY if exists
      if (historySnap.exists()) {
        transaction.update(historyRef, { status: "completed" });
      }

      // 3. Update INVESTMENT
      if (investmentSnap.exists()) {
        transaction.update(investmentRef, {
          walletBal: increment(amount),
          totalDeposit: increment(amount),
        });
      } else {
        transaction.set(investmentRef, {
          walletBal: amount,
          totalDeposit: amount,
        });
      }

      // 4. Update ALLHISTORY if exists
      if (allHistorySnap.exists()) {
        transaction.update(allHistoryRef, { status: "completed" });
      }
    });

    return res.status(200).json({ message: "Transaction approved successfully." });
    
  } catch (error) {
    console.error("Transaction failed:", error);
    return res
      .status(500)
      .json({ message: "Failed to approve transaction.", error: error.message });
  }
}
