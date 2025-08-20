import { doc, runTransaction } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { selectedReq } = req.body;
    const { id, userId } = selectedReq;

    console.log("Decline data:", selectedReq);

    await runTransaction(db, async (transaction) => {
      // ✅ FIXED: corrected Firestore path
      const depositRef = doc(db, "DEPOSITREQUEST", userId, "depositRequests", id);
      const historyRef = doc(db, "HISTORY", userId, "history", id);
      const allHistoryRef = doc(db, "ALLHISTORY", id);
    
      // Get docs
      const depositSnap = await transaction.get(depositRef);
      if (!depositSnap.exists()) {
        throw new Error("Deposit request not found.");
      }
    
      const historySnap = await transaction.get(historyRef);
      const allHistorySnap = await transaction.get(allHistoryRef);
    
      // 1. Update DEPOSITREQUEST status to declined
      transaction.update(depositRef, { status: "declined" });
    
      // 2. Update HISTORY if exists
      if (historySnap.exists()) {
        transaction.update(historyRef, { status: "declined" });
      }
    
      // 3. Update ALLHISTORY if exists
      if (allHistorySnap.exists()) {
        transaction.update(allHistoryRef, { status: "declined" });
      }
    });    

    return res.status(200).json({ message: "Transaction declined successfully." });

  } catch (error) {
    console.error("Decline transaction failed:", error);
    return res.status(500).json({ message: "Failed to decline transaction.", error: error.message });
  }
}
