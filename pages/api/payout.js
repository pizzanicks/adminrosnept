import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { payoutReq, percentage } = req.body;

  if (!payoutReq || !payoutReq.id || !payoutReq.userId || !percentage) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const investmentRef = doc(db, "INVESTMENT", payoutReq.userId);
  const userHistoryCollection = collection(db, "HISTORY", payoutReq.userId, "history");
  const allHistoryCollection = collection(db, "ALLHISTORY");

  try {
    const result = await runTransaction(db, async (transaction) => {
      const investmentDoc = await transaction.get(investmentRef);

      if (!investmentDoc.exists()) {
        throw new Error("Investment record does not exist.");
      }

      const investmentData = investmentDoc.data();

      // Calculate payout amount = lockedBal * (percentage / 100)
      const lockedBal = Number(investmentData.lockedBal) || 0;
      const payoutAmount = lockedBal * (percentage / 100);

      console.log("pay out amount:", payoutAmount);
      
      if (payoutAmount <= 0) {
        throw new Error("Invalid payout amount calculated.");
      }

      // Update walletBal
      transaction.update(investmentRef, {
        walletBal: (investmentData.walletBal || 0) + payoutAmount,
      });

      const cryptoCurrencies = ['btc', 'usdt'];
      const method = cryptoCurrencies.includes((payoutReq.currency || '').toLowerCase()) ? 'crypto' : 'bank';

      const selectedWallet = {
        currency: payoutReq.currency || "N/A",
        id: payoutReq.id,
        method,
        ...(method === 'crypto'
          ? { walletAddress: payoutReq.walletAddress || "" }
          : {
              bankName: payoutReq.selectedWallet?.bankName || "",
              accountNumber: payoutReq.selectedWallet?.accountNumber || "",
            }),
      };

      // Prepare the history doc data
      const historyDocData = {
        amount: payoutAmount,
        createdAt: new Date().toISOString(),
        docId: payoutReq.id,
        name: payoutReq.fullName || "Unknown",
        status: "completed",
        type: "deposit",
        userId: payoutReq.userId,
        selectedWallet,
        reference: "Profit Payout"
      };

      // Add history doc under user history collection
      const historyDocRef = await addDoc(userHistoryCollection, historyDocData);

      // Add the same doc to ALLHISTORY collection
      await addDoc(allHistoryCollection, historyDocData);

      return {
        payoutAmount,
        historyDocId: historyDocRef.id,
      };
    });

    return res.status(200).json({ message: "Payout processed successfully", ...result });

  } catch (error) {
    console.error("Transaction failed:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}
