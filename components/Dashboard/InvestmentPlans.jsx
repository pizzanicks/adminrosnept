// components/Dashboard/InvestmentPlans.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
// Path to EditPlanModal: From components/Dashboard/InvestmentPlans.jsx
// -> ../ (up to components/)
// -> Utils/ (down to Utils/)
// -> EditPlanModal.jsx
import Modal from '../Utils/EditPlanModal.jsx'; // <--- VERIFY THIS PATH AND .jsx/.js EXTENSION

// Imports for Firebase and Notifications:
import { collection, onSnapshot } from 'firebase/firestore';
// Path to Firebase: From components/Dashboard/InvestmentPlans.jsx
// -> ../ (up to components/)
// -> ../ (up to project root)
// -> lib/ (down to lib/)
import db from '../../lib/firebase'; // <--- VERIFY THIS PATH

// Path to Notification: From components/Dashboard/InvestmentPlans.jsx
// -> ../ (up to components/)
// -> Notifications/ (down to Notifications/)
// -> notifications.jsx (the file itself)
import Notification from '../Notifications/notifications.jsx'; // <--- VERIFY THIS PATH AND .jsx/.js EXTENSION

import { motion, AnimatePresence } from 'framer-motion';


const InvestmentPlans = () => { // This component manages the *definitions* of your investment plans
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPageNotification, setShowPageNotification] = useState(false);
  const [pageNotificationType, setPageNotificationType] = useState('');
  const [pageNotificationMessage, setPageNotificationMessage] = useState('');


  // useEffect to FETCH PLANS FROM FIREBASE
  useEffect(() => {
    setLoadingPlans(true);

    // Using 'MANAGE_PLAN' as the collection name for plan definitions
    const plansCollectionRef = collection(db, 'MANAGE_PLAN'); // <--- USING MANAGE_PLAN AS CONFIRMED

    const unsubscribe = onSnapshot(plansCollectionRef, (snapshot) => {
      try {
        const fetchedPlans = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlans(fetchedPlans);
        setLoadingPlans(false);
      } catch (error) {
        console.error("Error fetching investment plans in real-time:", error);
        setPageNotificationType('error');
        setPageNotificationMessage('Failed to load investment plans in real-time.');
        setShowPageNotification(true);
        setLoadingPlans(false);
      }
    }, (error) => {
      console.error("Error setting up onSnapshot listener:", error);
      setPageNotificationType('error');
      setPageNotificationMessage('Failed to subscribe to real-time plan updates.');
      setShowPageNotification(true);
      setLoadingPlans(false);
    });

    return () => unsubscribe();
  }, []);


  const handleAddPlan = () => {
    setSelectedPlan(null); // No plan selected means adding a new one
    setShowModal(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan); // Set the plan to be edited
    setShowModal(true);
  };

  const handleUpdatePlan = (updatedPlan) => {
    // onSnapshot will update state, but this provides immediate feedback
    setPlans(prevPlans =>
      prevPlans.map(plan => (plan.id === updatedPlan.id ? updatedPlan : plan))
    );
    setShowModal(false);
    setPageNotificationType('success');
    setPageNotificationMessage('Plan successfully updated!');
    setShowPageNotification(true);
  };

  const handleAddNewPlan = (newPlan) => {
    // onSnapshot will update state, but this provides immediate feedback
    setPlans(prevPlans => [...prevPlans, { ...newPlan, id: newPlan.id || Date.now().toString() }]);
    setShowModal(false);
    setPageNotificationType('success');
    setPageNotificationMessage('New plan added successfully!');
    setShowPageNotification(true);
  };

  const handlePlanDeleted = (deletedPlanId) => {
    // onSnapshot will update state, but this provides immediate feedback
    setPlans(prevPlans => prevPlans.filter(plan => plan.id !== deletedPlanId));
    setShowModal(false);
    setPageNotificationType('success');
    setPageNotificationMessage('Plan successfully deleted!');
    setShowPageNotification(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence>
          {loadingPlans && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 rounded-2xl"
              >
                  <div className="w-8 lg:w-12 h-8 lg:h-12 rounded-full animate-spin border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-purple-500 shadow-lg"></div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Page-level Notification */}
      {showPageNotification && (
          <Notification
              type={pageNotificationType}
              message={pageNotificationMessage}
              onClose={() => setShowPageNotification(false)}
              show={showPageNotification}
          />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Investment Plans</h1>
        <button
          onClick={handleAddPlan}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          disabled={loadingPlans} // Disable button while plans are loading initially
        >
          <FaPlus />
          <span>Add Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingPlans ? (
            <p className="text-gray-500">Loading investment plans...</p>
        ) : plans.length === 0 ? (
            <p className="text-gray-500">No investment plans found.</p>
        ) : (
            plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6">
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
            ))
        )}
      </div>

      {showModal && (
        <Modal
          plan={selectedPlan}
          onSubmit={selectedPlan ? handleUpdatePlan : handleAddNewPlan}
          onClose={() => setShowModal(false)}
          onDelete={handlePlanDeleted}
        />
      )}
    </div>
  );
};

export default InvestmentPlans;
