import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const userRef = doc(db, "USERS", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentSuspended = userSnap.data().suspended || false;
    const newSuspended = !currentSuspended;

    await updateDoc(userRef, { suspended: newSuspended });

    return res.status(200).json({
      message: `User suspension status updated to ${newSuspended}`,
      suspended: newSuspended,
    });
  } catch (error) {
    console.error("Error toggling suspension:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
