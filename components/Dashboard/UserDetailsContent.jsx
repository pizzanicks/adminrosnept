// components/Dashboard/UserDetailsContent.jsx
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import db from '../../lib/firebase';
import { AnimatePresence, motion } from 'framer-motion';
import Notification from '../Notifications/notifications';
import { FiX } from 'react-icons/fi';

export default function UserDetailsContent({ userId }) {
  const [userData, setUserData] = useState({});
  const [investmentData, setInvestmentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // --- User real-time listener ---
  useEffect(() => {
    if (!userId) return setLoading(false);
    const userRef = doc(db, 'USERS', userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setAdminNote(data.adminNote || '');
      } else {
        setNotificationType('error');
        setNotificationMessage('User not found.');
        setShowNotification(true);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setNotificationType('error');
      setNotificationMessage('Failed to load user.');
      setShowNotification(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // --- Investment real-time listener ---
  useEffect(() => {
    if (!userId) return;
    const invRef = doc(db, 'INVESTMENT', userId);
    const unsubscribeInv = onSnapshot(invRef, (snap) => {
      if (snap.exists()) {
        setInvestmentData(snap.data());
      } else {
        setInvestmentData({});
      }
    });
    return () => unsubscribeInv();
  }, [userId]);

  // --- Handlers ---
  const handleCreditUser = async () => {
    if (!amountInput) {
      setNotificationMessage('Please enter a valid amount.');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }
    
    try {
      const res = await fetch('/api/creditUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: parseFloat(amountInput) }),
      });
      
      if (res.ok) {
        setNotificationType('success');
        setNotificationMessage('Amount credited successfully.');
      } else {
        setNotificationType('error');
        setNotificationMessage('Failed to credit user.');
      }
    } catch (err) {
      console.error(err);
      setNotificationType('error');
      setNotificationMessage('Error processing request.');
    } finally {
      setShowNotification(true);
      setAmountInput('');
      setIsCreditModalOpen(false);
    }
  };

  const handleDebitUser = async () => {
    if (!amountInput) {
      setNotificationMessage('Please enter a valid amount.');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }
    
    // Check if user has sufficient balance
    if (parseFloat(amountInput) > (userData.walletBalance || 0)) {
      setNotificationMessage('Cannot debit more than wallet balance.');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }
    
    try {
      const res = await fetch('/api/debitUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: parseFloat(amountInput) }),
      });
      
      if (res.ok) {
        setNotificationType('success');
        setNotificationMessage('Amount debited successfully.');
      } else {
        setNotificationType('error');
        setNotificationMessage('Failed to debit user.');
      }
    } catch (err) {
      console.error(err);
      setNotificationType('error');
      setNotificationMessage('Error processing request.');
    } finally {
      setShowNotification(true);
      setAmountInput('');
      setIsDebitModalOpen(false);
    }
  };

  const handleRestartPlan = async () => {
    try {
      const res = await fetch('/api/restartPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (res.ok) {
        setNotificationType('success');
        setNotificationMessage('Plan restarted successfully.');
      } else {
        setNotificationType('error');
        setNotificationMessage('Failed to restart plan.');
      }
    } catch (err) {
      console.error(err);
      setNotificationType('error');
      setNotificationMessage('Error processing request.');
    } finally {
      setShowNotification(true);
      setIsRestartModalOpen(false);
    }
  };

  const toggleUserStatus = async (newStatus) => {
    try {
      const userRef = doc(db, 'USERS', userId);
      await updateDoc(userRef, { status: newStatus });
      setNotificationType('success');
      setNotificationMessage(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
    } catch (error) {
      console.error(error);
      setNotificationType('error');
      setNotificationMessage('Failed to update user status.');
    } finally {
      setShowNotification(true);
    }
  };

  const handleEarningStatusChange = async (newStatus) => {
    try {
      const userRef = doc(db, 'USERS', userId);
      await updateDoc(userRef, { earningStatus: newStatus });
      setNotificationType('success');
      setNotificationMessage(`Earnings ${newStatus === 'running' ? 'resumed' : 'paused'} successfully!`);
    } catch (error) {
      console.error(error);
      setNotificationType('error');
      setNotificationMessage('Failed to update earnings status.');
    } finally {
      setShowNotification(true);
    }
  };

  const handleAdminNoteSave = async () => {
    try {
      const userRef = doc(db, 'USERS', userId);
      await updateDoc(userRef, { adminNote });
      setNotificationType('success');
      setNotificationMessage('Admin note saved successfully!');
    } catch (error) {
      console.error(error);
      setNotificationType('error');
      setNotificationMessage('Failed to save admin note.');
    } finally {
      setShowNotification(true);
    }
  };

  if (loading) return <p className="p-4">Loading user details...</p>;
  if (!userData) return <p className="p-4 text-red-500">No user data available.</p>;

  // Calculations for investment data
  const payoutLogs = investmentData.payoutLogs || [];
  const totalRoiEarned = payoutLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
  const currentPlanDaysCompleted = userData.currentPlanDaysCompleted || 0;
  const progressPercent = (currentPlanDaysCompleted / 7) * 100;
  const nextPayment = currentPlanDaysCompleted < 7 ? `In ${7 - currentPlanDaysCompleted} day(s)` : 'N/A';

  return (
    <div className="p-4 space-y-6">
      <AnimatePresence>
        {showNotification && (
          <Notification
            type={notificationType}
            message={notificationMessage}
            onClose={() => setShowNotification(false)}
            show={true}
          />
        )}
      </AnimatePresence>

      <h2 className="text-xl font-bold">User Investment Summary for {userData.fullName}</h2>

      {/* Account Actions */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-bold text-blue-900 mb-4">Account Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => setIsCreditModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            Credit Account
          </button>
          <button 
            onClick={() => setIsDebitModalOpen(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
          >
            Debit Account
          </button>
          <button 
            onClick={() => setIsRestartModalOpen(true)}
            className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Restart Plan
          </button>
        </div>
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Email</h3>
          <p className="text-lg font-semibold">{userData.email}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Wallet Balance</h3>
          <p className="text-lg font-semibold">${(userData.walletBalance || 0).toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Overall Status</h3>
          <p className="text-lg font-semibold capitalize">{userData.status || 'active'}</p>
          <div className="mt-2 space-x-2">
            <button 
              onClick={() => toggleUserStatus('active')}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
            >
              Activate
            </button>
            <button 
              onClick={() => toggleUserStatus('suspended')}
              className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
            >
              Suspend
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Earning Status</h3>
          <p className="text-lg font-semibold capitalize">{userData.earningStatus || 'running'}</p>
          <div className="mt-2 space-x-2">
            <button 
              onClick={() => handleEarningStatusChange('running')}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
            >
              Resume
            </button>
            <button 
              onClick={() => handleEarningStatusChange('paused')}
              className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
            >
              Pause
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Last ROI Payment</h3>
          <p className="text-lg font-semibold">{userData.lastRoiPaymentDate || 'N/A'}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Active Investments</h3>
          <p className="text-lg font-semibold">{userData.hasActiveInvestments ? 'Yes' : 'No'}</p>
        </div>
        
        {/* Admin Note Input */}
        <div className="bg-white rounded-xl shadow p-4 md:col-span-3">
          <h3 className="text-sm text-gray-600 mb-1">Admin Note</h3>
          <textarea 
            className="w-full border p-2 rounded" 
            value={adminNote} 
            onChange={(e) => setAdminNote(e.target.value)} 
            rows="3"
          ></textarea>
          <button 
            onClick={handleAdminNoteSave}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Note
          </button>
        </div>
      </div>

      {/* Investment Details */}
      {investmentData.activePlan && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-4">Investment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm text-gray-600 mb-1">Plan Name</h4>
              <p className="font-semibold">{investmentData.activePlan.planName || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm text-gray-600 mb-1">Investment Amount</h4>
              <p className="font-semibold">${(investmentData.activePlan.amount || 0).toFixed(2)}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm text-gray-600 mb-1">ROI Percentage</h4>
              <p className="font-semibold">{(userData.currentPlanRoiPercentage || 0) * 100}%</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm text-gray-600 mb-1">Days Completed</h4>
              <p className="font-semibold">{currentPlanDaysCompleted} / 7</p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm text-gray-600 mb-1">Total ROI Earned</h4>
              <p className="font-semibold text-green-600">${totalRoiEarned.toFixed(2)}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm text-gray-600 mb-1">Next ROI Payment</h4>
              <p className="font-semibold">{nextPayment}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-bold mb-4">Transaction History</h3>
        {userData.transactionHistory && userData.transactionHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userData.transactionHistory.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${transaction.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No transactions yet.</p>
        )}
      </div>

      {/* KYC Documents */}
      {userData.kycDocs && userData.kycDocs.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold mb-4">KYC Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData.kycDocs.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold">{doc.type}</h4>
                <p className="text-sm text-gray-600">{doc.fileName}</p>
                {doc.url && (
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                  >
                    View Document
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {/* Credit Modal */}
      <AnimatePresence>
        {isCreditModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm p-6 shadow-xl relative rounded-xl"
            >
              <button 
                onClick={() => setIsCreditModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Credit User Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the amount to credit {userData.fullName}'s account.
              </p>
              <input 
                type="number" 
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Amount to credit"
                className="w-full p-2 border rounded-md mb-4"
              />
              <button 
                onClick={handleCreditUser}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
              >
                Confirm Credit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debit Modal */}
      <AnimatePresence>
        {isDebitModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm p-6 shadow-xl relative rounded-xl"
            >
              <button 
                onClick={() => setIsDebitModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Debit User Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the amount to debit from {userData.fullName}'s account.
              </p>
              <input 
                type="number" 
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Amount to debit"
                className="w-full p-2 border rounded-md mb-4"
              />
              <button 
                onClick={handleDebitUser}
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
              >
                Confirm Debit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restart Plan Modal */}
      <AnimatePresence>
        {isRestartModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm p-6 shadow-xl relative rounded-xl"
            >
              <button 
                onClick={() => setIsRestartModalOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Restart Investment Plan</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to restart {userData.fullName}'s investment plan? 
                This will reset the start date to today.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsRestartModalOpen(false)}
                  className="w-full py-2 rounded-md border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRestartPlan}
                  className="w-full bg-blue-800 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Confirm Restart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}