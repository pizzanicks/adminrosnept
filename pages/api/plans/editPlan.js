// pages/api/editPlan.js
import { doc, setDoc } from "firebase/firestore";
// Import the pre-initialized Firestore database instance
import db from "@/lib/firebase"; // Assuming you have a file at this path exporting your Firestore db instance

export default async function handler(req, res) {
  // Only allow POST requests for updating plans
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: "Method Not Allowed", success: false });
  }

  try {
    const { cleanedFormData } = req.body;

    if (!cleanedFormData || !cleanedFormData.plan_id) {
      return res.status(400).json({
        message: "Missing plan ID or data for update",
        success: false,
      });
    }

    const planDocRef = doc(db, "MANAGE_PLAN", cleanedFormData.plan_id);

    await setDoc(planDocRef, cleanedFormData, { merge: true });

    return res.status(200).json({
      message: "Plan updated successfully!",
      success: true,
      updatedPlanId: cleanedFormData.plan_id,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
}
