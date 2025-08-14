'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiMoreVertical, FiX } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { useFirebase } from '@/lib/firebaseContext';
import { HiOutlineEye, HiOutlineTrash, HiOutlineBan, HiOutlineUserRemove } from 'react-icons/hi';
import DetailRow from '../Utils/DetailRow';
import Notification from '../Notifications/notification';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterActiveInvestment, setFilterActiveInvestment] = useState(false);
  const { allUsers, allInvestments } = useFirebase();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- NEW STATE FOR ADMIN MODALS ---
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  // ------------------------------------

  // NOTIFICATION
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');

  // Memoized lists for efficiency. This logic now only includes users with an ACTIVE investment.
  const usersWithActiveInvestments = useMemo(() => {
    if (!allUsers || !allInvestments) return [];
    
    // Create a Set of user IDs from investment records that are explicitly marked as active.
    const activeInvestmentUserIds = new Set(
      allInvestments
        .filter(inv => inv.isActive === true) // Filter for active investments
        .map(inv => inv.id) // Get the user ID from the active investment record
    );
    
    // Filter all users to find those whose IDs are in our set of active investors.
    return allUsers.filter(user => activeInvestmentUserIds.has(user.id));
  }, [allUsers, allInvestments]);
  
  // Combine all filtering logic into a single memoized variable.
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    let usersToFilter = filterActiveInvestment ? usersWithActiveInvestments : allUsers;
  
    return usersToFilter.filter((user) => {
      const matchesSearch =
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  
      const matchesFilter =
        filterStatus === null ? true : user.verified === filterStatus;
  
      return matchesSearch && matchesFilter;
    });
  }, [allUsers, usersWithActiveInvestments, searchQuery, filterStatus, filterActiveInvestment]);

  const suspendUser = async (userId) => {
    setOpenDropdown(null);
    try {
      const response = await fetch('/api/suspendUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {
        setNotificationMessage('Failed to update user suspension status.');
        setNotificationType('error');
        setShowNotification(true);

        setTimeout(() => {
          setShowNotification(false);
        }, 5000);

        return;
      }
  
      const data = await response.json();

      setNotificationMessage('User suspension status updated.');
      setNotificationType('success');
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 5000);


      return data;
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  };


  const removeUser = async (userId) => {
    setOpenDropdown(null);
    try {
      const response = await fetch('/api/removeUser', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {

        setNotificationMessage('Unable to delete user account.');
        setNotificationType('error');
        setShowNotification(true);
    
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return;
      }
  
      const data = await response.json();
  
      setNotificationMessage('User account deleted successfully.');
      setNotificationType('success');
      setShowNotification(true);
  
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  };
  
  // --- NEW HANDLER FUNCTIONS FOR ADMIN ACTIONS ---
  const handleCreditUser = async () => {
    if (!selectedUser || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/creditUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully credited ${selectedUser.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to credit ${selectedUser.fullName}'s account.`);
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
    if (!selectedUser || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/debitUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully debited ${selectedUser.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to debit ${selectedUser.fullName}'s account.`);
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
    if (!selectedUser) return;
    setLoading(true);

    try {
        const response = await fetch('/api/restartPlan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser.id }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully restarted ${selectedUser.fullName}'s plan.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to restart ${selectedUser.fullName}'s plan.`);
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
  // ------------------------------------


  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <h1 className="text-xl lg:text-2xl font-bold mb-6 text-blue-900">Manage Users</h1>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email"
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterActiveInvestment(false)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${!filterActiveInvestment ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilterActiveInvestment(true)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${filterActiveInvestment ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Active Investments
          </button>
        </div>
      </div>

      {/* Loading state: Show a spinner if allUsers is null, indicating data is being fetched */}
      {!allUsers ? (
          <div className="text-center text-gray-500 p-8">Loading users...</div>
      ) : (
        <div className="grid gap-2 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center">No users found.</p>
          ) : (
            filteredUsers
            .filter(user => user.fullName !== "Administrator")
            .map((user, idx) => (
              <div key={idx} className="relative bg-white p-5 rounded shadow-sm">
                {/* User Info + Dropdown Row */}
                <div className="flex justify-between items-start gap-4 mb-4 lg:mb-6">
                  {/* Avatar + Name + Email */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <FaUserCircle className="text-4xl text-gray-400" />
                      {user.verified && (
                        <BsCheckCircleFill
                          className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full"
                          size={16}
                          style={{ borderWidth: 2, borderColor: 'white', borderStyle: 'solid' }}
                        />
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-semibold text-gray-800">{user.fullName}</h2>
                      <p className="text-xs lg:text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Dropdown Button & Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiMoreVertical size={20} />
                    </button>

                    {openDropdown === idx && (
                      <div className="absolute right-0 mt-2 w-[fit-content] bg-white border rounded-md shadow-lg z-[9999] text-sm text-gray-700">
                        {/* CHANGE: This button now uses a Link to navigate to the new admin profile page */}
                        <div
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenDropdown(null);
                            }}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                          >
                            <HiOutlineEye className="text-gray-500" />
                            View Details
                          </div>
                        <div
                          onClick={() => suspendUser(user.userId)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          {user.suspended ? (
                            <>
                              <HiOutlineUserRemove className="text-green-500" />
                              Remove Suspension
                            </>
                          ) : (
                            <>
                              <HiOutlineBan className="text-yellow-500" />
                              Suspend User
                            </>
                          )}
                        </div>
                        {/* --- NEW DROPDOWN ITEMS FOR ADMIN ACTIONS --- */}
                        <div
                          onClick={() => {
                            setSelectedUser(user);
                            setIsCreditModalOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineEye className="text-green-500" />
                          Credit Account
                        </div>
                        <div
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDebitModalOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineTrash className="text-red-500" />
                          Debit Account
                        </div>
                        <div
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRestartModalOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineBan className="text-blue-500" />
                          Restart Plan
                        </div>
                        {/* ------------------------------------------- */}
                        <div
                          onClick={() => removeUser(user.userId)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineTrash className="text-red-500" />
                          Remove User
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Joined Date */}
                <div className="flex justify-between items-center">
                  {!user.verified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border text-yellow-600 border-yellow-200 bg-yellow-50">
                      Pending Verification
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border text-green-600 border-green-200 bg-green-50">
                      Verified
                    </span>
                  )}
                  <p className="text-xs text-gray-400">
                    Joined: {user.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- NEW MODAL FOR VIEWING USER DETAILS --- */}
      {selectedUser && (
        <AnimatePresence>
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
              className="bg-white w-full max-w-lg p-6 lg:p-10 shadow-xl relative rounded-xl"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <FaUserCircle className="text-5xl text-gray-300" />
                  {selectedUser.verified && (
                    <BsCheckCircleFill
                      className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full"
                      size={16}
                      style={{ borderWidth: 2, borderColor: 'white', borderStyle: 'solid' }}
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{selectedUser.fullName}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              {/* Details */}
              <div className="space-y-3">
                <DetailRow label="User name" value={selectedUser.userName} />
                <DetailRow label="Joined" value={selectedUser.createdAt?.toDate().toLocaleDateString()} />
                <DetailRow label="Verified" value={selectedUser.verified ? 'Yes' : 'No'} />
                <DetailRow label="Address" value={selectedUser.address} />
                <DetailRow label="Country" value={selectedUser.country} />
                <DetailRow label="Gender" value={selectedUser.gender} />
                <DetailRow label="Phone" value={selectedUser.phone} />
                <DetailRow label="Telegram" value={selectedUser.telegram} />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* --- NEW MODAL FOR CREDIT ACTION --- */}
      {selectedUser && isCreditModalOpen && (
        <AnimatePresence>
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
                        Enter the amount to credit {selectedUser?.fullName}'s account.
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
        </AnimatePresence>
      )}

      {/* --- NEW MODAL FOR DEBIT ACTION --- */}
      {selectedUser && isDebitModalOpen && (
        <AnimatePresence>
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
                        Enter the amount to debit from {selectedUser?.fullName}'s account.
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
        </AnimatePresence>
      )}

      {/* --- NEW MODAL FOR RESTART PLAN ACTION --- */}
      {selectedUser && isRestartModalOpen && (
        <AnimatePresence>
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
                        Are you sure you want to restart {selectedUser?.fullName}'s investment plan? This will reset the start date to today.
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
        </AnimatePresence>
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
}
'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiMoreVertical, FiX } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import { useFirebase } from '@/lib/firebaseContext';
import { HiOutlineEye, HiOutlineTrash, HiOutlineBan, HiOutlineUserRemove } from 'react-icons/hi';
import DetailRow from '../Utils/DetailRow';
import Notification from '../Notifications/notification';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterActiveInvestment, setFilterActiveInvestment] = useState(false);
  const { allUsers, allInvestments } = useFirebase();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- NEW STATE FOR ADMIN MODALS ---
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  // ------------------------------------

  // NOTIFICATION
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');

  // Memoized lists for efficiency. This logic now only includes users with an ACTIVE investment.
  const usersWithActiveInvestments = useMemo(() => {
    if (!allUsers || !allInvestments) return [];
    
    // Create a Set of user IDs from investment records that are explicitly marked as active.
    const activeInvestmentUserIds = new Set(
      allInvestments
        .filter(inv => inv.isActive === true) // Filter for active investments
        .map(inv => inv.id) // Get the user ID from the active investment record
    );
    
    // Filter all users to find those whose IDs are in our set of active investors.
    return allUsers.filter(user => activeInvestmentUserIds.has(user.id));
  }, [allUsers, allInvestments]);
  
  // Combine all filtering logic into a single memoized variable.
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    let usersToFilter = filterActiveInvestment ? usersWithActiveInvestments : allUsers;
  
    return usersToFilter.filter((user) => {
      const matchesSearch =
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  
      const matchesFilter =
        filterStatus === null ? true : user.verified === filterStatus;
  
      return matchesSearch && matchesFilter;
    });
  }, [allUsers, usersWithActiveInvestments, searchQuery, filterStatus, filterActiveInvestment]);

  const suspendUser = async (userId) => {
    setOpenDropdown(null);
    try {
      const response = await fetch('/api/suspendUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {
        setNotificationMessage('Failed to update user suspension status.');
        setNotificationType('error');
        setShowNotification(true);

        setTimeout(() => {
          setShowNotification(false);
        }, 5000);

        return;
      }
  
      const data = await response.json();

      setNotificationMessage('User suspension status updated.');
      setNotificationType('success');
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 5000);


      return data;
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  };


  const removeUser = async (userId) => {
    setOpenDropdown(null);
    try {
      const response = await fetch('/api/removeUser', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
  
      if (!response.ok) {

        setNotificationMessage('Unable to delete user account.');
        setNotificationType('error');
        setShowNotification(true);
    
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return;
      }
  
      const data = await response.json();
  
      setNotificationMessage('User account deleted successfully.');
      setNotificationType('success');
      setShowNotification(true);
  
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  };
  
  // --- NEW HANDLER FUNCTIONS FOR ADMIN ACTIONS ---
  const handleCreditUser = async () => {
    if (!selectedUser || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/creditUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully credited ${selectedUser.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to credit ${selectedUser.fullName}'s account.`);
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
    if (!selectedUser || !amountInput) return;
    setLoading(true);

    try {
        const response = await fetch('/api/debitUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser.id, amount: parseFloat(amountInput) }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully debited ${selectedUser.fullName}'s account.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to debit ${selectedUser.fullName}'s account.`);
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
    if (!selectedUser) return;
    setLoading(true);

    try {
        const response = await fetch('/api/restartPlan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser.id }),
        });

        if (response.ok) {
            setNotificationMessage(`Successfully restarted ${selectedUser.fullName}'s plan.`);
            setNotificationType('success');
        } else {
            setNotificationMessage(`Failed to restart ${selectedUser.fullName}'s plan.`);
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
  // ------------------------------------


  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <h1 className="text-xl lg:text-2xl font-bold mb-6 text-blue-900">Manage Users</h1>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email"
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterActiveInvestment(false)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${!filterActiveInvestment ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilterActiveInvestment(true)}
            className={`px-3 py-2 rounded-md text-sm font-medium ${filterActiveInvestment ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Active Investments
          </button>
        </div>
      </div>

      {/* Loading state: Show a spinner if allUsers is null, indicating data is being fetched */}
      {!allUsers ? (
          <div className="text-center text-gray-500 p-8">Loading users...</div>
      ) : (
        <div className="grid gap-2 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center">No users found.</p>
          ) : (
            filteredUsers
            .filter(user => user.fullName !== "Administrator")
            .map((user, idx) => (
              <div key={idx} className="relative bg-white p-5 rounded shadow-sm">
                {/* User Info + Dropdown Row */}
                <div className="flex justify-between items-start gap-4 mb-4 lg:mb-6">
                  {/* Avatar + Name + Email */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <FaUserCircle className="text-4xl text-gray-400" />
                      {user.verified && (
                        <BsCheckCircleFill
                          className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full"
                          size={16}
                          style={{ borderWidth: 2, borderColor: 'white', borderStyle: 'solid' }}
                        />
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm lg:text-base font-semibold text-gray-800">{user.fullName}</h2>
                      <p className="text-xs lg:text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Dropdown Button & Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiMoreVertical size={20} />
                    </button>

                    {openDropdown === idx && (
                      <div className="absolute right-0 mt-2 w-[fit-content] bg-white border rounded-md shadow-lg z-[9999] text-sm text-gray-700">
                        {/* CHANGE: This button now uses a Link to navigate to the new admin profile page */}
                        <div
                            onClick={() => {
                              setSelectedUser(user);
                              setOpenDropdown(null);
                            }}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                          >
                            <HiOutlineEye className="text-gray-500" />
                            View Details
                          </div>
                        <div
                          onClick={() => suspendUser(user.userId)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          {user.suspended ? (
                            <>
                              <HiOutlineUserRemove className="text-green-500" />
                              Remove Suspension
                            </>
                          ) : (
                            <>
                              <HiOutlineBan className="text-yellow-500" />
                              Suspend User
                            </>
                          )}
                        </div>
                        {/* --- NEW DROPDOWN ITEMS FOR ADMIN ACTIONS --- */}
                        <div
                          onClick={() => {
                            setSelectedUser(user);
                            setIsCreditModalOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineEye className="text-green-500" />
                          Credit Account
                        </div>
                        <div
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDebitModalOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineTrash className="text-red-500" />
                          Debit Account
                        </div>
                        <div
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRestartModalOpen(true);
                            setOpenDropdown(null);
                          }}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineBan className="text-blue-500" />
                          Restart Plan
                        </div>
                        {/* ------------------------------------------- */}
                        <div
                          onClick={() => removeUser(user.userId)}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                        >
                          <HiOutlineTrash className="text-red-500" />
                          Remove User
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Joined Date */}
                <div className="flex justify-between items-center">
                  {!user.verified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border text-yellow-600 border-yellow-200 bg-yellow-50">
                      Pending Verification
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium border text-green-600 border-green-200 bg-green-50">
                      Verified
                    </span>
                  )}
                  <p className="text-xs text-gray-400">
                    Joined: {user.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- NEW MODAL FOR VIEWING USER DETAILS --- */}
      {selectedUser && (
        <AnimatePresence>
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
              className="bg-white w-full max-w-lg p-6 lg:p-10 shadow-xl relative rounded-xl"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <FaUserCircle className="text-5xl text-gray-300" />
                  {selectedUser.verified && (
                    <BsCheckCircleFill
                      className="absolute bottom-0 right-0 text-blue-500 bg-white rounded-full"
                      size={16}
                      style={{ borderWidth: 2, borderColor: 'white', borderStyle: 'solid' }}
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{selectedUser.fullName}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              {/* Details */}
              <div className="space-y-3">
                <DetailRow label="User name" value={selectedUser.userName} />
                <DetailRow label="Joined" value={selectedUser.createdAt?.toDate().toLocaleDateString()} />
                <DetailRow label="Verified" value={selectedUser.verified ? 'Yes' : 'No'} />
                <DetailRow label="Address" value={selectedUser.address} />
                <DetailRow label="Country" value={selectedUser.country} />
                <DetailRow label="Gender" value={selectedUser.gender} />
                <DetailRow label="Phone" value={selectedUser.phone} />
                <DetailRow label="Telegram" value={selectedUser.telegram} />
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* --- NEW MODAL FOR CREDIT ACTION --- */}
      {selectedUser && isCreditModalOpen && (
        <AnimatePresence>
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
                        Enter the amount to credit {selectedUser?.fullName}'s account.
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
        </AnimatePresence>
      )}

      {/* --- NEW MODAL FOR DEBIT ACTION --- */}
      {selectedUser && isDebitModalOpen && (
        <AnimatePresence>
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
                        Enter the amount to debit from {selectedUser?.fullName}'s account.
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
        </AnimatePresence>
      )}

      {/* --- NEW MODAL FOR RESTART PLAN ACTION --- */}
      {selectedUser && isRestartModalOpen && (
        <AnimatePresence>
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
                        Are you sure you want to restart {selectedUser?.fullName}'s investment plan? This will reset the start date to today.
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
        </AnimatePresence>
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
}
