import { doc, runTransaction } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { selectedReq } = req.body;
    const { id, userId } = selectedReq;

    if (!id || !userId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await runTransaction(db, async (transaction) => {
      // References
      const withdrawRef = doc(db, "WITHDRAWREQUEST", id);
      const historyRef = doc(db, "HISTORY", userId, "history", id);
      const allHistoryRef = doc(db, "ALLHISTORY", id);

      // Get docs
      const withdrawSnap = await transaction.get(withdrawRef);
      if (!withdrawSnap.exists()) {
        throw new Error("Withdrawal request not found.");
      }

      const historySnap = await transaction.get(historyRef);
      const allHistorySnap = await transaction.get(allHistoryRef);

      // 1. Update WITHDRAWREQUEST status
      transaction.update(withdrawRef, { status: "completed" });

      // 2. Update HISTORY if exists
      if (historySnap.exists()) {
        transaction.update(historyRef, { status: "completed" });
      }

      // 3. Update ALLHISTORY if exists
      if (allHistorySnap.exists()) {
        transaction.update(allHistoryRef, { status: "completed" });
      }
    });

    return res.status(200).json({ message: "Withdrawal request approved successfully." });
  } catch (error) {
    console.error("Withdrawal approval failed:", error);
    return res.status(500).json({ message: "Failed to approve withdrawal.", error: error.message });
  }
}
