// pages/Utils/AddPlanModal.js
import React, { useState } from "react";
import PlanFormFields from "./PlansFormField";

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

    const handleSubmit = async () => {
      
        const cleanedFormData = {
        ...formData,
        highlights: formData.highlights.filter((h) => h.trim() !== ""),
        points: formData.points.filter((p) => p.text.trim() !== ""),
        };
      console.log("data:", cleanedFormData);
      
      try {
          const response = await fetch("/api/plans/addNewPlan", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cleanedFormData
              }),
          });

          if (!response.ok) {
              console.log("error adding new plan:");
          }
          console.log("Plan added successfully!");
          
      } catch (err) {
          console.log("err:", err);
      }
        
        onSubmit(cleanedFormData);
  };

  const handleFormChange = (updatedPlanData) => {
    setFormData(updatedPlanData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Add New Investment Plan
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
            isNewPlan={true}
          />
        </form>

        <div className="w-full mt-6 flex justify-end space-x-2 lg:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-[50%] px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-[50%] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlanModal;
