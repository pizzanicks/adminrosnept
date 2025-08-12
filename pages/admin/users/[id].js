// This file should be saved as pages/admin/users/[id].js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiX, FiInfo } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import DetailRow from '@/components/Dashboard/Utils/DetailRow';
import Notification from '@/components/Notifications/notification';
import AdminLayout from '@/components/AdminDashboard/AdminLayout'; // Assuming you have an AdminLayout
import { useFirebase } from '@/lib/firebaseContext';
import { doc, getDoc } from 'firebase/firestore';
import db from '@/lib/firebase'; // Assuming your Firestore instance is exported here

export default function AdminUserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { allUsers, allInvestments } = useFirebase();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userInvestment, setUserInvestment] = useState(null);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');

  // Fetch the specific user and investment data from the context
  useEffect(() => {
    if (id && allUsers && allInvestments) {
      const selectedUser = allUsers.find(u => u.id === id);
      const selectedInvestment = allInvestments.find(inv => inv.id === id);
      setUser(selectedUser);
      setUserInvestment(selectedInvestment);
      setLoading(false);
    }
  }, [id, allUsers, allInvestments]);

  // Handler functions for admin actions
  const handleCreditUser = async () => {
    if (!user || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/creditUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully credited ${user.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to credit ${user.fullName}'s account.`);
            setNotificationType('error');
        }
    } catch (error) {
        setNotificationMessage('An error occurred while processing the request.');
        setNotificationType('error');
    } finally {
        setLoading(false);
        setShowNotification(true);
        setIsCreditModalOpen(false);
        setAmountInput('');
        setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleDebitUser = async () => {
    if (!user || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/debitUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully debited ${user.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to debit ${user.fullName}'s account.`);
            setNotificationType('error');
        }
    } catch (error) {
        setNotificationMessage('An error occurred while processing the request.');
        setNotificationType('error');
    } finally {
        setLoading(false);
        setShowNotification(true);
        setIsDebitModalOpen(false);
        setAmountInput('');
        setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleRestartPlan = async () => {
    if (!user) return;
    setLoading(true);

    try {
        const response = await fetch('/api/restartPlan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully restarted ${user.fullName}'s plan.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to restart ${user.fullName}'s plan.`);
            setNotificationType('error');
        }
    } catch (error) {
        setNotificationMessage('An error occurred while processing the request.');
        setNotificationType('error');
    } finally {
        setLoading(false);
        setShowNotification(true);
        setIsRestartModalOpen(false);
        setTimeout(() => setShowNotification(false), 5000);
    }
  };

  if (loading || !user) {
    return <AdminLayout><div className="p-6 text-center text-gray-500">Loading user data...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto min-h-screen">
        <h1 className="text-xl lg:text-2xl font-bold mb-6 text-blue-900">
          Admin Profile: {user.fullName}
        </h1>

        <div className="bg-white p-6 rounded-md shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <FaUserCircle className="text-5xl text-gray-300" />
              {user.verified && (
                <BsCheckCircleFill
                  className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full"
                  size={16}
                  style={{ borderWidth: 2, borderColor: 'white', borderStyle: 'solid' }}
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{user.fullName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <DetailRow label="User ID" value={user.id} />
            <DetailRow label="User name" value={user.userName} />
            <DetailRow label="Joined" value={user.createdAt?.toDate().toLocaleDateString()} />
            <DetailRow label="Verified" value={user.verified ? 'Yes' : 'No'} />
            <DetailRow label="Address" value={user.address} />
            <DetailRow label="Country" value={user.country} />
            <DetailRow label="Gender" value={user.gender} />
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow label="Telegram" value={user.telegram} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-md shadow-sm">
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
      </div>

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
                Enter the amount to credit {user?.fullName}'s account.
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
                Enter the amount to debit from {user?.fullName}'s account.
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
                Are you sure you want to restart {user?.fullName}'s investment plan? This will reset the start date to today.
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


      {showNotification && (
        <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
      )}
    </AdminLayout>
  );
}
// This file should be saved as pages/admin/users/[id].js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiX, FiInfo } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import DetailRow from '@/components/Dashboard/Utils/DetailRow';
import Notification from '@/components/Notifications/notification';
import AdminLayout from '@/components/AdminDashboard/AdminLayout'; // Assuming you have an AdminLayout
import { useFirebase } from '@/lib/firebaseContext';
import { doc, getDoc } from 'firebase/firestore';
import db from '@/lib/firebase'; // Assuming your Firestore instance is exported here

export default function AdminUserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { allUsers, allInvestments } = useFirebase();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userInvestment, setUserInvestment] = useState(null);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');

  // Fetch the specific user and investment data from the context
  useEffect(() => {
    if (id && allUsers && allInvestments) {
      const selectedUser = allUsers.find(u => u.id === id);
      const selectedInvestment = allInvestments.find(inv => inv.id === id);
      setUser(selectedUser);
      setUserInvestment(selectedInvestment);
      setLoading(false);
    }
  }, [id, allUsers, allInvestments]);

  // Handler functions for admin actions
  const handleCreditUser = async () => {
    if (!user || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/creditUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully credited ${user.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to credit ${user.fullName}'s account.`);
            setNotificationType('error');
        }
    } catch (error) {
        setNotificationMessage('An error occurred while processing the request.');
        setNotificationType('error');
    } finally {
        setLoading(false);
        setShowNotification(true);
        setIsCreditModalOpen(false);
        setAmountInput('');
        setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleDebitUser = async () => {
    if (!user || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/debitUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully debited ${user.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to debit ${user.fullName}'s account.`);
            setNotificationType('error');
        }
    } catch (error) {
        setNotificationMessage('An error occurred while processing the request.');
        setNotificationType('error');
    } finally {
        setLoading(false);
        setShowNotification(true);
        setIsDebitModalOpen(false);
        setAmountInput('');
        setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleRestartPlan = async () => {
    if (!user) return;
    setLoading(true);

    try {
        const response = await fetch('/api/restartPlan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully restarted ${user.fullName}'s plan.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to restart ${user.fullName}'s plan.`);
            setNotificationType('error');
        }
    } catch (error) {
        setNotificationMessage('An error occurred while processing the request.');
        setNotificationType('error');
    } finally {
        setLoading(false);
        setShowNotification(true);
        setIsRestartModalOpen(false);
        setTimeout(() => setShowNotification(false), 5000);
    }
  };

  if (loading || !user) {
    return <AdminLayout><div className="p-6 text-center text-gray-500">Loading user data...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto min-h-screen">
        <h1 className="text-xl lg:text-2xl font-bold mb-6 text-blue-900">
          Admin Profile: {user.fullName}
        </h1>

        <div className="bg-white p-6 rounded-md shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <FaUserCircle className="text-5xl text-gray-300" />
              {user.verified && (
                <BsCheckCircleFill
                  className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full"
                  size={16}
                  style={{ borderWidth: 2, borderColor: 'white', borderStyle: 'solid' }}
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{user.fullName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <DetailRow label="User ID" value={user.id} />
            <DetailRow label="User name" value={user.userName} />
            <DetailRow label="Joined" value={user.createdAt?.toDate().toLocaleDateString()} />
            <DetailRow label="Verified" value={user.verified ? 'Yes' : 'No'} />
            <DetailRow label="Address" value={user.address} />
            <DetailRow label="Country" value={user.country} />
            <DetailRow label="Gender" value={user.gender} />
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow label="Telegram" value={user.telegram} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-md shadow-sm">
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
      </div>

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
                Enter the amount to credit {user?.fullName}'s account.
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
                Enter the amount to debit from {user?.fullName}'s account.
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
                Are you sure you want to restart {user?.fullName}'s investment plan? This will reset the start date to today.
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


      {showNotification && (
        <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
      )}
    </AdminLayout>
  );
}
