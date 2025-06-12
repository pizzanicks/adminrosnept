'use client';

import React, { useState } from 'react';
import DetailRow from '../Utils/DetailRow';
import Notification from '../Notifications/notifications';
import { useFirebase } from '@/lib/firebaseContext';
import { FiAlertCircle } from 'react-icons/fi';

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

  const approveTransaction = async () => {

    console.log("slectreqq:", selectedReq);
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

    console.log("slectreqq:", selectedReq);
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-lg lg:text-2xl font-bold text-blue-900 mb-6">Deposit Requests</h1>

      <div className="space-y-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto bg-white shadow-sm rounded border">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">User</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Method</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
            {allDepositReq
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{req?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${(Number(req?.amount) || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{req?.selectedWallet.method}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.createdAt?.toDate
                      ? req.createdAt.toDate().toLocaleDateString()
                      : new Date(req.createdAt).toLocaleDateString()}
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
            {allDepositReq
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((req) => (
            <div key={req.id} className="bg-white shadow-sm rounded p-4 border">
              <h2 className="text-base font-semibold text-blue-900 mb-2">{req?.name}</h2>

              <div className="space-y-2 mb-4">
                <DetailRow label="Amount" value={`$${(Number(req.amount) || 0).toLocaleString()}`} />
                <DetailRow label="Method" value={req?.selectedWallet.method} />
                <DetailRow label="Date" value={req.createdAt?.toDate
                      ? req.createdAt.toDate().toLocaleDateString()
                      : new Date(req.createdAt).toLocaleDateString()} />
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
          ))}
        </div>
      </div>

      {confirmApproveAction && 
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-80 max-w-full shadow-lg flex flex-col items-center">
            <FiAlertCircle className="text-yellow-500 text-4xl mb-4" />
            <p className="mb-6 text-gray-800 font-medium text-center">{'Are you sure?'}</p>
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
          </div>
        </div>
      }

      {confirmDeclineAction && 
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-80 max-w-full shadow-lg flex flex-col items-center">
            <FiAlertCircle className="text-yellow-500 text-4xl mb-4" />
            <p className="mb-6 text-gray-800 font-medium text-center">{'Are you sure?'}</p>
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
          </div>
        </div>
      }

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
