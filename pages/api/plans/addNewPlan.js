// pages/api/plans/addNewPlan.js

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
      // --- FIX IS HERE: Directly use req.body as the new plan data ---
      // The frontend sends the cleanedFormData object directly as the request body.
      const newPlanData = req.body;
      // -----------------------------------------------------------

      console.log("Received data for new plan:", newPlanData);

    // Basic validation: Check if newPlanData exists and has a 'plan' name.
    // 'plan' is assumed to be a required field for an investment plan.
    if (!newPlanData || !newPlanData.plan || Object.keys(newPlanData).length === 0) {
      return res
        .status(400)
        .json({ message: "Missing essential plan data (e.g., 'plan' name is required).", success: false });
    }

    // --- Firestore Interaction ---
    // Reference to the MANAGE_PLAN collection
    // IMPORTANT: Ensure 'MANAGE_PLAN' is the correct and consistent collection name
    // across all your frontend fetching and other API routes (deletePlan, editPlan).
    const plansCollectionRef = collection(db, "MANAGE_PLAN");

    // Add the new plan document to Firestore.
    // addDoc automatically generates a unique ID for the new document.
    const docRef = await addDoc(plansCollectionRef, newPlanData);

    // Optional: Update the newly created document to include its own ID as 'plan_id'
    // This is good practice if you want the Firestore document ID stored within the document itself.
    // We merge to avoid overwriting the entire document if `newPlanData` is incomplete.
    await setDoc(docRef, { plan_id: docRef.id }, { merge: true });

    console.log("New plan added to Firestore with ID:", docRef.id);

    return res.status(201).json({ // Use 201 Created status for successful resource creation
      message: "Plan added successfully!",
      success: true,
      newPlanId: docRef.id, // Return the newly created document ID
      data: { ...newPlanData, plan_id: docRef.id }, // Return the full data, including the new ID
    });
  } catch (error) {
    console.error("Error adding new plan to Firestore:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
}
