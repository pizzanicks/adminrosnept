// pages/api/editPlan.js

import { doc, setDoc } from "firebase/firestore";
import db from "@/lib/firebase"; // Assuming you have a file at this path exporting your Firestore db instance

export default async function handler(req, res) {
  // Only allow POST requests for updating plans
  if (req.method !== "POST") {
    console.warn(`WARNING: Method ${req.method} not allowed for /api/editPlan. Only POST is supported.`);
    return res
      .status(405)
      .json({ message: "Method Not Allowed", success: false });
  }

  try {
    const updatedPlanData = req.body; // Correctly gets the full object sent from frontend
    console.log("INFO: Received data for plan update:", updatedPlanData); // Log incoming data

    // Validate that 'id' or 'plan_id' exists in the received data
    // The frontend should send 'id' which is the Firestore document ID.
    const planId = updatedPlanData.id || updatedPlanData.plan_id; // Prefer 'id' but fallback to 'plan_id'

    console.log("INFO: Derived Plan ID for Firestore:", planId); // Log the ID being used

    if (!planId) {
      console.error("ERROR: Missing 'id' or 'plan_id' in update request body. Cannot identify document to update.");
      return res.status(400).json({
        message: "Missing plan ID in request for update.",
        success: false,
      });
    }

    // IMPORTANT: Ensure "MANAGE_PLAN" is the correct collection name
    // This collection name must be consistent with your add and delete APIs
    const planDocRef = doc(db, "MANAGE_PLAN", planId);
    console.log(`INFO: Attempting to update document with ID: '${planId}' in collection: 'MANAGE_PLAN'.`);

    // setDoc with merge:true will update existing fields and add new ones.
    // This is generally safe for updates as it won't delete fields not included in updatedPlanData.
    await setDoc(planDocRef, updatedPlanData, { merge: true });

    console.log(`SUCCESS: Plan with ID '${planId}' updated successfully in Firestore.`);

    return res.status(200).json({
      message: "Plan updated successfully!",
      success: true,
      updatedPlanId: planId,
      data: updatedPlanData, // Return the data that was successfully saved
    });
  } catch (error) {
    console.error("CRITICAL ERROR: Failed to update plan:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: error.message,
    });
  }
}
