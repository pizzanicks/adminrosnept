'use client';

import React, { useState, useMemo } from 'react';
import DetailRow from '../Utils/DetailRow';
import Notification from '../Notifications/notifications';
import { useFirebase } from '@/lib/firebaseContext';
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const DepositRequests = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');
  const { allDepositReq } = useFirebase();
  const [confirmApproveAction, setConfirmApproveAction] = useState(false);
  const [confirmDeclineAction, setConfirmDeclineAction] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const approveTransaction = async () => {
    console.log("selectedReq to approve:", selectedReq);
    setApproving(true);
    
    try {
      const response = await fetch('/api/approveTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedReq }),
      });
  
      if (!response.ok) {
        setNotificationMessage('Failed to approve transaction.');
        setNotificationType('error');
        setShowNotification(true);
        setApproving(false);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
  
        return;
      }
  
      const data = await response.json();
  
      setNotificationMessage('Transaction approved successfully.');
      setNotificationType('success');
      setShowNotification(true);
      setApproving(false);
      setConfirmApproveAction(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error approving transaction:', error);
      setNotificationMessage('An error occurred while approving the transaction.');
      setNotificationType('error');
      setShowNotification(true);
      setApproving(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const declineTransaction = async () => {
    console.log("selectedReq to decline:", selectedReq);
    setDeclining(true);

    try {
      const response = await fetch('/api/declineTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedReq }),
      });
  
      if (!response.ok) {
        setNotificationMessage('Failed to decline transaction.');
        setNotificationType('error');
        setShowNotification(true);
        setDeclining(false);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
  
        return;
      }
  
      const data = await response.json();
  
      setNotificationMessage('Transaction declined successfully.');
      setNotificationType('success');
      setShowNotification(true);
      setDeclining(false);
      setConfirmDeclineAction(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error declining transaction:', error);
      setNotificationMessage('An error occurred while declining the transaction.');
      setNotificationType('error');
      setShowNotification(true);
      setDeclining(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const formatFirestoreDate = (dateValue) => {
    if (!dateValue || !dateValue.toDate) return "N/A";
    return dateValue.toDate().toLocaleDateString();
  };
  
  const filteredRequests = useMemo(() => {
    if (!allDepositReq) return [];
    return allDepositReq.filter(req => 
      req.userId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (req.selectedWallet?.method && req.selectedWallet?.method.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.amount && String(req.amount).toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allDepositReq, searchQuery]);

  // Handle loading state
  if (!allDepositReq) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-lg lg:text-2xl font-bold text-blue-900 mb-6">Deposit Requests</h1>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by User ID, Amount or Method"
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto bg-white shadow-sm rounded border">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">User ID</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Method</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
            {filteredRequests?.length === 0 ? (
                <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">No deposit requests found.</td>
                </tr>
            ) : (
                filteredRequests
                .slice()
                .sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()))
                .map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">{req?.userId ?? 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${(Number(req?.amount) || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{req?.selectedWallet?.method ?? 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {formatFirestoreDate(req.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                                    ${req?.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
                                    ${req?.status === "completed" ? "bg-green-100 text-green-700" : ""}
                                    ${req?.status === "declined" ? "bg-red-50 text-red-700" : ""}
                                `}
                            >
                                {req?.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                            <button
                                onClick={() => {
                                    setSelectedReq(req);
                                    setConfirmApproveAction(true);
                                }}
                                disabled={req?.status !== "pending"}
                                className={`px-3 py-1 rounded text-xs font-medium transition
                                    ${req?.status === "pending" 
                                        ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer" 
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedReq(req);
                                    setConfirmDeclineAction(true);
                                }}
                                disabled={req?.status !== "pending"}
                                className={`px-3 py-1 rounded text-xs font-medium transition
                                    ${req?.status === "pending" 
                                        ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer" 
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                            >
                                Decline
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4">
          {filteredRequests?.length === 0 ? (
            <p className="text-gray-500 text-center p-8">No deposit requests found.</p>
          ) : (
            filteredRequests
            .slice()
            .sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()))
            .map((req) => (
              <div key={req.id} className="bg-white shadow-sm rounded p-4 border">
                <h2 className="text-base font-semibold text-blue-900 mb-2">User ID: {req?.userId ?? 'N/A'}</h2>

                <div className="space-y-2 mb-4">
                  <DetailRow label="Amount" value={`$${(Number(req.amount) || 0).toLocaleString()}`} />
                  <DetailRow label="Method" value={req?.selectedWallet?.method ?? 'N/A'} />
                  <DetailRow label="Date" value={formatFirestoreDate(req.createdAt)} />
                  <DetailRow
                    label="Status"
                    value={
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                          ${req?.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
                          ${req?.status === "completed" ? "bg-green-100 text-green-700" : ""}
                          ${req?.status === "declined" ? "bg-red-100 text-red-700" : ""}
                        `}
                      >
                        {req?.status}
                      </span>
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setConfirmApproveAction(true);
                    }}
                    disabled={req?.status !== "pending"}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition
                      ${req?.status === "pending" 
                        ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setConfirmDeclineAction(true);
                    }}
                    disabled={req?.status !== "pending"}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition
                      ${req?.status === "pending" 
                        ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirmApproveAction && 
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-md p-6 w-80 max-w-full shadow-lg flex flex-col items-center"
            >
              <FiAlertCircle className="text-yellow-500 text-4xl mb-4" />
              <p className="mb-6 text-gray-800 font-medium text-center">Are you sure you want to approve this transaction?</p>
              <div className="flex justify-end space-x-2 w-full">
                <button
                  onClick={() => {
                    setConfirmApproveAction(false);
                    setSelectedReq(null);
                  }}
                  className="w-[50%] px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={approveTransaction}
                  disabled={approving}
                  className="w-[50%] flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white transition"
                >
                  {approving ? (
                    <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                  ) : (
                    <div className="text-white text-center h-6">Proceed</div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeclineAction && 
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-md p-6 w-80 max-w-full shadow-lg flex flex-col items-center"
            >
              <FiAlertCircle className="text-yellow-500 text-4xl mb-4" />
              <p className="mb-6 text-gray-800 font-medium text-center">Are you sure you want to decline this transaction?</p>
              <div className="flex justify-end space-x-2 w-full">
                <button
                  onClick={() => {
                    setConfirmDeclineAction(false);
                    setSelectedReq(null);
                  }}
                  className="w-[50%] px-4 py-2 rounded-md border text-sm font-medium border-gray-300 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={declineTransaction}
                  disabled={declining}
                  className="w-[50%] flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white transition"
                >
                  {declining ? (
                    <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                  ) : (
                    <div className="text-white text-center h-6">Proceed</div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {showNotification && (
        <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
      )}
    </div>
  );
};

export default DepositRequests;
