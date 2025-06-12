'use client';

import React, { useState } from 'react';
import DetailRow from '../Utils/DetailRow';
import Notification from '../Notifications/notifications';
import { useFirebase } from '@/lib/firebaseContext';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';


const WithdrawalRequests = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');
  const { allWithdrawReq } = useFirebase();
  const [confirmApproveAction, setConfirmApproveAction] = useState(false);
  const [confirmDeclineAction, setConfirmDeclineAction] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  const approveTransaction = async () => {
    setApproving(true);
    try {
        const response = await fetch('/api/approveWithdrawal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedReq }),
        });

        if (!response.ok) throw new Error('Failed to approve withdrawal');

        await response.json();
        
        setNotificationMessage('Withdrawal approved successfully.');
        setNotificationType('success');
        setShowNotification(true);
        setApproving(false);
        setConfirmApproveAction(false);
        setTimeout(() => {
            setShowNotification(false);
        }, 5000);

    } catch (error) {
        console.error(error);

        setNotificationMessage('An error occurred while approving the withdrawal.');
        setNotificationType('error');
        setShowNotification(true);
        setApproving(false);
        setConfirmApproveAction(false);
        setTimeout(() => {
            setShowNotification(false);
        }, 5000);

    } finally {
      setApproving(false);
    }
  };

  const declineTransaction = async () => {
    setDeclining(true);
    try {
      const response = await fetch('/api/declineWithdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedReq }),
      });

      if (!response.ok) throw new Error('Failed to decline withdrawal');

      await response.json();

      setNotificationMessage('Withdrawal declined successfully.');
      setNotificationType('success');
      setShowNotification(true);
      setDeclining(false);
      setConfirmDeclineAction(false);
      setTimeout(() => {
          setShowNotification(false);
      }, 5000);

    } catch (error) {
      console.error(error);
      setNotificationMessage('An error occurred while declining the withdrawal.');
      setNotificationType('error');
      setShowNotification(true);
      setDeclining(false);
      setTimeout(() => {
          setShowNotification(false);
      }, 5000);

    } finally {
      setDeclining(false);
    }
  };

  const renderStatus = (status) => {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
        status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
        status === 'completed' ? 'bg-green-100 text-green-700' :
        'bg-red-100 text-red-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-lg lg:text-2xl font-bold text-blue-900 mb-6">Withdrawal Requests</h1>

      {/* Desktop */}
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
            {allWithdrawReq?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(req => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap">{req?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">${(Number(req?.amount) || 0).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{req?.selectedWallet?.method}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderStatus(req?.status)}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setViewModal(false);
                      setConfirmApproveAction(true);
                    }}
                    disabled={req.status !== 'pending'}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      req.status === 'pending' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setViewModal(false);
                      setConfirmDeclineAction(true);
                    }}
                    disabled={req.status !== 'pending'}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      req.status === 'pending' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setViewModal(true);
                    }}
                    className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="block md:hidden space-y-4">
        {allWithdrawReq?.map(req => (
          <div key={req.id} className="bg-white p-4 rounded shadow-sm border">
            <h2 className="font-semibold text-blue-900">{req.name}</h2>
            <div className="space-y-2 my-3">
              <DetailRow label="Amount" value={`$${(Number(req.amount) || 0).toLocaleString()}`} />
              <DetailRow label="Method" value={req?.selectedWallet?.method} />
              <DetailRow label="Date" value={new Date(req.createdAt).toLocaleDateString()} />
              <DetailRow label="Status" value={renderStatus(req.status)} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedReq(req);
                  setViewModal(false); // Add this
                  setConfirmApproveAction(true);
                }}
                disabled={req.status !== 'pending'}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                  req.status === 'pending' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400'
                }`}>
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedReq(req);
                  setViewModal(false); // Add this
                  setConfirmDeclineAction(true);
                }}
                disabled={req.status !== 'pending'}
                className={`flex-1 px-3 py-2 rounded text-xs font-medium ${
                  req.status === 'pending' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-400'
                }`}>
                Decline
              </button>
              <button
                onClick={() => setSelectedReq(req)}
                className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Approve Confirmation */}
      {confirmApproveAction && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-80">
            <FiAlertCircle className="text-yellow-500 text-4xl mb-4 mx-auto" />
            <p className="text-center mb-6">Approve this withdrawal?</p>
            <div className="w-full flex gap-2 justify-between">
              <button onClick={() => setConfirmApproveAction(false)} className="w-[50%] border px-4 py-2 text-sm font-medium rounded">Cancel</button>
              <button onClick={approveTransaction} className="w-[50%] text-sm font-medium flex justify-center items-center bg-green-600 text-white px-4 py-2 rounded">
                {approving ? (
                  <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                ) : (
                  <div className="text-white text-center h-6">Proceed</div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Confirmation */}
      {confirmDeclineAction && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-80">
            <FiAlertCircle className="text-red-500 text-4xl mb-4 mx-auto" />
            <p className="text-center mb-6">Decline this withdrawal?</p>
            <div className="w-full flex gap-2 justify-between">
              <button onClick={() => setConfirmDeclineAction(false)} className="w-[50%] text-sm font-medium border px-4 py-2 rounded">Cancel</button>
              <button onClick={declineTransaction} className="w-[50%] text-sm font-medium flex justify-center items-center bg-red-600 text-white px-4 py-2 rounded">
                {declining ? (
                  <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                ) : (
                  <div className="text-white text-center h-6">Proceed</div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReq && viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4">
          <div className="bg-white w-full max-w-lg p-6 lg:p-10 shadow-xl relative rounded-xl">
            <button
              onClick={() => setSelectedReq(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <FaUserCircle className="text-5xl text-gray-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selectedReq?.name}</h2>
                {/* <p className="text-sm text-gray-500">{selectedReq?.selectedWallet?.method}</p> */}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <DetailRow label="Amount" value={`$${(Number(selectedReq.amount) || 0).toLocaleString()}`} />
              <DetailRow label="Method" valueClassName='capitalize' value={selectedReq.selectedWallet?.method} />
              <DetailRow label="Currency" valueClassName='capitalize' value={selectedReq.selectedWallet.currency} />
              <DetailRow label="Wallet Address" value={selectedReq.selectedWallet?.walletAddress} />
              <DetailRow label="Requested On" value={new Date(selectedReq.createdAt).toLocaleDateString()} />
              <DetailRow
                label="Status"
                valueClassName={`capitalize px-4 py-1 rounded-full text-sm font-medium ${
                  selectedReq.status === 'completed'
                    ? 'text-green-700 bg-green-100'
                    : selectedReq.status === 'pending'
                    ? 'text-yellow-700 bg-yellow-100'
                    : selectedReq.status === 'declined'
                    ? 'text-red-700 bg-red-100'
                    : ''
                }`}
                value={selectedReq.status}
              />

            </div>
          </div>
        </div>
      )}

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

export default WithdrawalRequests;
