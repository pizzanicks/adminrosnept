// pages/Utils/AddPlanModal.js
'use client'; // Assuming it needs to be a client component

import React, { useState } from "react";
import PlanFormFields from "./PlansFormField.jsx"; // Assuming .jsx extension for consistency
import { motion, AnimatePresence } from 'framer-motion'; // For loading spinner animation
import Notification from "../Notifications/notifications";
// import Notification from '../Notifications/notifications.jsx'; // <--- VERIFY THIS PATH ON YOUR FILE SYSTEM

const AddPlanModal = ({ onSubmit, onClose }) => {
  // Initialize formData with a complete default structure for a new plan
  const [formData, setFormData] = useState({
    plan: "",
    subTitle: "",
    description: "",
    price: "",
    roi: "",
    highlights: ["", ""], // Start with a couple of empty highlight fields
    points: [
      { text: "", enabled: true }, // Start with a couple of empty point fields
      { text: "", enabled: true },
    ],
    cta: "Get Started", // Default CTA
    enabled: true, // Default to enabled
    barColor: "bg-gray-500", // Default color
    buttonStyle: "bg-blue-600 text-white hover:bg-blue-700 transition", // Default style
    min: 0,
    max: 0,
  });

  // --- START: New states for loading and notifications ---
  const [loading, setLoading] = useState(false); // Manages loading state for API calls
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState(''); // 'success' or 'error'
  const [notificationMessage, setNotificationMessage] = useState('');
  // --- END: New states ---

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)

    setLoading(true); // Set loading to true when starting the submission

    const cleanedFormData = {
      ...formData,
      highlights: formData.highlights.filter((h) => h.trim() !== ""),
      points: formData.points.filter((p) => p.text.trim() !== ""),
    };

    console.log("data:", cleanedFormData); // For debugging purposes

    try {
      const response = await fetch("/api/plans/addNewPlan", { // Ensure this API route exists
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedFormData), // <--- CORRECTED: Send cleanedFormData directly
      });

      if (!response.ok) {
        // If response is not OK (e.g., 400, 500), parse error and show notification
        const errorData = await response.json(); // Try to parse error response from API
        console.error("Error adding new plan:", response.status, response.statusText, errorData);
        setNotificationType('error');
        setNotificationMessage(`Failed to add plan: ${errorData.message || 'Server error'}`);
        setShowNotification(true);
        return; // Exit function if API call failed
      }

      // If successful:
      console.log("Plan added successfully!");
      setNotificationType('success');
      setNotificationMessage('Plan added successfully!');
      setShowNotification(true);

      onSubmit(cleanedFormData); // Notify parent component about the new plan
      onClose(); // Close the modal
    } catch (err) {
      // Catch any network errors or unexpected errors
      console.error("Error adding plan:", err);
      setNotificationType('error');
      setNotificationMessage('An unexpected error occurred while adding the plan.');
      setShowNotification(true);
    } finally {
      // This block always executes, regardless of try or catch outcome
      setLoading(false); // Ensure loading is set to false
    }
  };

  const handleFormChange = (updatedPlanData) => {
    setFormData(updatedPlanData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
        {/* Loading Spinner overlay - shows when 'loading' is true */}
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

        {/* Notification component */}
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
            Add New Investment Plan
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading} // Disable close button while loading
          >
            &times;
          </button>
        </div>
        <form
          onSubmit={handleSubmit} // Form submission triggers handleSubmit
          className="mt-4 max-h-[65vh] md:max-h-[65vh] overflow-y-auto pr-2"
        >
          <PlanFormFields
            plan={formData}
            onChange={handleFormChange}
            isNewPlan={true}
            disabled={loading} // Disable form fields while loading
          />

          <div className="w-full mt-6 flex justify-end space-x-2 lg:space-x-3">
            <button
              type="button" // Important: type="button" to prevent form submission
              onClick={onClose}
              className="w-[50%] px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              disabled={loading} // Disabled while loading
            >
              Cancel
            </button>
            <button
              type="submit" // Will trigger form's onSubmit (handleSubmit)
              // onClick={handleSubmit} // Removed redundant onClick here, form's onSubmit handles it
              className="w-[50%] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading} // Disabled while loading
            >
              Add Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlanModal;
