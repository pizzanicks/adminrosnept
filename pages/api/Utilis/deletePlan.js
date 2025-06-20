// pages/api/Utilis/deletePlan.js

import { doc, deleteDoc } from 'firebase/firestore';
// Import your Firebase database instance.
// This path assumes:
// - You are currently in 'pages/api/Utilis/'
// - You need to go up three levels to the project root (../../..)
// - Then go down into the 'lib/' folder
// - And finally, import 'firebase.js'
import db from '../../../lib/firebase'; // <--- VERIFY THIS PATH ON YOUR FILE SYSTEM

/**
 * API route to handle deletion of an investment plan.
 * This route expects a DELETE request with the 'id' of the plan in its body.
 */
export default async function handler(req, res) {
  console.log("DELETE /api/Utilis/deletePlan API route hit."); // Log when API is accessed

  // Ensure the request method is DELETE
  if (req.method === 'DELETE') {
    try {
      // Extract the 'id' from the request body.
      // The client-side (EditPlanModal) will send `{ id: plan.id }`.
      const { id } = req.body;
      console.log("Received ID for deletion:", id); // Log the ID being processed

      // Basic validation: Check if an ID was provided
      if (!id) {
        console.error("Error: Plan ID is missing from request body.");
        return res.status(400).json({ message: 'Plan ID is required for deletion.' });
      }

      // Create a reference to the specific document in your Firestore collection.
      // Using 'MANAGE_PLAN' as the collection name, as confirmed.
      const planRef = doc(db, 'MANAGE_PLAN', id);
      console.log(`Attempting to delete document with ID: ${id} from collection: MANAGE_PLAN`);

      // Delete the document from Firestore
      await deleteDoc(planRef);

      console.log("Plan deleted successfully from Firestore.");
      // Send a success response back to the client
      res.status(200).json({ message: `Plan with ID ${id} deleted successfully!` });

    } catch (error) {
      // Log any errors that occur during the deletion process
      console.error('Full Error deleting plan:', error); // Log full error object
      // Send an error response back to the client
      res.status(500).json({ message: 'Failed to delete plan.', error: error.message });
    }
  } else {
    // If any method other than DELETE is used, send a 405 Method Not Allowed response
    console.warn(`Method ${req.method} not allowed for /api/Utilis/deletePlan.`);
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
