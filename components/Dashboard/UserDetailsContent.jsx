// components/Dashboard/UserDetailsContent.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import db from '../../lib/firebase'; // Corrected path based on your structure
import { AnimatePresence } from 'framer-motion';
import Notification from '../Notifications/notifications';


/**
 * UserDetailsContent component displays and manages a single user's details.
 * It is designed to be a reusable component that receives the userId as a prop.
 *
 * @param {object} props - The component props.
 * @param {string} props.userId - The ID of the user whose details are to be displayed.
 */
export default function UserDetailsContent({ userId }) {
    // State variables for user data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [amount, setAmount] = useState(''); // For credit/debit amount input
    const [status, setStatus] = useState('active'); // User's account status
    const [walletBalance, setWalletBalance] = useState(0);
    const [earningStatus, setEarningStatus] = useState('running'); // <--- FIXED THIS LINE
    const [adminNote, setAdminNote] = useState('');
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [kycDocs, setKycDocs] = useState([]);

    const [actionType, setActionType] = useState(null); // 'credit' or 'debit' mode for wallet actions

    // States for loading and notifications
    const [loading, setLoading] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState(''); // 'success' or 'error'
    const [notificationMessage, setNotificationMessage] = useState('');

    // Effect to fetch user data when userId changes
    useEffect(() => {
        if (!userId) {
            // If userId is not available (e.g., during initial render before router.query is ready)
            // Optionally, show a message or redirect if no user ID is provided after load.
            return;
        }

        const fetchUser = async () => {
            setLoading(true); // Start loading state
            try {
                const userRef = doc(db, 'users', userId); // Reference to the specific user document
                const userSnap = await getDoc(userRef); // Fetch the document

                if (userSnap.exists()) {
                    // If document exists, set the state variables with user data
                    const data = userSnap.data();
                    setName(data.name || '');
                    setEmail(data.email || '');
                    setPhone(data.phone || '');
                    setPhotoURL(data.photoURL || '');
                    setWalletBalance(data.walletBalance || 0);
                    setStatus(data.status || 'active');
                    setEarningStatus(data.earningStatus || 'running');
                    setAdminNote(data.adminNote || '');
                    setTransactionHistory(data.transactionHistory || []);
                    setKycDocs(data.kycDocs || []);
                } else {
                    // User document not found
                    setNotificationType('error');
                    setNotificationMessage('User not found.');
                    setShowNotification(true);
                }
            } catch (error) {
                // Handle errors during data fetching
                console.error("Error fetching user:", error);
                setNotificationType('error');
                setNotificationMessage('Failed to load user details.');
                setShowNotification(true);
            } finally {
                setLoading(false); // End loading state regardless of success or failure
            }
        };

        fetchUser();
    }, [userId]); // Dependency array: re-run effect if userId changes

    /**
     * Handles credit or debit actions for the user's wallet.
     * @param {'credit' | 'debit'} type - The type of action to perform.
     */
    const handleAction = async (type) => {
        // Validate amount input
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            setNotificationType('error');
            setNotificationMessage('Please enter a valid amount greater than zero.');
            setShowNotification(true);
            return;
        }

        const value = parseFloat(amount);
        // Prevent debiting more than current wallet balance
        if (type === 'debit' && value > walletBalance) {
            setNotificationType('error');
            setNotificationMessage('Cannot debit more than wallet balance.');
            setShowNotification(true);
            return;
        }

        setLoading(true); // Start loading state for the action
        const userRef = doc(db, 'users', userId); // Reference to the user's document
        const date = new Date();
        const formattedDate = date.toLocaleString('en-US', { // Format date for display
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calculate new balance
        const newBalance = type === 'credit' ? walletBalance + value : walletBalance - value;

        try {
            // Update wallet balance and add to transaction history in Firestore
            await updateDoc(userRef, {
                walletBalance: newBalance,
                transactionHistory: arrayUnion({ // Use arrayUnion to safely add to the array
                    type: type === 'credit' ? 'Credit' : 'Debit',
                    amount: value,
                    date: date.toISOString(), // Store ISO string for precise date
                    formattedDate // Store formatted string for display
                })
            });

            // Update local state to reflect changes immediately
            setWalletBalance(newBalance);
            setTransactionHistory(prev => [...prev, {
                type: type === 'credit' ? 'Credit' : 'Debit',
                amount: value,
                date: date.toISOString(),
                formattedDate
            }]);
            setAmount(''); // Clear amount input
            setActionType(null); // Reset action type
            setNotificationType('success');
            setNotificationMessage(`${type === 'credit' ? 'Credited' : 'Debited'} successfully!`);
            setShowNotification(true);
        } catch (err) {
            console.error(err);
            setNotificationType('error');
            setNotificationMessage(`Failed to ${type} user.`);
            setShowNotification(true);
        } finally {
            setLoading(false); // End loading state
        }
    };

    /**
     * Toggles the user's account status between 'active' and 'suspended'.
     * @param {'active' | 'suspended'} newStatus - The new status to set.
     */
    const toggleUserStatus = async (newStatus) => {
        setLoading(true);
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, { status: newStatus });
            setStatus(newStatus); // Update local state
            setNotificationType('success');
            setNotificationMessage(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
            setShowNotification(true);
        } catch (error) {
            console.error(error);
            setNotificationType('error');
            setNotificationMessage('Failed to update user status.');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Saves the admin's note for the user to Firestore.
     */
    const handleAdminNoteSave = async () => {
        setLoading(true);
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, { adminNote });
            setNotificationType('success');
            setNotificationMessage('Admin note saved successfully!');
            setShowNotification(true);
        } catch (error) {
            console.error(error);
            setNotificationType('error');
            setNotificationMessage('Failed to save admin note.');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Changes the user's earning status.
     * @param {'running' | 'paused' | 'stopped'} newStatus - The new earning status.
     */
    const handleEarningStatusChange = async (newStatus) => {
        setLoading(true);
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, { earningStatus: newStatus });
            setEarningStatus(newStatus); // Update local state
            setNotificationType('success');
            setNotificationMessage(`Earnings ${newStatus === 'running' ? 'resumed' : newStatus === 'paused' ? 'paused' : 'stopped'} successfully!`);
            setShowNotification(true);
        } catch (error) {
            console.error(error);
            setNotificationType('error');
            setNotificationMessage('Failed to update earnings status.');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total credit and debit from transaction history
    const totalCredit = transactionHistory.filter(txn => txn.type === 'Credit').reduce((acc, txn) => acc + txn.amount, 0);
    const totalDebit = transactionHistory.filter(txn => txn.type === 'Debit').reduce((acc, txn) => acc + txn.amount, 0);

    return (
        // Fragment used as DashboardLayout is now wrapped in the page component
        <>
            {/* Loading Spinner with AnimatePresence for smooth transitions */}
            <AnimatePresence>
                {loading && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 rounded-2xl">
                        <div className="w-8 lg:w-12 h-8 lg:h-12 rounded-full animate-spin border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-purple-500 shadow-lg"></div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Component */}
            {showNotification && (
                <Notification
                    type={notificationType}
                    message={notificationMessage}
                    onClose={() => setShowNotification(false)}
                    show={showNotification}
                />
            )}

            {/* Main content area for user details */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* User Profile Section */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <img src={photoURL || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full border object-cover" alt="User profile" />
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-bold">{name}</h1>
                            {/* Display userId from props */}
                            <p className="text-sm text-gray-600">ID: {userId}</p>
                            <p className="text-sm text-gray-600">{email}</p>
                            <p className="text-sm text-gray-600">{phone}</p>
                            <p className={`text-sm font-semibold ${status === 'active' ? 'text-green-600' : 'text-red-600'}`}>Status: {status}</p>
                        </div>
                    </div>
                    {/* User Status Toggle Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => toggleUserStatus('suspended')}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg w-full sm:w-auto"
                            disabled={loading}
                        >
                            Suspend
                        </button>
                        <button
                            onClick={() => toggleUserStatus('active')}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg w-full sm:w-auto"
                            disabled={loading}
                        >
                            Activate
                        </button>
                    </div>
                </div>

                {/* Earning Status Section */}
                <div className="mt-3">
                    <h3 className="text-sm font-semibold mb-2">Earning Status</h3>
                    <div className="flex gap-3 flex-wrap">
                        {[
                            { label: '✅ Running', value: 'running', color: 'text-green-600' },
                            { label: '⏸️ Paused', value: 'paused', color: 'text-yellow-600' },
                            { label: '🛑 Stopped', value: 'stopped', color: 'text-red-600' }
                        ].map((option) => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="earningStatus"
                                    value={option.value}
                                    checked={earningStatus === option.value}
                                    onChange={() => handleEarningStatusChange(option.value)}
                                    className="accent-blue-600"
                                    disabled={loading}
                                />
                                <span className={`${option.color} text-sm font-medium`}>{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Wallet Balance Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-1">Wallet Balance</h2>
                    <p className="text-3xl font-bold">${walletBalance.toLocaleString()}</p> {/* Display in dollars */}
                </div>

                {/* Quick Wallet Actions Section */}
                <div className="bg-white rounded-2xl shadow p-4 mb-4">
                    <h2 className="text-base font-semibold mb-3">Quick Wallet Actions</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActionType('credit')}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg"
                            disabled={loading}
                        >
                            Credit
                        </button>
                        <button
                            onClick={() => setActionType('debit')}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-lg"
                            disabled={loading}
                        >
                            Debit
                        </button>
                    </div>

                    {actionType && (
                        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full sm:w-auto"
                                placeholder="Enter amount"
                                disabled={loading}
                            />
                            <button
                                onClick={() => handleAction(actionType)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
                                disabled={loading}
                            >
                                Confirm {actionType === 'credit' ? 'Credit' : 'Debit'}
                            </button>
                            <button
                                onClick={() => { setAmount(''); setActionType(null); }}
                                className="text-sm text-gray-500 hover:underline"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Admin Notes Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-3">Admin Notes</h2>
                    <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="w-full min-h-[120px] border border-gray-300 rounded-xl px-4 py-2 resize-none"
                        placeholder="Add notes here..."
                        disabled={loading}
                    />
                    <div className="mt-3 text-right">
                        <button
                            onClick={handleAdminNoteSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg"
                            disabled={loading}
                        >
                            Save Note
                        </button>
                    </div>
                </div>

                {/* KYC Documents Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-3">KYC Documents</h2>
                    {kycDocs.length === 0 ? (
                        <p className="text-gray-500">No KYC documents uploaded.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {kycDocs.map((doc, index) => (
                                <div key={index} className="border rounded-xl overflow-hidden shadow">
                                    <img src={doc.url} alt={doc.name} className="w-full h-48 object-cover" />
                                    <div className="p-3">
                                        <p className="text-sm font-medium">{doc.name}</p>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Transaction History Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-semibold mb-3">Transaction History</h2>
                    <div className="flex justify-between text-sm font-medium mb-2">
                        <p>Total Credit: <span className="text-green-600">${totalCredit.toLocaleString()}</span></p>
                        <p>Total Debit: <span className="text-red-600">${totalDebit.toLocaleString()}</span></p>
                    </div>
                    <ul className="divide-y text-sm">
                        {transactionHistory.length === 0 ? (
                            <li className="text-gray-500">No records yet.</li>
                        ) : (
                            transactionHistory.map((txn, i) => (
                                <li key={i} className="flex justify-between py-2 items-center">
                                    <div>
                                        <p className="font-medium">{txn.type}</p>
                                        <p className="text-xs text-gray-500">{txn.formattedDate || txn.date}</p>
                                    </div>
                                    <span className={txn.type === 'Debit' ? 'text-red-600' : 'text-green-600'}>
                                        ${txn.amount.toLocaleString()}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
}
