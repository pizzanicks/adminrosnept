// pages/dashboard/investments.js
import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa'; // "+" icon for the Add button
import { plans } from '../data/plans';
import Modal from '../Utils/EditPlanModal';

const InvestmentPlans = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Handle showing modal for adding a new plan
  const handleAddPlan = () => {
    setSelectedPlan(null); // Reset selected plan for adding a new plan
    setShowModal(true);
  };

  // Handle showing modal for editing a plan
  const handleEditPlan = (plan) => {
    setSelectedPlan(plan); // Set the selected plan to be edited
    setShowModal(true);
  };

  // Handle updating a plan
  const handleUpdatePlan = (updatedPlan) => {
    const updatedPlans = plans.map((plan) =>
      plan.plan === updatedPlan.plan ? updatedPlan : plan
    );
    setPlans(updatedPlans);
    setShowModal(false); // Close modal after updating
  };

  // Handle adding a new plan
  const handleAddNewPlan = (newPlan) => {
    setPlans([...plans, newPlan]);
    setShowModal(false); // Close modal after adding
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Investment Plans</h1>
        <button
          onClick={handleAddPlan}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <FaPlus />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Investment Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xl font-bold">{plan.plan}</div>
                <div className="text-md text-gray-500">{plan.subTitle}</div>
              </div>
              <button
                onClick={() => handleEditPlan(plan)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
              >
                Edit
              </button>
            </div>
            <p className="text-gray-700 mt-4">{plan.description}</p>
          </div>
        ))}
      </div>

      {/* Modal for Adding/Editing Plan */}
      {showModal && (
        <Modal
          plan={selectedPlan}
          onSubmit={selectedPlan ? handleUpdatePlan : handleAddNewPlan}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default InvestmentPlans;
