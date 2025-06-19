// pages/dashboard/investments.js
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa"; // "+" icon for the Add button
import EditPlanModal from "../Utils/EditPlanModal"; // Import EditPlanModal
import AddPlanModal from "../Utils/AddPlanModal"; // Import AddPlanModal
import { useFirebase } from "@/lib/firebaseContext";
import Notification from "../Notifications/notifications";

const InvestmentPlans = () => {
  const [showEditModal, setShowEditModal] = useState(false); // State for Edit modal
  const [showAddModal, setShowAddModal] = useState(false); // State for Add modal
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { managePlans } = useFirebase();
  const [plans, setPlans] = useState(managePlans);

  // Handle showing modal for adding a new plan
  const handleAddPlan = () => {
    setShowAddModal(true); // Show the dedicated add modal
  };

  // Handle showing modal for editing a plan
  const handleEditPlan = (plan) => {
    setSelectedPlan(plan); // Set the selected plan to be edited
    setShowEditModal(true); // Show the dedicated edit modal
  };

  const handleUpdatePlan = (updatedPlan) => {
    // WORK HERRRRRRRREEEEE
    alert("Plan updated successfully (local):", updatedPlan.plan_id);
    setShowEditModal(false);
    <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
  };

  // Handle adding a new plan to local state
  const handleAddNewPlan = (newPlan) => {
    // WORK HERRRRRRRREEEEE
    console.log(
      "New plan added (local) with temporary ID:",
      // newPlanWithId.plan_id
    );
    <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
    // setShowAddModal(false); // Close add modal after adding
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Investment Plans
        </h1>
        <button
          onClick={handleAddPlan}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700 transition duration-300"
        >
          <FaPlus />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Investment Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No plans available.
          </p>
        ) : (
          plans.map((plan, index) => (
            // Using plan.plan_id for key, falling back to index if not present
            <div
              key={plan.plan_id || index}
              className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {plan.plan}
                    </div>
                    <div className="text-md text-gray-500">{plan.subTitle}</div>
                  </div>
                </div>
                <p className="text-gray-700 mt-2 text-sm">{plan.description}</p>
                <div className="mt-4">
                  <div className="text-lg font-semibold text-gray-800">
                    Price: {plan.price}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    ROI: {plan.roi}
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-gray-600 text-sm">
                  {plan.highlights &&
                    plan.highlights.map((highlight, hIndex) => (
                      <li key={hIndex} className="flex items-center">
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {highlight}
                      </li>
                    ))}
                </ul>
                {plan.points && plan.points.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Key Features:
                    </h4>
                    <ul className="space-y-1 text-gray-600 text-sm">
                      {plan.points.map((point, pIndex) => (
                        <li
                          key={pIndex}
                          className={`flex items-center ${
                            point.enabled ? "" : "text-gray-400 line-through"
                          }`}
                        >
                          <svg
                            className={`h-4 w-4 mr-2 ${
                              point.enabled ? "text-green-500" : "text-gray-400"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {point.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="w-full bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition duration-300 text-sm"
                >
                  Edit
                </button>
                {!plan.enabled && (
                  <p className="text-red-500 text-sm mt-2">
                    Currently unavailable
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Adding New Plan */}
      {showAddModal && (
        <AddPlanModal
          onSubmit={handleAddNewPlan}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Modal for Editing Existing Plan */}
      {showEditModal && selectedPlan && (
        <EditPlanModal
          plan={selectedPlan}
          onSubmit={handleUpdatePlan}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default InvestmentPlans;
