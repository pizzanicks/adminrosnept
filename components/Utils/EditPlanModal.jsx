// components/Utils/EditPlanModal.jsx
'use client';

import React, { useState, useEffect } from "react";
import PlanFormFields from "./PlansFormField.jsx"; // Assuming PlansFormField.jsx is in the same 'Utils' folder
import { motion, AnimatePresence } from 'framer-motion';
import Notification from '../Notifications/notifications.jsx'; // Verify this path and .jsx/.js extension

const EditPlanModal = ({ plan, onSubmit, onClose, onDelete }) => {
  // Define an initial empty plan structure for 'Add New Plan' mode
  const initialEmptyPlan = {
    plan: "",
    subTitle: "",
    description: "",
    price: "",
    roi: "",
    highlights: ["", ""], // Start with a couple of empty highlight fields
    points: [
      { text: "", enabled: true }, // Start with a couple of empty point fieldsw
      { text: "", enabled: true },
    ],
    cta: "Get Started",
    enabled: true,
    barColor: "bg-gray-500",
    buttonStyle: "bg-blue-600 text-white hover:bg-blue-700 transition",
    min: 0,
    max: 0,
  };

  // Initialize formData with 'plan' if available (edit mode), otherwise with 'initialEmptyPlan' (add mode)
  const [formData, setFormData] = useState(plan || initialEmptyPlan);

  // Determine if it's an 'add new plan' mode or 'edit existing plan' mode
  const isNewPlanMode = !plan; // If 'plan' prop is null/undefined, it's a new plan

  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    // When the 'plan' prop changes (e.g., modal re-opens for a different plan),
    // update formData. If plan is null, use the initial empty structure.
    setFormData(plan || initialEmptyPlan);
    setLoading(false); // Ensure loading is false when modal opens or plan changes
    setShowNotification(false); // Hide notification when modal opens or plan changes
  }, [plan]); // Dependency on 'plan' prop

  const handleFormChange = (updatedPlanData) => {
    setFormData(updatedPlanData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const cleanedFormData = {
      ...formData,
      highlights: formData.highlights.filter((h) => h.trim() !== ""),
      points: formData.points.filter((p) => p.text.trim() !== ""),
      // Ensure 'id' is always included for existing plans, even if the backend expects 'plan_id'
      id: formData.id || formData.plan_id // Use 'id' from Firestore document
    };

    try {
      // --- CRITICAL FIX: Corrected API endpoint for editPlan ---
      // Now it correctly points to /api/plans/editPlan
      const apiEndpoint = isNewPlanMode ? "/api/plans/addNewPlan" : "/api/plans/editPlan"; // <--- FIXED THIS LINE!

      console.log(`Submitting to API: ${apiEndpoint} with data:`, cleanedFormData); // Added logging here!

      const method = "POST"; // Both addNewPlan and editPlan are POST

      const response = await fetch(apiEndpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error or non-JSON response from server.' }));
        console.error(`Error ${isNewPlanMode ? 'adding' : 'editing'} plan:`, response.status, response.statusText, errorData);
        setNotificationType('error');
        setNotificationMessage(`Failed to ${isNewPlanMode ? 'add' : 'update'} plan: ${errorData.message || 'Server error'}`);
        setShowNotification(true);
        return;
      }

      console.log(`Plan ${isNewPlanMode ? 'added' : 'updated'} successfully!`);
      setNotificationType('success');
      setNotificationMessage(`Plan ${isNewPlanMode ? 'added' : 'updated'} successfully!`);
      setShowNotification(true);

      onSubmit(cleanedFormData);
      onClose();
    } catch (err) {
      console.error(`Error ${isNewPlanMode ? 'adding' : 'submitting edit for'} plan:`, err);
      setNotificationType('error');
      setNotificationMessage(`An unexpected error occurred while ${isNewPlanMode ? 'adding' : 'updating'} the plan.`);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Ensuring 'plan.plan' is used for the confirmation message if 'name' is not available
    const planIdentifier = plan?.plan || plan?.name || 'this plan';
    const isConfirmed = window.confirm(`Are you sure you want to permanently delete ${planIdentifier}? This action cannot be undone.`);

    if (!isConfirmed) {
      return;
    }

    setLoading(true);

    try {
      // Confirmed API path for deletePlan
      const response = await fetch("/api/Utilis/deletePlan", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: plan.id }), // Send the plan's ID
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error or non-JSON response from server.' }));
        console.error("Error deleting plan:", response.status, response.statusText, errorData);
        setNotificationType('error');
        setNotificationMessage(`Failed to delete plan: ${errorData.message || 'Server error'}`);
        setShowNotification(true);
        return;
      }

      console.log("Plan deleted successfully!");
      setNotificationType('success');
      setNotificationMessage('Plan deleted successfully!');
      setShowNotification(true);

      if (onDelete) {
        onDelete(plan.id);
      }
      onClose();
    } catch (err) {
      console.error("Error during plan deletion:", err);
      setNotificationType('error');
      setNotificationMessage('An unexpected error occurred during plan deletion.');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-[100] rounded-md"
                >
                    <div className="w-8 lg:w-12 h-8 lg:h-12 rounded-full animate-spin border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-purple-500 shadow-lg"></div>
                </motion.div>
            )}
        </AnimatePresence>

        {showNotification && (
            <Notification
                type={notificationType}
                message={notificationMessage}
                onClose={() => setShowNotification(false)}
                show={showNotification}
            />
        )}

      <div className="relative p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white z-50">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isNewPlanMode ? "Add New Investment Plan" : "Edit Investment Plan"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            &times;
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-4 max-h-[65vh] md:max-h-[65vh] overflow-y-auto pr-2"
        >
          <PlanFormFields
            plan={formData}
            onChange={handleFormChange}
            isNewPlan={isNewPlanMode} // Pass isNewPlanMode down to PlanFormFields
            disabled={loading}
          />

          <div className="w-full mt-6 flex justify-end space-x-2 lg:space-x-3">
            {/* Conditional rendering for buttons */}
            {isNewPlanMode ? ( // If in "Add New Plan" mode
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  Add Plan
                </button>
              </>
            ) : ( // If in "Edit Investment Plan" mode
              <>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="w-[30%] px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
                    disabled={loading}
                >
                    <span>Delete Plan</span>
                </button>

                <div className="flex space-x-2 lg:space-x-3 w-[65%]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        disabled={loading}
                    >
                        Update Plan
                    </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;
