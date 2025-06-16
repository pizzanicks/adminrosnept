// pages/api/addNewPlan.js
import { collection, addDoc, setDoc } from "firebase/firestore";
// Import the pre-initialized Firestore database instance
import db from "@/lib/firebase"; // Assuming you have a file at this path exporting your Firestore db instance

export default async function handler(req, res) {
  // Only allow POST requests for adding new plans
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: "Method Not Allowed", success: false });
  }

  try {
      const { cleanedFormData } = req.body;
      console.log("data:", cleanedFormData);

    // Basic validation: Check if formData exists and has a 'plan' name
    if (!cleanedFormData || !cleanedFormData.plan) {
      return res
        .status(400)
        .json({ message: "Missing plan data", success: false });
    }

    // --- Firestore Interaction ---
    // Reference to the MANAGE_PLAN collection
    // This assumes your `db` instance is already configured to include the
    // `artifacts/${__app_id}/public/data` prefix in its root.
    const managePlanCollectionRef = collection(db, "MANAGE_PLAN");

    // Add the new plan document to Firestore
    const docRef = await addDoc(managePlanCollectionRef, cleanedFormData);

    // Update the newly created document to include its own ID as 'plan_id'
    await setDoc(docRef, { plan_id: docRef.id }, { merge: true });

    console.log("New plan added to Firestore with ID:", docRef.id);

    return res.status(200).json({
      message: "Plan added successfully!",
      success: true,
      newPlanId: docRef.id, // Return the newly created document ID
      data: { ...cleanedFormData, plan_id: docRef.id }, // Return the full data with the new ID
    });
  } catch (error) {
    console.error("Error adding new plan:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
}
