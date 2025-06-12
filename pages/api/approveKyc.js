import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { user } = req.body;

  if (!user || !user.userId) {
    return res.status(400).json({ message: "Missing user or userId" });
  }

  const kycRef = doc(db, "CUSTOMERKYC", user.userId);
  const userRef = doc(db, "USERS", user.userId);

  try {
    // Get the current KYC status
    const kycDoc = await getDoc(kycRef);

    if (!kycDoc.exists()) {
      return res.status(404).json({ message: "KYC document not found." });
    }

    const kycData = kycDoc.data();

    if (kycData.status !== "pending") {
      return res.status(400).json({ message: "KYC is not in pending status." });
    }

    // Update the KYC status to approved
    await updateDoc(kycRef, {
      status: "approved",
    });

    // Get current user doc to check if update is needed
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User document not found." });
    }

    const userData = userDoc.data();

    const userUpdates = {};
    if (!userData.kycVerified) userUpdates.kycVerified = true;
    if (!userData.verified) userUpdates.verified = true;

    if (Object.keys(userUpdates).length > 0) {
      await updateDoc(userRef, userUpdates);
    }

    return res.status(200).json({ message: "KYC approved successfully." });

  } catch (error) {
    console.error("Error approving KYC:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
