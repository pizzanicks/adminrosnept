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
    // --- FIX IS HERE: Directly use req.body as the updated plan data ---
    const updatedPlanData = req.body; // req.body already contains the cleanedFormData
    // -------------------------------------------------------------------

    console.log("Received data for plan update:", updatedPlanData);

    // Validate that plan_id (or just id) exists and is not empty
    if (!updatedPlanData || (!updatedPlanData.plan_id && !updatedPlanData.id)) {
        return res.status(400).json({
            message: "Missing plan ID or data for update",
            success: false,
        });
    }

    // Determine the ID to use (prefer plan_id, fall back to id)
    const planId = updatedPlanData.plan_id || updatedPlanData.id;

    // IMPORTANT: Ensure "MANAGE_PLAN" is the correct collection name
    const planDocRef = doc(db, "MANAGE_PLAN", planId);

    // setDoc with merge:true will update existing fields and add new ones.
    // If you want to completely overwrite the document, remove { merge: true }.
    await setDoc(planDocRef, updatedPlanData, { merge: true });

    console.log("Plan updated in Firestore with ID:", planId);

    return res.status(200).json({
      message: "Plan updated successfully!",
      success: true,
      updatedPlanId: planId,
      data: updatedPlanData, // Return the data that was saved
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
