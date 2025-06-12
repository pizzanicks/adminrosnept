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

  try {
    // Check if CUSTOMERKYC document exists
    const kycDoc = await getDoc(kycRef);

    if (!kycDoc.exists()) {
      return res.status(404).json({ message: "KYC document not found." });
    }

    // Update the KYC status to declined
    await updateDoc(kycRef, {
      status: "declined",
    });

    return res.status(200).json({ message: "KYC declined successfully." });

  } catch (error) {
    console.error("Error declining KYC:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
