// pages/Utils/EditPlanModal.js
import React, { useState, useEffect } from "react";
import PlanFormFields from "./PlansFormField";

const EditPlanModal = ({ plan, onSubmit, onClose }) => {
  // Initialize formData with the provided plan (always present for editing)
  const [formData, setFormData] = useState(plan);

  // Update formData when the 'plan' prop changes (e.g., when editing a different plan)
  useEffect(() => {
    setFormData(plan);
  }, [plan]);

  const handleSubmit = async (e) => { // Added 'e' parameter to receive event
    e.preventDefault(); // Prevent default form submission behavior

    const cleanedFormData = {
      ...formData,
      highlights: formData.highlights.filter((h) => h.trim() !== ""),
      points: formData.points.filter((p) => p.text.trim() !== ""),
    };

    try {
      const response = await fetch("/api/plans/editPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedFormData), // Send cleanedFormData directly
      });

      if (!response.ok) {
        // Log the actual response status and text for better debugging
        console.error("Error editing plan:", response.status, response.statusText);
        // Consider throwing an error or setting a state for user notification
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Plan updated successfully!"); // Changed "added" to "updated"
      // Optionally, get response data if your API returns something useful
      // const result = await response.json();
      // console.log(result);

      onSubmit(cleanedFormData); // Call the onSubmit prop only after successful API call
      onClose(); // Close the modal after successful submission
    } catch (err) {
      console.error("Error submitting plan edit:", err); // More descriptive error message
      // You might want to show a notification to the user here
    }
  };

  const handleFormChange = (updatedPlanData) => {
    setFormData(updatedPlanData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Edit Investment Plan
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <form
          onSubmit={handleSubmit} // Form's onSubmit will now call handleSubmit
          className="mt-4 max-h-[65vh] md:max-h-[65vh] overflow-y-auto pr-2"
        >
          <PlanFormFields
            plan={formData}
            onChange={handleFormChange}
            isNewPlan={false}
          />
          {/* Moved submit buttons inside the form so that type="submit" works naturally */}
          <div className="w-full mt-6 flex justify-end space-x-2 lg:space-x-3">
            <button
              type="button" // Use type="button" for cancel to prevent form submission
              onClick={onClose}
              className="w-[50%] px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit" // This button will now trigger the form's onSubmit
              className="w-[50%] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal; // Resolved to the correct export